export interface User {
  id: string;
  full_name: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_key: string;
  name: string;
  role: string;
  created_at: string;
}

export interface DeviceInfo {
  id: string;
  display_name: string;
  state: string;
  jid: string;
}

export interface DeviceStatus {
  is_connected: boolean;
  is_logged_in: boolean;
  device_id: string;
  jid: string;
}

export interface DeviceAutomation {
  id: string;
  user_id: string;
  device_key: string;
  name: string;
  trigger_category: "prefix" | "contains" | "exact" | "regex";
  trigger_type: "keyword" | "regex";
  pattern: string;
  reply: string;
  is_reply: boolean;
  mentions: string | null;
  duration: number;
  is_forwarded: boolean;
  target_type: "group" | "private" | null;
  target_jid: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// legacy, kept for docs compat (migrated to device_automations)
export interface Rule {
  id: string;
  user_id: string;
  name: string;
  action_type: "listen" | "auto_reply";
  target_type: "group" | "private" | null;
  target_jid: string | null;
  trigger_type: "keyword" | "regex" | null;
  pattern: string | null;
  reply: string | null;
  auto_read: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceRule {
  id: string;
  device_key: string;
  rule_id: string;
  enabled: boolean;
  created_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  device_key: string;
  event_type:
    | "message_sent"
    | "message_received"
    | "auto_reply_sent"
    | "auto_read"
    | "session_connected"
    | "session_disconnected"
    | "error";
  chat_jid: string | null;
  chat_name: string | null;
  sender_jid: string | null;
  sender_name: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Newsletter {
  id: string;
  email: string;
  created_at: string;
}

// Bot API response types
export interface GowaResponse<T = unknown> {
  status: number;
  code: string;
  message: string;
  results: T;
}

export interface LoginResponse {
  device_id: string;
  qr_link: string;
  qr_duration: number;
}

export interface LoginWithCodeResponse {
  device_id: string;
  pair_code: string;
}

export interface SendResponse {
  message_id: string;
  status: string;
}
