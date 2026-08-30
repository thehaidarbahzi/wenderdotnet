"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, Filter, ScrollText, Activity, RefreshCw, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";

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

const dotColorMap: Record<string, string> = {
  message_received: "bg-info border-info/20",
  message_sent: "bg-text-muted border-border",
  auto_reply_sent: "bg-success border-success/20",
  auto_read: "bg-warning border-warning/20",
  session_connected: "bg-success border-success/20",
  session_disconnected: "bg-error border-error/20",
  error: "bg-error border-error/20",
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

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");

  const stats = useMemo(() => {
    const total = logs.length;
    const autoReply = logs.filter((l) => l.event_type === "auto_reply_sent").length;
    const errors = logs.filter((l) => l.event_type === "error" || l.event_type === "session_disconnected").length;
    return { total, autoReply, errors };
  }, [logs]);

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

  const hasActiveFilter = selectedDevice !== "" || selectedEventType !== "";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Activity · Timeline"
        title="Logs"
        description="Semua aktivitas tercatat di sini — pesan masuk, balasan otomatis, auto-read, hingga error koneksi. Filter per device atau jenis event untuk debugging."
        actions={
          <Button
            variant="secondary"
            onClick={() => fetchLogs()}
            aria-label="Muat ulang logs"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats — only when we have data */}
      {!loading && logs.length > 0 && (
        <StatGrid>
          <StatCard
            label="Total Events"
            value={logs.length}
            hint={hasActiveFilter ? "Hasil filter saat ini" : "Semua device"}
            icon={<ScrollText className="h-5 w-5" />}
            tone="default"
          />
          <StatCard
            label="Auto Replies"
            value={stats.autoReply}
            hint="Balasan otomatis terkirim"
            icon={<Activity className="h-5 w-5" />}
            tone="success"
          />
          <StatCard
            label="Gangguan"
            value={stats.errors}
            hint={stats.errors > 0 ? "Perlu diperiksa" : "Tidak ada error"}
            icon={<Clock className="h-5 w-5" />}
            tone={stats.errors > 0 ? "warning" : "default"}
          />
        </StatGrid>
      )}

      {/* Filter Card — elevated, same language as landing filter sections */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-subtle border border-border text-text-muted">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-semibold text-text-primary">Filter</p>
          {hasActiveFilter && (
            <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {logs.length} hasil
            </span>
          )}
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDevice("");
                setSelectedEventType("");
              }}
              className="ml-1 h-7 px-2 text-xs"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="device-filter" className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Device
            </label>
            <select
              id="device-filter"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Semua Device</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="event-filter" className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Event Type
            </label>
            <select
              id="event-filter"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
      </div>

      {loading ? (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border hidden sm:block" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative flex gap-4">
                <div className="relative z-10 mt-4 hidden h-[10px] w-[10px] shrink-0 items-center justify-center sm:flex">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                </div>
                <div className="flex-1 rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </div>
                  <Skeleton className="mt-3 h-4 w-64" />
                  <Skeleton className="mt-2 h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-1">
          <EmptyState
            title={hasActiveFilter ? "Tidak ada hasil" : "Belum ada logs"}
            description={
              hasActiveFilter
                ? "Tidak ada log yang cocok dengan filter yang dipilih. Coba ubah device atau jenis event."
                : "Aktivitas akan muncul di sini setelah device mulai bekerja. Pastikan device sudah connected dan rules aktif."
            }
            icon={hasActiveFilter ? <SearchX className="h-5 w-5" /> : <ScrollText className="h-5 w-5" />}
            action={
              hasActiveFilter ? (
                <Button variant="secondary" onClick={() => { setSelectedDevice(""); setSelectedEventType(""); }}>
                  Hapus filter
                </Button>
              ) : undefined
            }
            className="border-0 bg-transparent"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">
              Timeline <span className="font-normal text-text-muted">· {logs.length} events</span>
            </h2>
            <p className="hidden text-xs text-text-muted sm:block">Terbaru di atas · waktu lokal</p>
          </div>

          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-border via-border to-transparent sm:block" />
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="relative flex gap-4">
                  <div className="relative z-10 mt-5 hidden h-3 w-3 shrink-0 items-center justify-center sm:flex">
                    <span
                      className={`block h-3 w-3 rounded-full border-2 shadow-xs ${dotColorMap[log.event_type] || "bg-surface-subtle border-border"}`}
                      aria-hidden
                    />
                    <span className={`absolute h-6 w-6 rounded-full opacity-20 ${dotColorMap[log.event_type]?.split(" ")[0] || "bg-border"}`} aria-hidden style={{ filter: "blur(6px)" }} />
                  </div>
                  <div className="group flex-1 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/15 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <time dateTime={log.created_at} className="inline-flex items-center gap-1.5 text-xs text-text-muted" title={formatTime(log.created_at)}>
                        <Clock className="h-3 w-3" />
                        {timeAgo(log.created_at)}
                        <span className="hidden text-text-muted/60 sm:inline">· {formatTime(log.created_at)}</span>
                      </time>
                      <span className="hidden h-1 w-1 rounded-full bg-border sm:block" aria-hidden />
                      <Badge variant={getBadgeVariant(log.event_type)}>{eventTypeLabels[log.event_type] || log.event_type}</Badge>
                      <span className="ml-auto hidden font-mono text-[11px] text-text-muted sm:inline">{log.device_key.slice(0, 8)}…</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-text-primary">{log.description}</p>
                    {log.body && (
                      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-surface-subtle p-3 text-xs leading-relaxed text-text-secondary">
                        {log.body}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
