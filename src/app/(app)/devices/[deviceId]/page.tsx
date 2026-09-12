"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Signal,
  WifiOff,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Phone,
  RefreshCw,
  Plug,
  Trash2,
  Zap,
  Hash,
  Plus,
  Pencil,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { DeviceAutomation } from "@/types";

type Tab = "overview" | "automasi";

interface GroupItem {
  JID: string;
  Name: string;
  ParticipantCount?: number;
}

export default function DeviceDetailPage() {
  const params = useParams<{ deviceId: string }>();
  const deviceId = params.deviceId as string;

  const [tab, setTab] = useState<Tab>("overview");
  const [device, setDevice] = useState<{
    id: string;
    display_name: string;
    state: string;
    jid: string;
  } | null>(null);
  const [status, setStatus] = useState<{
    is_connected: boolean;
    is_logged_in: boolean;
    state: string;
  } | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(true);

  const [detailConnectLoading, setDetailConnectLoading] = useState(false);
  const [detailDisconnecting, setDetailDisconnecting] = useState(false);

  const [connectModal, setConnectModal] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState<"qr" | "code">("qr");
  const [qrUrl, setQrUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairCodeLoading, setPairCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [automations, setAutomations] = useState<DeviceAutomation[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [autoModal, setAutoModal] = useState(false);
  const [editingAuto, setEditingAuto] = useState<DeviceAutomation | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoStep, setAutoStep] = useState(1);
  const [autoErrors, setAutoErrors] = useState<Record<string, string>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingAutoId, setDeletingAutoId] = useState<string | null>(null);
  const [autoForm, setAutoForm] = useState({
    name: "",
    trigger_category: "contains" as DeviceAutomation["trigger_category"],
    pattern: "",
    reply: "",
    is_reply: false,
    mentions: "",
    duration: 0,
    is_forwarded: false,
    target_type: "" as "" | "group" | "private",
    target_jids: [] as string[],
  });

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsFetched, setGroupsFetched] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const fetchDevice = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        const found = (
          data.devices as Array<{
            id: string;
            display_name: string;
            state: string;
          }>
        ).find((d) => d.id === deviceId);
        if (found) {
          setDevice({
            id: found.id,
            display_name: found.display_name,
            state: found.state,
            jid: "",
          });
        }
      }
      const sRes = await fetch(`/api/devices/${deviceId}/status`);
      if (sRes.ok) {
        const s = await sRes.json();
        setStatus({
          is_connected: s.is_connected ?? s.results?.is_connected ?? false,
          is_logged_in: s.is_logged_in ?? s.results?.is_logged_in ?? false,
          state:
            s.state ??
            (s.is_logged_in
              ? "logged_in"
              : s.is_connected
                ? "connecting"
                : "disconnected"),
        });
        setDevice((prev) =>
          prev
            ? {
                ...prev,
                state: s.state ?? prev.state,
                jid: s.jid ?? s.results?.jid ?? prev.jid,
              }
            : prev,
        );
      }
    } catch {
    } finally {
      setLoadingDevice(false);
    }
  }, [deviceId]);

  const fetchAutomations = useCallback(async () => {
    setAutoLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/automations`);
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations ?? []);
      }
    } catch {
    } finally {
      setAutoLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  useEffect(() => {
    fetchDevice();
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (document.visibilityState === "hidden") return;
        fetchDevice();
        fetchAutomations();
      }, 5000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDevice();
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchDevice, fetchAutomations]);

  useEffect(() => {
    if (!connectModal) return;
    if (status?.is_logged_in) {
      toast.success("Device terhubung!");
      setConnectModal(false);
      setQrUrl("");
      setPairCode(null);
      fetchDevice();
    }
  }, [status?.is_logged_in, connectModal, fetchDevice]);

  const fetchGroups = useCallback(async () => {
    if (groupsFetched || groupsLoading) return;
    setGroupsLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/groups`);
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups ?? []);
        setGroupsFetched(true);
      } else {
        if (res.status === 400)
          toast.error(data.error || "Device not connected untuk ambil grup");
        else toast.error(data.error || "Gagal ambil daftar grup");
      }
    } catch {
      toast.error("Gagal ambil grup");
    } finally {
      setGroupsLoading(false);
    }
  }, [deviceId, groupsFetched, groupsLoading]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter(
      (g) =>
        g.Name.toLowerCase().includes(q) || g.JID.toLowerCase().includes(q),
    );
  }, [groups, groupSearch]);

  const displayedGroups = useMemo(
    () => filteredGroups.slice(0, 100),
    [filteredGroups],
  );

  const saveAutomation = async () => {
    if (autoSaving) return;
    const errs: Record<string, string> = {};
    if (!autoForm.name.trim()) errs.name = "Name is required";
    if (!autoForm.pattern.trim()) errs.pattern = "Pattern is required";
    if (!autoForm.reply.trim()) errs.reply = "Reply is required";
    if (autoForm.target_type === "group" && autoForm.target_jids.length === 0)
      errs.target = "Select at least one group";
    if (Object.keys(errs).length) {
      setAutoErrors(errs);
      if (errs.name) setAutoStep(1);
      else if (errs.pattern) setAutoStep(2);
      else if (errs.target) setAutoStep(3);
      else if (errs.reply) setAutoStep(4);
      return;
    }
    setAutoSaving(true);
    try {
      const payload = {
        name: autoForm.name.trim(),
        trigger_category: autoForm.trigger_category,
        pattern: autoForm.pattern.trim(),
        reply: autoForm.reply,
        is_reply: autoForm.is_reply,
        mentions: autoForm.mentions.trim() || undefined,
        duration: autoForm.duration,
        is_forwarded: autoForm.is_forwarded,
        target_type: autoForm.target_type || undefined,
        target_jids:
          autoForm.target_type === "group" ? autoForm.target_jids : undefined,
        target_jid: autoForm.target_type !== "group" ? undefined : undefined,
      };

      if (editingAuto) {
        const res = await fetch(
          `/api/devices/${deviceId}/automations/${editingAuto.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              target_jid: autoForm.target_jids[0] ?? null,
            }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal update");
        toast.success("Automation diperbarui");
      } else {
        const res = await fetch(`/api/devices/${deviceId}/automations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal buat automasi");
        const count = data.automations?.length ?? 1;
        toast.success(
          count > 1
            ? `${count} automasi dibuat (1 per grup)`
            : "Automation ditambahkan",
        );
      }
      setAutoModal(false);
      fetchAutomations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal simpan");
    } finally {
      setAutoSaving(false);
    }
  };

  const toggleAutomation = async (a: DeviceAutomation) => {
    if (togglingId) return;
    setTogglingId(a.id);
    try {
      const res = await fetch(`/api/devices/${deviceId}/automations/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !a.enabled }),
      });
      if (!res.ok) throw new Error("Gagal toggle");
      setAutomations((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)),
      );
    } catch {
      toast.error("Gagal toggle");
    } finally {
      setTogglingId(null);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (deletingAutoId) return;
    setDeletingAutoId(id);
    try {
      const res = await fetch(`/api/devices/${deviceId}/automations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus");
      toast.success("Automation dihapus");
      setAutomations((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Gagal hapus");
    } finally {
      setDeletingAutoId(null);
    }
  };

  const fetchQr = async (id: string) => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/devices/${id}/login`);
      const data = await res.json();
      const link = data.qr_link || data.results?.qr_link || "";
      if (link) setQrUrl(link);
      else toast.error(data.error || "QR not available");
    } catch {
      toast.error("Gagal ambil QR");
    } finally {
      setQrLoading(false);
    }
  };
  const fetchPairCode = async (id: string, p: string) => {
    if (!p.trim()) {
      toast.error("Phone number wajib");
      return;
    }
    setPairCodeLoading(true);
    try {
      const res = await fetch(`/api/devices/${id}/login/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json();
      const code = data.pair_code || data.results?.pair_code || "";
      if (code) {
        setPairCode(code);
        toast.success("Code didapat");
      } else toast.error(data.error || "Gagal");
    } catch {
      toast.error("Gagal");
    } finally {
      setPairCodeLoading(false);
    }
  };

  const openConnect = async () => {
    if (detailConnectLoading) return;
    setDetailConnectLoading(true);
    try {
      setActiveConnectTab("qr");
      setConnectModal(true);
      setQrUrl("");
      setPairCode(null);
      setPhone("");
      await fetchQr(deviceId);
    } finally {
      setDetailConnectLoading(false);
    }
  };

  if (loadingDevice)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!device)
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Device not found</p>
        <Link href="/devices" className="text-primary text-sm">
          Back
        </Link>
      </div>
    );

  const isLoggedIn = status?.is_logged_in ?? device.state === "logged_in";
  const isConnecting =
    status?.state === "connecting" || device.state === "connecting";

  return (
    <div className="space-y-6">
      <Link
        href="/devices"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Devices
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="hidden h-12 w-12 place-items-center rounded-sm border border-border bg-surface-subtle sm:grid">
            <Smartphone className="h-6 w-6 text-text-muted" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              {device.display_name}{" "}
              <Badge
                variant={
                  isLoggedIn ? "success" : isConnecting ? "warning" : "default"
                }
              >
                {isLoggedIn
                  ? "Connected"
                  : isConnecting
                    ? "Connecting"
                    : "Disconnected"}
              </Badge>
            </h1>
            <p className="font-mono text-xs text-text-muted">{device.id}</p>
            {device.jid && (
              <p className="text-xs text-text-secondary">{device.jid}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isLoggedIn ? (
            <Button
              onClick={openConnect}
              variant="primary"
              loading={detailConnectLoading}
              disabled={detailConnectLoading || qrLoading}
              size="lg"
              className="shadow-sm"
            >
              <Plug className="h-4 w-4" />
              Connect WhatsApp
            </Button>
          ) : (
            <Button
              variant="secondary"
              loading={detailDisconnecting}
              disabled={detailDisconnecting}
              onClick={async () => {
                if (detailDisconnecting) return;
                setDetailDisconnecting(true);
                try {
                  const res = await fetch(`/api/devices/${deviceId}/logout`, {
                    method: "POST",
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Gagal disconnect");
                  }
                  toast.success("Disconnected");
                  fetchDevice();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Gagal disconnect",
                  );
                } finally {
                  setDetailDisconnecting(false);
                }
              }}
            >
              <WifiOff className="h-4 w-4" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-border">
        {(["overview", "automasi"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t === "overview" ? "Overview" : "Automation"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {!isLoggedIn ? (
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <WifiOff className="h-4 w-4" />
                Device not connected
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-200/80">
                Connect the device to start receiving messages. Click{" "}
                <b>Connect WhatsApp</b> above and follow the phone instructions.
              </p>
              <Button
                onClick={openConnect}
                variant="primary"
                size="sm"
                className="mt-3"
                loading={detailConnectLoading}
              >
                <Plug className="h-4 w-4" />
                Connect now
              </Button>
            </div>
          ) : automations.length === 0 ? (
            <div className="rounded-sm border border-primary/20 bg-primary/5 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" />
                Ready for automation
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Device is <b>connected</b>. Create your first automation to
                auto-reply.
              </p>
              <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-text-secondary">
                <li>
                  Go to the <b>Automation</b> tab above
                </li>
                <li>
                  Click <b>Add</b> → fill <i>Name</i>, <i>Pattern</i> (“price”),{" "}
                  <i>Reply</i>
                </li>
                <li>
                  Choose <i>Group</i> for group-specific or <i>All</i>
                </li>
              </ol>
              <Button
                onClick={() => setTab("automasi")}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                <Plus className="h-4 w-4" />
                Create first automation
              </Button>
            </div>
          ) : (
            <div className="rounded-sm border border-success/20 bg-success/5 p-4 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-success text-white">
                <Signal className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-success-strong">
                  Device active and automations running
                </p>
                <p className="text-xs text-text-muted">
                  {automations.filter((a) => a.enabled).length} automations
                  active • {automations.length} total
                </p>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Status
              </p>
              <p className="mt-2 font-medium flex items-center gap-2 text-sm">
                {isLoggedIn ? (
                  <Signal className="h-4 w-4 text-success" />
                ) : (
                  <WifiOff className="h-4 w-4 text-error" />
                )}
                {isLoggedIn
                  ? "Connected: ready"
                  : isConnecting
                    ? "Connecting..."
                    : "Disconnected"}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {isLoggedIn
                  ? "Incoming messages will be processed"
                  : "Connect to start"}
              </p>
            </div>
            <div className="rounded-sm border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Device ID
              </p>
              <p className="font-mono text-xs mt-2 break-all bg-surface-subtle rounded px-2 py-1.5 border border-border">
                {device.id}
              </p>
            </div>
            <div className="rounded-sm border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-wider text-text-muted">
                WhatsApp JID
              </p>
              <p className="font-mono text-xs mt-2 break-all bg-surface-subtle rounded px-2 py-1.5 border border-border">
                {device.jid || "-"}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {device.jid ? "Connected number" : "Will appear after QR scan"}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "automasi" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-text-primary">
              Automations for this device
            </h3>
            <div className="flex items-center gap-2">
              {autoLoading && automations.length > 0 && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading
                </span>
              )}
              <Button
                onClick={() => {
                  setEditingAuto(null);
                  setAutoForm({
                    name: "",
                    trigger_category: "contains",
                    pattern: "",
                    reply: "",
                    is_reply: false,
                    mentions: "",
                    duration: 0,
                    is_forwarded: false,
                    target_type: "",
                    target_jids: [],
                  });
                  setAutoErrors({});
                  setAutoStep(1);
                  setAutoModal(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add automation
              </Button>
            </div>
          </div>
          {autoLoading && automations.length === 0 ? (
            <Skeleton className="h-32 w-full" />
          ) : automations.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-text-muted">
              No automations yet. Click Add to create one. Trigger: prefix /
              contains / exact / regex, then reply.
            </div>
          ) : (
            <div className="grid gap-4">
              {automations.map((a) => {
                const targetLabel =
                  a.target_type === "group"
                    ? a.target_jid
                      ? groups.find((g) => g.JID === a.target_jid)?.Name ||
                        a.target_jid
                      : "All groups"
                    : a.target_type === "private"
                      ? "Private only"
                      : "All chats";
                const durationLabel =
                  a.duration === 0
                    ? "Permanent"
                    : a.duration === 86400
                      ? "24 hours"
                      : a.duration === 604800
                        ? "7 days"
                        : "90 days";
                return (
                  <div
                    key={a.id}
                    className="group flex flex-col gap-4 rounded-sm border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/15"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate font-semibold text-text-primary">
                            {a.name}
                          </h4>
                          <Badge variant={a.enabled ? "success" : "default"}>
                            {a.enabled ? "Active" : "Inactive"}
                          </Badge>
                          <span className="rounded-sm bg-surface-subtle px-2 py-0.5 font-mono text-xs text-text-muted border border-border">
                            {a.trigger_category}
                          </span>
                        </div>
                        <div className="rounded-sm bg-surface-subtle border border-border p-3">
                          <p className="font-mono text-xs text-text-secondary">
                            <span className="text-text-muted">Trigger:</span> “
                            {a.pattern}”
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-text-primary">
                            “{a.reply.slice(0, 80)}
                            {a.reply.length > 80 ? "…" : ""}”
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary">
                            <Hash className="h-3 w-3" />
                            {targetLabel}
                          </span>
                          {a.is_reply && (
                            <span className="inline-flex items-center rounded-full border border-info/20 bg-info/10 px-2.5 py-1 text-xs font-medium text-info-strong">
                              Reply
                            </span>
                          )}
                          {a.mentions && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-xs text-warning-strong">
                              <AtSign className="h-3 w-3" />
                              {a.mentions}
                            </span>
                          )}
                          {a.duration !== 0 && (
                            <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted">
                              {durationLabel}
                            </span>
                          )}
                          {a.is_forwarded && (
                            <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted">
                              Forwarded
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 lg:w-40 lg:shrink-0">
                        <Button
                          variant={a.enabled ? "secondary" : "primary"}
                          size="sm"
                          loading={togglingId === a.id}
                          disabled={togglingId === a.id}
                          onClick={() => toggleAutomation(a)}
                          className="w-full justify-center rounded-sm"
                        >
                          {a.enabled ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingAuto(a);
                            setAutoForm({
                              name: a.name,
                              trigger_category: a.trigger_category,
                              pattern: a.pattern,
                              reply: a.reply,
                              is_reply: a.is_reply,
                              mentions: a.mentions ?? "",
                              duration: a.duration,
                              is_forwarded: a.is_forwarded,
                              target_type:
                                (a.target_type as "" | "group" | "private") ??
                                "",
                              target_jids: a.target_jid ? [a.target_jid] : [],
                            });
                            setAutoErrors({});
                            setAutoStep(1);
                            setAutoModal(true);
                          }}
                          className="w-full justify-center rounded-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deletingAutoId === a.id}
                          disabled={deletingAutoId === a.id}
                          onClick={() => deleteAutomation(a.id)}
                          className="w-full justify-center rounded-sm text-text-muted hover:text-error hover:bg-error/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {}
      <Modal
        open={autoModal}
        onClose={() => !autoSaving && setAutoModal(false)}
        title={editingAuto ? "Edit Automation" : "Add Automation"}
      >
        <div className="space-y-5">
          {autoStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-sm border border-primary/10 bg-primary/5 px-3 py-2.5">
                <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Step 1 of 4: identity
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  Give it a clear name so you can find it later. Customers never
                  see this.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  label="Automation name *"
                  placeholder="Example: Reply price in Promo Group"
                  value={autoForm.name}
                  onChange={(e) => {
                    setAutoForm({ ...autoForm, name: e.target.value });
                    if (autoErrors.name)
                      setAutoErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  error={autoErrors.name}
                  autoFocus
                />
                <p className="text-xs text-text-muted">
                  Use something specific like “Stock reply” instead of “Test 1”.
                </p>
              </div>
            </div>
          )}

          {autoStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Trigger category</label>
                <select
                  value={autoForm.trigger_category}
                  onChange={(e) =>
                    setAutoForm({
                      ...autoForm,
                      trigger_category: e.target
                        .value as DeviceAutomation["trigger_category"],
                    })
                  }
                  className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="prefix">
                    Prefix: message starts with this
                  </option>
                  <option value="contains">Contains: appears anywhere</option>
                  <option value="exact">Exact: must match exactly</option>
                  <option value="regex">Regex: advanced pattern</option>
                </select>
                <p className="text-xs leading-relaxed text-text-muted">
                  {autoForm.trigger_category === "contains"
                    ? "Safest for beginners. Pattern promo matches have promo?"
                    : autoForm.trigger_category === "prefix"
                      ? "Only if message starts with it. price matches price how much but not how much price."
                      : autoForm.trigger_category === "exact"
                        ? "Must match exactly, no extra words."
                        : "Regular expression. Leave empty if unsure."}
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  label="Trigger pattern *"
                  placeholder={
                    autoForm.trigger_category === "prefix"
                      ? "price"
                      : autoForm.trigger_category === "exact"
                        ? "hello"
                        : autoForm.trigger_category === "regex"
                          ? "^hello.*"
                          : "promo"
                  }
                  value={autoForm.pattern}
                  onChange={(e) => {
                    setAutoForm({ ...autoForm, pattern: e.target.value });
                    if (autoErrors.pattern)
                      setAutoErrors((prev) => ({ ...prev, pattern: "" }));
                  }}
                  error={autoErrors.pattern}
                />
                <p className="text-xs text-text-muted">
                  A short phrase. Avoid a single letter like a.
                </p>
              </div>
            </div>
          )}

          {autoStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Apply to</label>
                <select
                  value={autoForm.target_type}
                  onChange={(e) => {
                    setAutoForm({
                      ...autoForm,
                      target_type: e.target.value as never,
                      target_jids: [],
                    });
                    setAutoErrors((prev) => ({ ...prev, target: "" }));
                    if (e.target.value === "group") fetchGroups();
                  }}
                  className={`h-10 w-full rounded-sm border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${autoErrors.target ? "border-error" : "border-border"}`}
                >
                  <option value="">All chats</option>
                  <option value="group">Groups only</option>
                  <option value="private">Private only</option>
                </select>
                <p className="text-xs text-text-muted">
                  Groups only keeps the reply out of private chats.
                </p>
                {autoErrors.target && (
                  <p className="text-xs text-error">{autoErrors.target}</p>
                )}
              </div>
              {autoForm.target_type === "group" ? (
                <div className="rounded-sm border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Select groups ({autoForm.target_jids.length} selected)
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setGroupPickerOpen(!groupPickerOpen)}
                    >
                      {groupPickerOpen ? "Close" : "Choose"}
                    </Button>
                  </div>
                  {autoForm.target_jids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {autoForm.target_jids.map((jid) => {
                        const name =
                          groups.find((g) => g.JID === jid)?.Name || jid;
                        return (
                          <span
                            key={jid}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                            title={jid}
                          >
                            {name}{" "}
                            <button
                              type="button"
                              onClick={() =>
                                setAutoForm({
                                  ...autoForm,
                                  target_jids: autoForm.target_jids.filter(
                                    (x) => x !== jid,
                                  ),
                                })
                              }
                              className="ml-1 grid h-4 w-4 place-items-center rounded-full hover:bg-primary/20"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {groupPickerOpen && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Search groups"
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                      />
                      <div className="max-h-48 overflow-auto rounded-sm border border-border divide-y">
                        {groupsLoading ? (
                          <div className="p-4 text-center text-sm text-text-muted">
                            Loading groups
                          </div>
                        ) : displayedGroups.length === 0 ? (
                          <div className="p-4 text-center text-xs text-text-muted">
                            {groups.length === 0
                              ? "No groups found. Connect device first."
                              : "No results"}
                          </div>
                        ) : (
                          displayedGroups.map((g) => (
                            <label
                              key={g.JID}
                              className="flex items-center gap-3 p-3 hover:bg-surface-subtle cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={autoForm.target_jids.includes(g.JID)}
                                onChange={(e) =>
                                  setAutoForm({
                                    ...autoForm,
                                    target_jids: e.target.checked
                                      ? [...autoForm.target_jids, g.JID]
                                      : autoForm.target_jids.filter(
                                          (x) => x !== g.JID,
                                        ),
                                  })
                                }
                                className="rounded-sm"
                              />
                              <span className="flex-1 truncate font-medium">
                                {g.Name || g.JID}
                              </span>
                              <span className="text-xs text-text-muted">
                                {g.ParticipantCount ?? ""}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                      {filteredGroups.length > 100 && (
                        <p className="text-xs text-text-muted">
                          Showing 100 of {filteredGroups.length}. Use search to
                          narrow.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setAutoForm({
                              ...autoForm,
                              target_jids: filteredGroups
                                .slice(0, 20)
                                .map((g) => g.JID),
                            })
                          }
                        >
                          Select first 20
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setAutoForm({ ...autoForm, target_jids: [] })
                          }
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    Leave empty to apply to all groups. Selecting several
                    creates one automation per group.
                  </p>
                </div>
              ) : (
                <div className="rounded-sm border border-dashed border-border bg-surface-subtle p-5 text-center">
                  <p className="text-sm text-text-secondary">
                    {autoForm.target_type === ""
                      ? "Reply will be sent to any matching chat."
                      : "Only private chats will be replied to."}
                  </p>
                </div>
              )}
            </div>
          )}

          {autoStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Reply message <span className="text-error">*</span></label>
                <textarea
                  value={autoForm.reply}
                  onChange={(e) => {
                    setAutoForm({ ...autoForm, reply: e.target.value });
                    if (autoErrors.reply)
                      setAutoErrors((prev) => ({ ...prev, reply: "" }));
                  }}
                  className={`min-h-[110px] w-full rounded-sm border bg-surface px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${autoErrors.reply ? "border-error" : "border-border"}`}
                  placeholder="Hi, we have stock. Price is 25k, check the catalog"
                />
                {autoErrors.reply ? (
                  <p className="text-xs text-error">{autoErrors.reply}</p>
                ) : (
                  <p className="text-xs text-text-muted">
                    Write as if replying manually. Emoji allowed.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-sm border border-border bg-surface-subtle/50 p-3">
                <label className="flex items-start gap-2.5 rounded-sm p-2 hover:bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoForm.is_reply}
                    onChange={(e) =>
                      setAutoForm({ ...autoForm, is_reply: e.target.checked })
                    }
                    className="mt-1 rounded-sm"
                  />
                  <span className="text-sm">
                    <span className="font-medium">Quote original</span>
                    <br />
                    <span className="text-xs text-text-muted">
                      Reply as a quoted thread.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 rounded-sm p-2 hover:bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoForm.is_forwarded}
                    onChange={(e) =>
                      setAutoForm({
                        ...autoForm,
                        is_forwarded: e.target.checked,
                      })
                    }
                    className="mt-1 rounded-sm"
                  />
                  <span className="text-sm">
                    <span className="font-medium">Mark as forwarded</span>
                    <br />
                    <span className="text-xs text-text-muted">
                      Show Forwarded label.
                    </span>
                  </span>
                </label>
              </div>
              {autoForm.target_type === "group" && (
                <div className="space-y-3">
                  <Input
                    label="Mention"
                    placeholder="@everyone or 628123456789"
                    value={autoForm.mentions}
                    onChange={(e) =>
                      setAutoForm({ ...autoForm, mentions: e.target.value })
                    }
                  />
                  <p className="text-xs text-text-muted">
                    Groups only. Leave empty if no mention is needed.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Disappearing message
                </label>
                <select
                  value={autoForm.duration}
                  onChange={(e) =>
                    setAutoForm({
                      ...autoForm,
                      duration: Number(e.target.value),
                    })
                  }
                  className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value={0}>Permanent</option>
                  <option value={86400}>24 hours</option>
                  <option value={604800}>7 days</option>
                  <option value={7776000}>90 days</option>
                </select>
                <p className="text-xs text-text-muted">
                  WhatsApp disappearing message timer.
                </p>
              </div>
              <div className="rounded-sm border border-border bg-surface p-3">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Summary
                </p>
                <div className="mt-2 space-y-1 text-xs text-text-secondary">
                  <p>
                    <span className="font-medium text-text-primary">Name:</span>{" "}
                    {autoForm.name || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Trigger:
                    </span>{" "}
                    {autoForm.trigger_category} “{autoForm.pattern || "-"}”
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Target:
                    </span>{" "}
                    {autoForm.target_type === "group"
                      ? `${autoForm.target_jids.length ? autoForm.target_jids.map((j) => groups.find((g) => g.JID === j)?.Name || j).join(", ") : "all groups"}`
                      : autoForm.target_type === "private"
                        ? "private"
                        : "all chats"}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Reply:
                    </span>{" "}
                    {autoForm.reply
                      ? `${autoForm.reply.slice(0, 40)}${autoForm.reply.length > 40 ? "…" : ""}`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() =>
                autoStep > 1 ? setAutoStep(autoStep - 1) : setAutoModal(false)
              }
              disabled={autoSaving}
            >
              {autoStep === 1 ? "Cancel" : "Back"}
            </Button>
            <div className="flex gap-2">
              {autoStep < 4 ? (
                <Button
                  onClick={() => {
                    const nextErrors: Record<string, string> = {};
                    if (autoStep === 1 && !autoForm.name.trim())
                      nextErrors.name = "Name is required";
                    if (autoStep === 2 && !autoForm.pattern.trim())
                      nextErrors.pattern = "Pattern is required";
                    if (
                      autoStep === 3 &&
                      autoForm.target_type === "group" &&
                      autoForm.target_jids.length === 0
                    )
                      nextErrors.target = "Select at least one group";
                    if (Object.keys(nextErrors).length) {
                      setAutoErrors(nextErrors);
                      return;
                    }
                    setAutoErrors({});
                    setAutoStep(autoStep + 1);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const errs: Record<string, string> = {};
                    if (!autoForm.reply.trim())
                      errs.reply = "Reply is required";
                    if (Object.keys(errs).length) {
                      setAutoErrors(errs);
                      return;
                    }
                    saveAutomation();
                  }}
                  loading={autoSaving}
                  disabled={autoSaving}
                >
                  {editingAuto ? "Save" : "Create automation"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={connectModal}
        onClose={() => {
          setConnectModal(false);
          setQrUrl("");
          setPairCode(null);
        }}
        title="Connect WhatsApp"
      >
        <div className="space-y-4">
          <div
            role="tablist"
            className="grid grid-cols-2 gap-1 rounded-sm border border-border bg-surface-subtle p-1"
          >
            <button
              role="tab"
              aria-selected={activeConnectTab === "qr"}
              onClick={() => setActiveConnectTab("qr")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium ${activeConnectTab === "qr" ? "bg-surface shadow border border-border" : "text-text-muted"}`}
            >
              <QrCode className="h-4 w-4" />
              QR
            </button>
            <button
              role="tab"
              aria-selected={activeConnectTab === "code"}
              onClick={() => setActiveConnectTab("code")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium ${activeConnectTab === "code" ? "bg-surface shadow border border-border" : "text-text-muted"}`}
            >
              <KeyRound className="h-4 w-4" />
              Code
            </button>
          </div>
          {activeConnectTab === "qr" ? (
            <div className="space-y-3">
              <div className="rounded-sm border border-primary/20 bg-primary/5 p-2.5 text-sm">
                On your phone: <b>WhatsApp → Linked Devices → Link a device</b>
              </div>
              <div className="flex justify-center">
                {qrLoading ? (
                  <Skeleton className="h-64 w-64" />
                ) : qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR"
                    className="h-64 w-64 border bg-white p-2 rounded-sm"
                  />
                ) : (
                  <div className="h-64 w-64 grid place-items-center border-dashed border rounded-sm text-sm text-text-muted">
                    QR not available
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="secondary"
                  onClick={() => setConnectModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="secondary"
                  loading={qrLoading}
                  onClick={() => fetchQr(deviceId)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Phone number"
                placeholder="62812xxxxxxx"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))
                }
              />
              <Button
                onClick={() => fetchPairCode(deviceId, phone)}
                loading={pairCodeLoading}
                disabled={!phone.trim()}
                className="w-full"
              >
                <Phone className="h-4 w-4" />
                Get code
              </Button>
              {pairCode ? (
                <div className="rounded-sm border border-primary/20 bg-primary/5 p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-text-muted">
                    Code
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-[0.2em] flex items-center justify-center gap-2">
                    {pairCode}
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(pairCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="h-8 w-8 grid place-items-center border rounded-sm bg-surface"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </p>
                </div>
              ) : (
                <div className="border-dashed border rounded-sm p-6 text-center text-sm text-text-muted">
                  No code yet
                </div>
              )}
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="secondary"
                  onClick={() => setConnectModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
