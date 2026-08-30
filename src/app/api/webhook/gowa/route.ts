import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { gowa } from "@/lib/gowa";

interface WebhookPayload {
  event?: string;
  device_id?: string;
  session_id?: string;
  payload?: {
    id?: string;
    chat_id?: string;
    from?: string;
    push_name?: string;
    sender_display_name?: string;
    from_name?: string;
    sender?: string;
    body?: string;
    message?: string;
    text?: string;
    ids?: string[];
    receipt_type?: string;
    [key: string]: unknown;
  } | null;
}

interface RuleRow {
  enabled: boolean;
  action_type: string;
  target_type: string | null;
  target_jid: string | null;
  trigger_type: string | null;
  pattern: string | null;
  reply: string | null;
  auto_read: boolean;
}

// POST /api/webhook/gowa — receives webhook events from the bot
export async function POST(request: Request) {
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

  // Verify HMAC signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get("X-Hub-Signature-256");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const body = await request.text();
    const crypto = await import("crypto");
    const expectedSignature =
      "sha256=" +
      crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Re-parse body for processing
    const payload = JSON.parse(body);
    return await processWebhookEvent(payload);
  }

  // No secret configured — process directly
  const payload = await request.json();
  return await processWebhookEvent(payload);
}

async function processWebhookEvent(payload: WebhookPayload) {
  const eventType = payload?.event;
  const deviceId = payload?.session_id ?? payload?.device_id;

  if (!eventType || !deviceId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();

  // Find the user who owns this device
  const { data: userDevice } = await supabase
    .from("user_devices")
    .select("user_id")
    .eq("device_key", deviceId)
    .single();

  if (!userDevice) {
    return NextResponse.json({ ok: true });
  }

  const userId = userDevice.user_id;

  // Log the event
  await supabase.from("logs").insert({
    user_id: userId,
    device_key: deviceId,
    event_type: mapEventType(eventType),
    chat_jid: payload?.payload?.chat_id || payload?.payload?.from || null,
    chat_name:
      payload?.payload?.sender_display_name ||
      payload?.payload?.from_name ||
      payload?.payload?.push_name ||
      null,
    sender_jid: payload?.payload?.from || null,
    sender_name:
      payload?.payload?.sender_display_name || payload?.payload?.from_name || null,
    body: extractBody(payload?.payload, eventType),
    metadata: payload?.payload || null,
  });

  // Process message events for rule engine
  if (eventType === "message" && payload.payload) {
    await processMessageEvent(userId, deviceId, payload.payload);
  }

  return NextResponse.json({ ok: true });
}

async function processMessageEvent(
  userId: string,
  deviceId: string,
  messagePayload: NonNullable<WebhookPayload["payload"]>
) {
  if (!messagePayload) return;

  const supabase = createServiceClient();
  const from = messagePayload.chat_id || messagePayload.from || "";
  const text = messagePayload.body || messagePayload.message || messagePayload.text || "";
  const senderName = messagePayload.sender_display_name || messagePayload.from_name || null;

  // Determine if it's a group or private chat
  const isGroup = from.endsWith("@g.us");
  const targetType = isGroup ? "group" : "private";

  // Get applicable rules for this device
  const { data: deviceRules } = await supabase
    .from("device_rules")
    .select("rule_id, rules(*)")
    .eq("device_key", deviceId)
    .eq("enabled", true);

  if (!deviceRules || deviceRules.length === 0) return;

  for (const dr of deviceRules) {
    const rule = dr.rules as RuleRow | RuleRow[] | null;
    const singleRule = Array.isArray(rule) ? rule[0] : rule;
    if (!singleRule || !singleRule.enabled) continue;

    // Check target type match
    if (singleRule.target_type && singleRule.target_type !== targetType) continue;

    // Check target JID match
    if (singleRule.target_jid && singleRule.target_jid !== from) continue;

    // Auto-read if listen rule
    if (singleRule.action_type === "listen" && singleRule.auto_read) {
      try {
        await gowa({
          method: "POST",
          path: `/message/${messagePayload.id}/read`,
          body: { phone: from },
        });
        await supabase.from("logs").insert({
          user_id: userId,
          device_key: deviceId,
          event_type: "auto_read",
          chat_jid: from,
          body: `Auto-read di ${isGroup ? "grup" : "chat"} ${senderName || from}`,
        });
      } catch {
        // silent
      }
    }

    // Auto-reply if auto_reply rule
    if (singleRule.action_type === "auto_reply" && singleRule.pattern && singleRule.reply) {
      let matches = false;

      if (singleRule.trigger_type === "keyword") {
        matches = text.toLowerCase().includes((singleRule.pattern ?? "").toLowerCase());
      } else if (singleRule.trigger_type === "regex") {
        try {
          const regex = new RegExp(singleRule.pattern ?? "", "i");
          matches = regex.test(text);
        } catch {
          // invalid regex
        }
      }

      if (matches) {
        try {
          await gowa({
            method: "POST",
            path: "/send/message",
            body: {
              phone: from,
              message: singleRule.reply,
            },
          });
          await supabase.from("logs").insert({
            user_id: userId,
            device_key: deviceId,
            event_type: "auto_reply_sent",
            chat_jid: from,
            chat_name: senderName,
            body: singleRule.reply,
          });
        } catch {
          // silent
        }
      }
    }
  }
}

function extractBody(
  p: NonNullable<WebhookPayload["payload"]> | null | undefined,
  event?: string
): string | null {
  if (!p) return null;
  const text = p.body || p.message || p.text;
  if (text) return text;
  if (event === "message.ack" && Array.isArray(p.ids) && p.ids.length > 0) {
    return `ACK ${p.receipt_type || "receipt"} (${p.ids.join(", ")})`;
  }
  return null;
}

function mapEventType(event: string): string {
  const mapping: Record<string, string> = {
    message: "message_received",
    "message.ack": "message_sent",
    "session.connected": "session_connected",
    "session.disconnected": "session_disconnected",
  };
  return mapping[event] || "message_received";
}
