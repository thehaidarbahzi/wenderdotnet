"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Smartphone, Signal, WifiOff, QrCode, KeyRound, Copy, Check, Phone, RefreshCw, Plug, Trash2, Settings, Webhook, Zap, Eye, MessageSquareReply, Hash, Plus, Pencil, ToggleRight, Send, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { DeviceAutomation } from "@/types";

type Tab = "overview" | "webhook" | "automasi";

interface GroupItem {
  JID: string;
  Name: string;
  ParticipantCount?: number;
}

export default function DeviceDetailPage() {
  const params = useParams<{ deviceId: string }>();
  const router = useRouter();
  const deviceId = params.deviceId as string;

  const [tab, setTab] = useState<Tab>("overview");
  const [device, setDevice] = useState<{ id: string; display_name: string; state: string; jid: string } | null>(null);
  const [status, setStatus] = useState<{ is_connected: boolean; is_logged_in: boolean; state: string } | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(true);

  // webhook
  const [webhook, setWebhook] = useState({ webhook_url: "", webhook_secret: "", webhook_events: "", webhook_insecure_skip_verify: false });
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; status?: number; body?: string; error?: string; webhook_url?: string } | null>(null);
  const [detailConnectLoading, setDetailConnectLoading] = useState(false);
  const [detailDisconnecting, setDetailDisconnecting] = useState(false);

  // connect modal (qr/code)
  const [connectModal, setConnectModal] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState<"qr" | "code">("qr");
  const [qrUrl, setQrUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairCodeLoading, setPairCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // automations
  const [automations, setAutomations] = useState<DeviceAutomation[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [autoModal, setAutoModal] = useState(false);
  const [editingAuto, setEditingAuto] = useState<DeviceAutomation | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
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

  // groups
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
        const found = (data.devices as Array<{ id: string; display_name: string; state: string }>).find((d) => d.id === deviceId);
        if (found) {
          setDevice({ id: found.id, display_name: found.display_name, state: found.state, jid: "" });
        }
      }
      const sRes = await fetch(`/api/devices/${deviceId}/status`);
      if (sRes.ok) {
        const s = await sRes.json();
        setStatus({ is_connected: s.is_connected ?? s.results?.is_connected ?? false, is_logged_in: s.is_logged_in ?? s.results?.is_logged_in ?? false, state: s.state ?? (s.is_logged_in ? "logged_in" : s.is_connected ? "connecting" : "disconnected") });
        setDevice((prev) => (prev ? { ...prev, state: s.state ?? prev.state, jid: s.jid ?? s.results?.jid ?? prev.jid } : prev));
      }
    } catch {}
    finally { setLoadingDevice(false); }
  }, [deviceId]);

  // polling 5s + visibility-aware (WS fallback ke polling, BOT_AUTH server-only jadi WS browser 401)
  useEffect(() => {
    fetchDevice();
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (document.visibilityState === "hidden") return;
        fetchDevice();
        if (tab === "automasi") fetchAutomations();
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
  }, [fetchDevice, tab]);

  // auto-close connect modal when logged_in
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

  const fetchWebhook = useCallback(async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/webhook`);
      if (res.ok) {
        const data = await res.json();
        const w = data.webhook ?? data;
        setWebhook({
          webhook_url: w.webhook_url ?? "",
          webhook_secret: w.webhook_secret ?? "",
          webhook_events: w.webhook_events ?? "",
          webhook_insecure_skip_verify: !!w.webhook_insecure_skip_verify,
        });
      }
    } catch {}
    finally { setWebhookLoading(false); }
  }, [deviceId]);

  useEffect(() => { if (tab === "webhook") fetchWebhook(); }, [tab, fetchWebhook]);

  const saveWebhook = async () => {
    if (webhookSaving) return;
    if (webhook.webhook_url) try { new URL(webhook.webhook_url); } catch { toast.error("Webhook URL tidak valid"); return; }
    setWebhookSaving(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/webhook`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(webhook) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal simpan webhook");
      if (data.gowa_error) toast.success("Tersimpan di DB, tapi GOWA sync gagal: " + (data.warning || ""));
      else toast.success("Webhook tersimpan");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal simpan webhook"); }
    finally { setWebhookSaving(false); }
  };

  const testWebhook = async () => {
    if (webhookTesting) return;
    if (!webhook.webhook_url) { toast.error("Isi webhook URL dulu"); return; }
    setWebhookTesting(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}/webhook/test`, { method: "POST" });
      const data = await res.json();
      setWebhookTestResult(data);
      if (res.ok && data.ok) toast.success(`Test sukses (${data.status})`);
      else toast.error(data.error || `Test gagal (${data.status})`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal test"); }
    finally { setWebhookTesting(false); }
  };

  const fetchAutomations = useCallback(async () => {
    setAutoLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/automations`);
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations ?? []);
      }
    } catch {}
    finally { setAutoLoading(false); }
  }, [deviceId]);

  useEffect(() => { if (tab === "automasi") fetchAutomations(); }, [tab, fetchAutomations]);

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
        if (res.status === 400) toast.error(data.error || "Device belum terhubung untuk ambil grup");
        else toast.error(data.error || "Gagal ambil daftar grup");
      }
    } catch { toast.error("Gagal ambil grup"); }
    finally { setGroupsLoading(false); }
  }, [deviceId, groupsFetched, groupsLoading]);

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.Name.toLowerCase().includes(q) || g.JID.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const displayedGroups = useMemo(() => filteredGroups.slice(0, 100), [filteredGroups]);

  const openAutoAdd = () => {
    setEditingAuto(null);
    setAutoForm({ name: "", trigger_category: "contains", pattern: "", reply: "", is_reply: false, mentions: "", duration: 0, is_forwarded: false, target_type: "", target_jids: [] });
    setGroupSearch("");
    setAutoModal(true);
  };
  const openAutoEdit = (a: DeviceAutomation) => {
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
      target_type: (a.target_type as "" | "group" | "private") ?? "",
      target_jids: a.target_jid ? [a.target_jid] : [],
    });
    setGroupSearch("");
    setAutoModal(true);
  };

  const saveAutomation = async () => {
    if (autoSaving) return;
    if (!autoForm.name.trim() || !autoForm.pattern.trim() || !autoForm.reply.trim()) { toast.error("Nama, pola, dan balasan wajib diisi"); return; }
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
        target_jids: autoForm.target_type === "group" ? autoForm.target_jids : undefined,
        target_jid: autoForm.target_type !== "group" ? undefined : undefined, // handled via target_jids
      };
      // For edit, PUT single
      if (editingAuto) {
        const res = await fetch(`/api/devices/${deviceId}/automations/${editingAuto.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, target_jid: autoForm.target_jids[0] ?? null }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal update");
        toast.success("Automasi diperbarui");
      } else {
        // duplicate per grup: payload.target_jids array will be handled by backend (creates N rows)
        const res = await fetch(`/api/devices/${deviceId}/automations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal buat automasi");
        const count = data.automations?.length ?? 1;
        toast.success(count > 1 ? `${count} automasi dibuat (1 per grup)` : "Automasi ditambahkan");
      }
      setAutoModal(false);
      fetchAutomations();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Gagal simpan"); }
    finally { setAutoSaving(false); }
  };

  const toggleAutomation = async (a: DeviceAutomation) => {
    if (togglingId) return;
    setTogglingId(a.id);
    try {
      const res = await fetch(`/api/devices/${deviceId}/automations/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !a.enabled }) });
      if (!res.ok) throw new Error("Gagal toggle");
      setAutomations((prev) => prev.map((x) => x.id === a.id ? { ...x, enabled: !x.enabled } : x));
    } catch { toast.error("Gagal toggle"); }
    finally { setTogglingId(null); }
  };

  const deleteAutomation = async (id: string) => {
    if (deletingAutoId) return;
    setDeletingAutoId(id);
    try {
      const res = await fetch(`/api/devices/${deviceId}/automations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      toast.success("Automasi dihapus");
      setAutomations((prev) => prev.filter((x) => x.id !== id));
    } catch { toast.error("Gagal hapus"); }
    finally { setDeletingAutoId(null); }
  };

  const fetchQr = async (id: string) => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/devices/${id}/login`);
      const data = await res.json();
      const link = data.qr_link || data.results?.qr_link || "";
      if (link) setQrUrl(link); else toast.error(data.error || "QR tidak tersedia");
    } catch { toast.error("Gagal ambil QR"); }
    finally { setQrLoading(false); }
  };
  const fetchPairCode = async (id: string, p: string) => {
    if (!p.trim()) { toast.error("Nomor HP wajib"); return; }
    setPairCodeLoading(true);
    try {
      const res = await fetch(`/api/devices/${id}/login/code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: p }) });
      const data = await res.json();
      const code = data.pair_code || data.results?.pair_code || "";
      if (code) { setPairCode(code); toast.success("Kode didapat"); } else toast.error(data.error || "Gagal");
    } catch { toast.error("Gagal"); } finally { setPairCodeLoading(false); }
  };

  const openConnect = async () => {
    if (detailConnectLoading) return;
    setDetailConnectLoading(true);
    try {
      setActiveConnectTab("qr");
      setConnectModal(true);
      setQrUrl(""); setPairCode(null); setPhone("");
      await fetchQr(deviceId);
    } finally {
      setDetailConnectLoading(false);
    }
  };

  if (loadingDevice) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!device) return <div className="text-center py-12"><p className="text-text-muted">Device tidak ditemukan</p><Link href="/devices" className="text-primary text-sm">Kembali</Link></div>;

  const isLoggedIn = status?.is_logged_in ?? device.state === "logged_in";
  const isConnecting = status?.state === "connecting" || device.state === "connecting";

  return (
    <div className="space-y-6">
      <Link href="/devices" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"><ArrowLeft className="h-4 w-4" />Kembali ke Devices</Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="hidden h-12 w-12 place-items-center rounded-xl border border-border bg-surface-subtle sm:grid"><Smartphone className="h-6 w-6 text-text-muted" /></div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">{device.display_name} <Badge variant={isLoggedIn ? "success" : isConnecting ? "warning" : "default"}>{isLoggedIn ? "Connected" : isConnecting ? "Connecting" : "Disconnected"}</Badge></h1>
            <p className="font-mono text-xs text-text-muted">{device.id}</p>
            {device.jid && <p className="text-xs text-text-secondary">{device.jid}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isLoggedIn ? (
            <Button onClick={openConnect} variant="primary" loading={detailConnectLoading} disabled={detailConnectLoading || qrLoading}>
              <Plug className="h-4 w-4" />
              Hubungkan
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
                  const res = await fetch(`/api/devices/${deviceId}/logout`, { method: "POST" });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Gagal disconnect");
                  }
                  toast.success("Disconnected");
                  fetchDevice();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Gagal disconnect");
                } finally {
                  setDetailDisconnecting(false);
                }
              }}
            >
              <WifiOff className="h-4 w-4" />
              Disconnect
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push("/devices")}><Settings className="h-4 w-4" />Kelola</Button>
        </div>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-border">
        {(["overview", "webhook", "automasi"] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}>{t === "overview" ? "Overview" : t === "webhook" ? "Webhook" : "Automasi"}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wider text-text-muted">Status</p><p className="mt-1 font-medium flex items-center gap-2">{isLoggedIn ? <Signal className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-error" />}{isLoggedIn ? "Siap menerima chat" : "Perlu hubungkan"}</p><p className="text-xs text-text-muted mt-1">Auto refresh 5s + WS fallback</p></div>
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wider text-text-muted">Device ID</p><p className="font-mono text-sm mt-1 break-all">{device.id}</p></div>
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wider text-text-muted">JID</p><p className="font-mono text-sm mt-1 break-all">{device.jid || "-"}</p></div>
        </div>
      )}

      {tab === "webhook" && (
        <div className="space-y-4 max-w-2xl">
          {webhookLoading ? <Skeleton className="h-64 w-full" /> : (
            <>
              <Input label="Webhook URL" placeholder="https://your-app.com/api/webhook/gowa" value={webhook.webhook_url} onChange={(e) => setWebhook({ ...webhook, webhook_url: e.target.value })} />
              <Input label="Webhook Secret (opsional)" placeholder="super-secret" value={webhook.webhook_secret} onChange={(e) => setWebhook({ ...webhook, webhook_secret: e.target.value })} />
              <Input label="Events (opsional, kosong = semua)" placeholder="message,message.ack" value={webhook.webhook_events} onChange={(e) => setWebhook({ ...webhook, webhook_events: e.target.value })} />
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle/50 px-3 py-3"><div><p className="text-sm font-medium">Skip TLS Verify</p><p className="text-xs text-text-muted">Untuk self-signed cert</p></div><Toggle checked={webhook.webhook_insecure_skip_verify} onChange={(v) => setWebhook({ ...webhook, webhook_insecure_skip_verify: v })} /></div>
              <div className="flex gap-2">
                <Button onClick={saveWebhook} loading={webhookSaving} disabled={webhookSaving}><Webhook className="h-4 w-4" />Simpan</Button>
                <Button variant="secondary" onClick={testWebhook} loading={webhookTesting} disabled={webhookTesting || !webhook.webhook_url}><Send className="h-4 w-4" />Test Kirim Dummy</Button>
              </div>
              {webhookTestResult && <div className={`rounded-lg border p-3 text-xs ${webhookTestResult.ok ? "border-success/20 bg-success/5 text-success-strong" : "border-error/20 bg-error/5 text-error-strong"}`}><p>Webhook: {webhookTestResult.webhook_url ?? webhook.webhook_url}</p><p>Status: {webhookTestResult.status} {webhookTestResult.ok ? "OK" : webhookTestResult.error}</p>{webhookTestResult.body && <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all bg-surface p-2 rounded">{webhookTestResult.body}</pre>}</div>}
            </>
          )}
        </div>
      )}

      {tab === "automasi" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-text-primary">Automasi untuk device ini</h3><Button onClick={() => { setEditingAuto(null); setAutoForm({ name: "", trigger_category: "contains", pattern: "", reply: "", is_reply: false, mentions: "", duration: 0, is_forwarded: false, target_type: "", target_jids: [] }); setAutoModal(true); }}><Plus className="h-4 w-4" />Tambah</Button></div>
          {autoLoading ? <Skeleton className="h-32 w-full" /> : automations.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-muted">Belum ada automasi. Klik Tambah untuk buat: kata depan / contains / exact / regex → balasan + opsi reply/tag.</div> : (
            <div className="grid gap-3">
              {automations.map((a) => (
                <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary flex items-center gap-2">{a.name} <Badge variant={a.enabled ? "success" : "default"}>{a.enabled ? "Aktif" : "Nonaktif"}</Badge> <span className="text-xs font-mono bg-surface-subtle px-1.5 py-0.5 rounded">{a.trigger_category}</span></p>
                      <p className="text-xs font-mono text-text-muted mt-1">“{a.pattern}” → {a.reply.slice(0,60)}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                        {a.target_type ? <span className="inline-flex gap-1 border bg-surface-subtle px-2 py-1 rounded-full"><Hash className="h-3 w-3" />{a.target_type}{a.target_jid ? ` · ${a.target_jid.slice(0,20)}` : " · semua"}</span> : <span className="border px-2 py-1 rounded-full bg-surface">Semua chat</span>}
                        {a.is_reply && <span className="border px-2 py-1 rounded-full bg-info/10 text-info-strong">Reply</span>}
                        {a.mentions && <span className="border px-2 py-1 rounded-full bg-warning/10 flex items-center gap-1"><AtSign className="h-3 w-3" />{a.mentions}</span>}
                        {a.duration !== 0 && <span className="border px-2 py-1 rounded-full">dur {a.duration}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Toggle checked={a.enabled} onChange={() => toggleAutomation(a)} disabled={togglingId === a.id} />
                      <Button variant="ghost" size="sm" onClick={() => { setEditingAuto(a); setAutoForm({ name: a.name, trigger_category: a.trigger_category, pattern: a.pattern, reply: a.reply, is_reply: a.is_reply, mentions: a.mentions ?? "", duration: a.duration, is_forwarded: a.is_forwarded, target_type: (a.target_type as "" | "group" | "private") ?? "", target_jids: a.target_jid ? [a.target_jid] : [] }); setAutoModal(true); }} className="h-8 w-8 p-0"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteAutomation(a.id)} loading={deletingAutoId === a.id} disabled={deletingAutoId === a.id} className="h-8 w-8 p-0 text-text-muted hover:text-error"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Automation Modal */}
      <Modal open={autoModal} onClose={() => !autoSaving && setAutoModal(false)} title={editingAuto ? "Edit Automasi" : "Tambah Automasi"}>
        <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
          <Input label="Nama" placeholder="Balas harga" value={autoForm.name} onChange={(e) => setAutoForm({ ...autoForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">Kategori</label><select value={autoForm.trigger_category} onChange={(e) => setAutoForm({ ...autoForm, trigger_category: e.target.value as DeviceAutomation["trigger_category"] })} className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"><option value="prefix">Kata depan</option><option value="contains">Kata include</option><option value="exact">Persis</option><option value="regex">Regex</option></select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Tipe Target</label><select value={autoForm.target_type} onChange={(e) => { setAutoForm({ ...autoForm, target_type: e.target.value as never, target_jids: [] }); if (e.target.value === "group") fetchGroups(); }} className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"><option value="">Semua</option><option value="group">Group</option><option value="private">Private</option></select></div>
          </div>
          <Input label="Pola" placeholder={autoForm.trigger_category === "prefix" ? "harga" : autoForm.trigger_category === "regex" ? "^halo.*": "stok"} value={autoForm.pattern} onChange={(e) => setAutoForm({ ...autoForm, pattern: e.target.value })} />
          <div className="space-y-1.5"><label className="text-sm font-medium">Balasan</label><textarea value={autoForm.reply} onChange={(e) => setAutoForm({ ...autoForm, reply: e.target.value })} className="min-h-[80px] w-full rounded-md border border-border bg-surface p-2 text-sm" placeholder="Halo kak, ready ya..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoForm.is_reply} onChange={(e) => setAutoForm({ ...autoForm, is_reply: e.target.checked })} /> Reply (balas pesan)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoForm.is_forwarded} onChange={(e) => setAutoForm({ ...autoForm, is_forwarded: e.target.checked })} /> Forwarded</label>
          </div>
          <Input label="Mentions (@everyone atau 628xxx, pisah koma)" placeholder="@everyone atau 628123456789" value={autoForm.mentions} onChange={(e) => setAutoForm({ ...autoForm, mentions: e.target.value })} />
          <div className="space-y-1.5"><label className="text-sm font-medium">Durasi hilang</label><select value={autoForm.duration} onChange={(e) => setAutoForm({ ...autoForm, duration: Number(e.target.value) })} className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm"><option value={0}>Tidak hilang</option><option value={86400}>24 jam</option><option value={604800}>7 hari</option><option value={7776000}>90 hari</option></select></div>

          {autoForm.target_type === "group" && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">Pilih Grup ({autoForm.target_jids.length} dipilih)</p><Button variant="secondary" size="sm" onClick={() => setGroupPickerOpen(!groupPickerOpen)}>{groupPickerOpen ? "Tutup" : "Pilih"}</Button></div>
              {autoForm.target_jids.length > 0 && <div className="flex flex-wrap gap-1">{autoForm.target_jids.map((jid) => (<span key={jid} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">{jid.slice(0,18)}… <button onClick={() => setAutoForm({ ...autoForm, target_jids: autoForm.target_jids.filter((x) => x !== jid) })} className="ml-1">×</button></span>))}</div>}
              {groupPickerOpen && (
                <div className="space-y-2">
                  <Input placeholder="Cari grup..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
                  <div className="max-h-48 overflow-auto rounded border border-border divide-y">
                    {groupsLoading ? <div className="p-4 text-center text-sm text-text-muted">Memuat...</div> : displayedGroups.length === 0 ? <div className="p-4 text-center text-xs text-text-muted">{groups.length === 0 ? "Device belum terhubung / tidak ada grup" : "Tidak ada hasil"}</div> : displayedGroups.map((g) => (
                      <label key={g.JID} className="flex items-center gap-2 p-2 hover:bg-surface-subtle cursor-pointer text-sm">
                        <input type="checkbox" checked={autoForm.target_jids.includes(g.JID)} onChange={(e) => setAutoForm({ ...autoForm, target_jids: e.target.checked ? [...autoForm.target_jids, g.JID] : autoForm.target_jids.filter((x) => x !== g.JID) })} />
                        <span className="flex-1 truncate">{g.Name || g.JID}</span><span className="text-xs text-text-muted">{g.ParticipantCount ?? ""}</span>
                      </label>
                    ))}
                  </div>
                  {filteredGroups.length > 100 && <p className="text-xs text-text-muted">Menampilkan 100 dari {filteredGroups.length} — gunakan pencarian</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setAutoForm({ ...autoForm, target_jids: filteredGroups.slice(0,20).map((g) => g.JID) })}>Pilih 20 pertama</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAutoForm({ ...autoForm, target_jids: [] })}>Bersihkan</Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-text-muted">Kosongkan = semua grup. Pilih multi → akan dibuat 1 automasi per grup (duplicate).</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setAutoModal(false)} disabled={autoSaving}>Batal</Button>
            <Button onClick={saveAutomation} loading={autoSaving} disabled={autoSaving}>{editingAuto ? "Simpan" : "Buat"}</Button>
          </div>
        </div>
      </Modal>

      {/* Connect Modal QR/Code */}
      <Modal open={connectModal} onClose={() => { setConnectModal(false); setQrUrl(""); setPairCode(null); }} title="Hubungkan WhatsApp">
        <div className="space-y-4">
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-subtle p-1">
            <button role="tab" aria-selected={activeConnectTab === "qr"} onClick={() => setActiveConnectTab("qr")} className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${activeConnectTab === "qr" ? "bg-surface shadow border border-border" : "text-text-muted"}`}><QrCode className="h-4 w-4" />QR</button>
            <button role="tab" aria-selected={activeConnectTab === "code"} onClick={() => setActiveConnectTab("code")} className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${activeConnectTab === "code" ? "bg-surface shadow border border-border" : "text-text-muted"}`}><KeyRound className="h-4 w-4" />Kode</button>
          </div>
          {activeConnectTab === "qr" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-sm">Scan di HP: <b>WhatsApp → Perangkat Tertaut → Tautkan</b></div>
              <div className="flex justify-center">{qrLoading ? <Skeleton className="h-64 w-64" /> : qrUrl ? <img src={qrUrl} alt="QR" className="h-64 w-64 border bg-white p-2 rounded-xl" /> : <div className="h-64 w-64 grid place-items-center border-dashed border rounded-xl text-sm text-text-muted">QR tidak tersedia</div>}</div>
              <div className="flex justify-end gap-2 border-t pt-3"><Button variant="secondary" onClick={() => setConnectModal(false)}>Tutup</Button><Button variant="secondary" loading={qrLoading} onClick={() => fetchQr(deviceId)}><RefreshCw className="h-4 w-4" />Muat Ulang</Button></div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input label="Nomor HP" placeholder="62812xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))} />
              <Button onClick={() => fetchPairCode(deviceId, phone)} loading={pairCodeLoading} disabled={!phone.trim()} className="w-full"><Phone className="h-4 w-4" />Dapatkan Kode</Button>
              {pairCode ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"><p className="text-xs uppercase tracking-widest text-text-muted">Kode</p><p className="font-mono text-3xl font-bold tracking-[0.2em] flex items-center justify-center gap-2">{pairCode}<button onClick={async () => { await navigator.clipboard.writeText(pairCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="h-8 w-8 grid place-items-center border rounded-md bg-surface">{copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}</button></p></div> : <div className="border-dashed border rounded-xl p-6 text-center text-sm text-text-muted">Belum ada kode</div>}
              <div className="flex justify-end gap-2 border-t pt-3"><Button variant="secondary" onClick={() => setConnectModal(false)}>Tutup</Button></div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
