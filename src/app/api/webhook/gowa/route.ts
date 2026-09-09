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

interface AutomationRow {
  id: string;
  enabled: boolean;
  trigger_category: "prefix" | "contains" | "exact" | "regex";
  trigger_type: "keyword" | "regex";
  pattern: string;
  reply: string;
  is_reply: boolean;
  mentions: string | null;
  duration: number;
  is_forwarded: boolean;
  target_type: string | null;
  target_jid: string | null;
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

  // Get applicable automations for this device (004: per-device, bukan global rules)
  const { data: automations } = await supabase
    .from("device_automations")
    .select("*")
    .eq("device_key", deviceId)
    .eq("user_id", userId)
    .eq("enabled", true);

  if (!automations || automations.length === 0) return;

  for (const auto of automations as AutomationRow[]) {
    if (!auto.enabled) continue;

    // Check target type match
    if (auto.target_type && auto.target_type !== targetType) continue;

    // Check target JID match (1 row = 1 target_jid, multi grup = duplicate rows)
    if (auto.target_jid && auto.target_jid !== from) continue;

    // Trigger match: prefix/contains/exact/regex
    let matches = false;
    const pat = auto.pattern ?? "";
    const lowerText = text.toLowerCase();
    const lowerPat = pat.toLowerCase();
    if (auto.trigger_category === "prefix") matches = lowerText.startsWith(lowerPat);
    else if (auto.trigger_category === "contains") matches = lowerText.includes(lowerPat);
    else if (auto.trigger_category === "exact") matches = lowerText === lowerPat;
    else if (auto.trigger_category === "regex" || auto.trigger_type === "regex") {
      try {
        const regex = new RegExp(pat, "i");
        matches = regex.test(text);
      } catch {}
    } else {
      // fallback keyword
      matches = lowerText.includes(lowerPat);
    }
    if (!matches) continue;

    try {
      const mentions = auto.mentions
        ? auto.mentions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      await gowa({
        method: "POST",
        path: "/send/message",
        device_id: deviceId,
        body: {
          phone: from,
          message: auto.reply,
          reply_message_id: auto.is_reply ? messagePayload.id : undefined,
          is_forwarded: auto.is_forwarded || undefined,
          duration: auto.duration || undefined,
          mentions,
        },
      });
      await supabase.from("logs").insert({
        user_id: userId,
        device_key: deviceId,
        event_type: "auto_reply_sent",
        chat_jid: from,
        chat_name: senderName,
        body: auto.reply,
        metadata: { automation_id: auto.id, trigger_category: auto.trigger_category } as unknown as Record<string, unknown>,
      });
    } catch {
      // silent — one failing automasi tidak block lainnya
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
