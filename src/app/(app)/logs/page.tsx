"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface LogEntry {
  id: string;
  device_key: string;
  event_type: string;
  description: string;
  body?: string;
  created_at: string;
}

interface DeviceOption {
  id: string;
  display_name: string;
}

const eventTypeBadgeMap: Record<string, "info" | "default" | "success" | "warning" | "error"> = {
  message_received: "info",
  message_sent: "default",
  auto_reply_sent: "success",
  auto_read: "warning",
  session_connected: "success",
  session_disconnected: "error",
  error: "error",
};

const eventTypeLabels: Record<string, string> = {
  message_received: "Message Received",
  message_sent: "Message Sent",
  auto_reply_sent: "Auto Reply Sent",
  auto_read: "Auto Read",
  session_connected: "Session Connected",
  session_disconnected: "Session Disconnected",
  error: "Error",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam yang lalu`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} hari yang lalu`;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDevice) params.set("device_key", selectedDevice);
      if (selectedEventType) params.set("event_type", selectedEventType);

      const query = params.toString();
      const res = await fetch(`/api/logs${query ? `?${query}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, selectedEventType]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    // Initial load; migrate to RSC data loading to satisfy set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    // Initial + filter-driven reload
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [fetchLogs]);

  function getBadgeVariant(eventType: string) {
    return eventTypeBadgeMap[eventType] || "default";
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Logs</h1>
        <p className="mt-1 text-sm text-text-muted">
          Lihat aktivitas dan riwayat event dari semua device.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="device-filter" className="text-sm font-medium text-text-primary">
            Device
          </label>
          <select
            id="device-filter"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="h-9 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="">Semua Device</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-filter" className="text-sm font-medium text-text-primary">
            Event Type
          </label>
          <select
            id="event-filter"
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="h-9 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="">Semua Event</option>
            {Object.entries(eventTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="mt-2 h-4 w-64" />
              <Skeleton className="mt-2 h-16 w-full" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="Belum ada logs"
          description={
            selectedDevice || selectedEventType
              ? "Tidak ada log yang cocok dengan filter yang dipilih."
              : "Aktivitas akan muncul di sini setelah device mulai bekerja."
          }
        />
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="relative flex gap-4">
                <div className="relative z-10 mt-4 flex h-[10px] w-[10px] shrink-0 items-center justify-center">
                  <span className="block h-2.5 w-2.5 rounded-full border-2 border-border bg-surface-subtle" />
                </div>
                <div className="flex-1 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-muted">
                      {timeAgo(log.created_at)}
                    </span>
                    <Badge variant={getBadgeVariant(log.event_type)}>
                      {eventTypeLabels[log.event_type] || log.event_type}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-text-primary">
                    {log.description}
                  </p>
                  {log.body && (
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-md)] bg-surface-subtle p-3 text-xs text-text-muted">
                      {log.body}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
