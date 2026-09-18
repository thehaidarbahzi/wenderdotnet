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
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
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
    is_case_sensitive: false,
    reply: "",
    is_reply: false,
    mentions: "",
    duration: 0,
    is_forwarded: false,
    target_type: "" as "" | "group" | "private",
    target_jids: [] as string[],
  });

  const [keywordInput, setKeywordInput] = useState("");

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsFetched, setGroupsFetched] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const [importModal, setImportModal] = useState(false);
  const [importDevices, setImportDevices] = useState<
    Array<{ id: string; display_name: string; state: string }>
  >([]);
  const [importDevicesLoading, setImportDevicesLoading] = useState(false);
  const [importSourceId, setImportSourceId] = useState("");
  const [importSourceAutomations, setImportSourceAutomations] = useState<
    DeviceAutomation[]
  >([]);
  const [importSourceLoading, setImportSourceLoading] = useState(false);
  const [importSelectedIds, setImportSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [importing, setImporting] = useState(false);

  const isLoggedIn = status?.is_logged_in ?? device?.state === "logged_in";
  const isMenghubungkan = status?.state === "connecting" || device?.state === "connecting";

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
          setDevice((prev) => ({
            id: found.id,
            display_name: found.display_name,
            state: found.state,
            jid: prev?.jid ?? "",
          }));
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
                state: s.state || prev.state,
                jid: s.jid || s.results?.jid || prev.jid || "",
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
        if (isLoggedIn) fetchAutomations();
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
  }, [fetchDevice, fetchAutomations, isLoggedIn]);

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
          toast.error(
            data.error || "Perangkat belum terhubung untuk ambil grup",
          );
        else toast.error(data.error || "Gagal mengambil daftar grup");
      }
    } catch {
      toast.error("Gagal mengambil grup");
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

  const fetchImportDevices = useCallback(async () => {
    setImportDevicesLoading(true);
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        const list =
          (data.devices as Array<{
            id: string;
            display_name: string;
            state: string;
          }>) || [];
        setImportDevices(list.filter((d) => d.id !== deviceId));
      }
    } catch {
      toast.error("Gagal mengambil daftar perangkat");
    } finally {
      setImportDevicesLoading(false);
    }
  }, [deviceId]);

  const fetchImportSourceAutomations = useCallback(async (sourceId: string) => {
    if (!sourceId) return;
    setImportSourceLoading(true);
    setImportSourceAutomations([]);
    setImportSelectedIds(new Set());
    try {
      const res = await fetch(`/api/devices/${sourceId}/automations`);
      const data = await res.json();
      if (res.ok) {
        setImportSourceAutomations(data.automations ?? []);
      } else {
        toast.error(data.error || "Gagal mengambil automasi sumber");
      }
    } catch {
      toast.error("Gagal mengambil automasi sumber");
    } finally {
      setImportSourceLoading(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (importing || importSelectedIds.size === 0 || !importSourceId) return;
    setImporting(true);
    let success = 0;
    let skipped = 0;
    for (const auto of importSourceAutomations.filter((a) =>
      importSelectedIds.has(a.id),
    )) {
      const payload = {
        name: auto.name,
        trigger_category: auto.trigger_category,
        pattern: auto.pattern,
        is_case_sensitive: (auto as unknown as { is_case_sensitive?: boolean }).is_case_sensitive ?? false,
        reply: auto.reply,
        is_reply: auto.is_reply,
        mentions: auto.mentions || undefined,
        duration: auto.duration,
        is_forwarded: auto.is_forwarded,
        target_type: auto.target_type || undefined,
        target_jid: auto.target_jid || null,
      };
      try {
        let res = await fetch(`/api/devices/${deviceId}/automations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let data: unknown = null;
        try {
          data = await res.json();
        } catch {}
        if (res.status === 409) {
          const retryPayload = { ...payload, name: `${auto.name} (salinan)` };
          res = await fetch(`/api/devices/${deviceId}/automations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(retryPayload),
          });
          if (res.ok) success++;
          else skipped++;
        } else if (res.ok) {
          success++;
        } else {
          const err = (data as { error?: string })?.error || "";
          if (err.includes("sudah ada")) skipped++;
          else skipped++;
        }
      } catch {
        skipped++;
      }
    }
    if (success > 0) {
      toast.success(
        `${success} automasi diimpor${skipped > 0 ? `, ${skipped} dilewati karena sudah ada` : ""}`,
      );
      setImportModal(false);
      setImportSourceId("");
      setImportSourceAutomations([]);
      setImportSelectedIds(new Set());
      fetchAutomations();
    } else {
      toast.error(
        skipped > 0
          ? "Tidak ada yang diimpor. Semua sudah ada di perangkat ini."
          : "Gagal mengimpor automasi",
      );
    }
    setImporting(false);
  }, [
    importing,
    importSelectedIds,
    importSourceId,
    importSourceAutomations,
    deviceId,
    fetchAutomations,
  ]);

  const saveAutomation = async () => {
    if (autoSaving) return;
    // flush pending keywordInput jika ada
    let effectivePattern = autoForm.pattern;
    const pendingKw = keywordInput.trim().replace(/,+$/, "");
    if (pendingKw) {
      const existing = effectivePattern
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!existing.includes(pendingKw) && existing.length < 10 && pendingKw.length <= 50) {
        effectivePattern = [...existing, pendingKw].join(", ");
        setAutoForm((prev) => ({ ...prev, pattern: effectivePattern }));
        setKeywordInput("");
      }
    }
    const keywords = effectivePattern
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const errs: Record<string, string> = {};
    if (!autoForm.name.trim()) errs.name = "Nama wajib diisi";
    if (keywords.length === 0) errs.pattern = "Minimal 1 keyword wajib diisi";
    else if (keywords.length > 10) errs.pattern = "Maksimal 10 keyword";
    else if (keywords.some((k) => k.length > 50)) errs.pattern = "Keyword max 50 karakter";
    if (!autoForm.reply.trim()) errs.reply = "Balasan wajib diisi";
    if (autoForm.target_type === "group" && autoForm.target_jids.length === 0)
      errs.target = "Pilih minimal satu grup";
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
        pattern: keywords.join(", "),
        is_case_sensitive: autoForm.is_case_sensitive,
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
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui");
        toast.success("Automasi diperbarui");
      } else {
        const res = await fetch(`/api/devices/${deviceId}/automations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal membuat automasi");
        const count = data.automations?.length ?? 1;
        toast.success(
          count > 1
            ? `${count} automasi dibuat (1 per grup)`
            : "Automasi ditambahkan",
        );
      }
      setAutoModal(false);
      fetchAutomations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
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
      if (!res.ok) throw new Error("Gagal mengganti status");
      setAutomations((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)),
      );
    } catch {
      toast.error("Gagal mengganti status");
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
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Automasi dihapus");
      setAutomations((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error("Gagal menghapus");
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
      else toast.error(data.error || "QR tidak tersedia");
    } catch {
      toast.error("Gagal mengambil QR");
    } finally {
      setQrLoading(false);
    }
  };
  const fetchPairCode = async (id: string, p: string) => {
    if (!p.trim()) {
      toast.error("Nomor HP wajib diisi");
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
        toast.success("Kode didapat");
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
      <div className="space-y-6">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Skeleton className="hidden h-12 w-12 shrink-0 rounded-sm sm:block" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-11 w-full sm:w-40 rounded-sm" />
        </div>
        <Skeleton className="h-10 w-full rounded-sm" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-sm border border-border bg-surface p-4"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-sm" />
      </div>
    );
  if (!device)
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Perangkat tidak ditemukan</p>
        <Link href="/devices" className="text-primary text-sm">
          Kembali
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <Link
        href="/devices"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Perangkat
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-sm border border-border bg-surface-subtle text-text-muted sm:grid">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-text-primary">
              <span className="truncate">{device.display_name}</span>
              <Badge
                variant={
                  isLoggedIn ? "success" : isMenghubungkan ? "warning" : "default"
                }
              >
                {isLoggedIn ? "Terhubung" : isMenghubungkan ? "Menghubungkan" : "Terputus"}
              </Badge>
            </h1>
            <p className="font-mono text-sm leading-none tracking-wide text-slate-600 dark:text-slate-400 truncate">
              {device.id}
            </p>
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
              Hubungkan WhatsApp
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
                    throw new Error(err.error || "Gagal memutus");
                  }
                  toast.success("Terputus");
                  fetchDevice();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Gagal memutus",
                  );
                } finally {
                  setDetailDisconnecting(false);
                }
              }}
            >
              <WifiOff className="h-4 w-4" />
              Putuskan
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
            {t === "overview" ? "Ringkasan" : "Automasi"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {!isLoggedIn ? (
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <WifiOff className="h-4 w-4" />
                Perangkat belum terhubung
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-200/80">
                Hubungkan perangkat untuk mulai menerima pesan. Klik{" "}
                <b>Hubungkan WhatsApp</b> di atas dan ikuti petunjuk di ponsel.
              </p>
              <Button
                onClick={openConnect}
                variant="primary"
                size="sm"
                className="mt-3"
                loading={detailConnectLoading}
              >
                <Plug className="h-4 w-4" />
                Hubungkan sekarang
              </Button>
            </div>
          ) : automations.length === 0 ? (
            <div className="rounded-sm border border-primary/20 bg-primary-subtle dark:bg-[#1E4D3B]/20 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
                <Zap className="h-4 w-4" />
                Siap untuk automasi
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Perangkat sudah <b>terhubung</b>. Buat automasi pertama agar
                membalas otomatis.
              </p>
              <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-text-secondary">
                <li>
                  Buka tab <b>Automasi</b> di atas
                </li>
                <li>
                  Klik <b>Tambah</b> → isi <i>Nama</i>, <i>Pola</i> (“harga”),{" "}
                  <i>Balas</i>
                </li>
                <li>
                  Pilih <i>Grup</i> untuk khusus grup atau <i>Semua</i>
                </li>
              </ol>
              <Button
                onClick={() => setTab("automasi")}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                <Plus className="h-4 w-4" />
                Buat automasi pertama
              </Button>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total automasi"
              value={automations.length}
              icon={<Hash className="h-5 w-5" />}
              tone="default"
              className="p-5"
            />
            <StatCard
              label="AUTOMASI AKTIF"
              value={automations.filter((a) => a.enabled).length}
              icon={<Zap className="h-5 w-5" />}
              tone="success"
              className="p-5"
            />
            <div className="rounded-sm border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Nomor Perangkat
              </p>
              <p className="mt-2 font-mono text-xs break-all bg-surface-subtle rounded-sm px-2 py-1.5 border border-border">
                {device.jid ? device.jid.split("@")[0].split(":")[0] : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "automasi" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tight text-text-primary">
                Automasi untuk perangkat ini
              </h3>
              {autoLoading && automations.length > 0 && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Memuat
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full sm:w-auto justify-center"
                onClick={() => {
                  setImportModal(true);
                  setImportSourceId("");
                  setImportSourceAutomations([]);
                  setImportSelectedIds(new Set());
                  fetchImportDevices();
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Impor dari perangkat lain
                </span>
                <span className="sm:hidden">Impor</span>
              </Button>
              <Button
                className="w-full sm:w-auto justify-center"
                onClick={() => {
                  setEditingAuto(null);
                  setAutoForm({
                    name: "",
                    trigger_category: "contains",
                    pattern: "",
                    is_case_sensitive: false,
                    reply: "",
                    is_reply: false,
                    mentions: "",
                    duration: 0,
                    is_forwarded: false,
                    target_type: "",
                    target_jids: [],
                  });
                  setKeywordInput("");
                  setAutoErrors({});
                  setAutoStep(1);
                  setAutoModal(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah automasi
              </Button>
            </div>
          </div>
          {!isLoggedIn && (
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <WifiOff className="h-4 w-4" />
                Perangkat belum terhubung
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-200/80">
                Hubungkan perangkat untuk mulai menerima pesan. Klik{" "}
                <b>Hubungkan WhatsApp</b> di atas dan ikuti petunjuk di ponsel.
              </p>
              <Button
                onClick={openConnect}
                variant="primary"
                size="sm"
                className="mt-3"
                loading={detailConnectLoading}
              >
                <Plug className="h-4 w-4" />
                Hubungkan sekarang
              </Button>
            </div>
          )}
          {autoLoading && automations.length === 0 ? (
            <div className="grid gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-sm border border-border bg-surface p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-sm" />
                      </div>
                      <Skeleton className="h-16 w-full rounded-sm" />
                      <div className="flex flex-wrap gap-1.5">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 lg:w-40 lg:shrink-0">
                      <Skeleton className="h-9 w-full rounded-sm" />
                      <Skeleton className="h-9 w-full rounded-sm" />
                      <Skeleton className="h-9 w-full rounded-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : automations.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border p-8 text-center">
              <p className="text-sm text-text-muted">
                Belum ada automasi untuk perangkat ini. Buat yang pertama, atur kata pemicu dan isi balasannya.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setImportModal(true);
                  setImportSourceId("");
                  setImportSourceAutomations([]);
                  setImportSelectedIds(new Set());
                  fetchImportDevices();
                }}
              >
                <Download className="h-4 w-4" />
                Impor dari perangkat lain
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {automations.map((a) => {
                const targetLabel =
                  a.target_type === "group"
                    ? a.target_jid
                      ? groups.find((g) => g.JID === a.target_jid)?.Name ||
                        a.target_jid
                      : "Semua grup"
                    : a.target_type === "private"
                      ? "Hanya privat"
                      : "Semua chat";
                const durationLabel =
                  a.duration === 0
                    ? "Permanen"
                    : a.duration === 86400
                      ? "24 jam"
                      : a.duration === 604800
                        ? "7 hari"
                        : "90 hari";
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
                          {(a as unknown as { is_case_sensitive?: boolean }).is_case_sensitive && (
                            <span className="rounded-sm bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-xs text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-300" title="Case-sensitive">
                              Aa
                            </span>
                          )}
                        </div>
                        <div className="rounded-sm bg-surface-subtle border border-border p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {(a.pattern || "")
                              .split(/[,\n]+/)
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((kw) => (
                                <span
                                  key={kw}
                                  className="inline-flex items-center rounded-full bg-surface border border-border px-2.5 py-0.5 font-mono text-xs text-text-secondary"
                                >
                                  {kw}
                                </span>
                              ))}
                            {(a as unknown as { is_case_sensitive?: boolean }).is_case_sensitive && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                case-sensitive
                              </span>
                            )}
                          </div>
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
                          {a.enabled ? "Nonaktifkan" : "Aktifkan"}
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
                              is_case_sensitive: (a as unknown as { is_case_sensitive?: boolean }).is_case_sensitive ?? false,
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
                            setKeywordInput("");
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
        title={editingAuto ? "Ubah Automasi" : "Tambah Automasi"}
      >
        <div className="space-y-5">
          {autoStep === 1 && (
            <div className="space-y-6">
              <div className="rounded-sm border border-primary/20 bg-primary-subtle dark:bg-[#1E4D3B]/20 px-3 py-2.5">
                <p className="text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Langkah 1 dari 4: identitas
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  Beri nama yang jelas agar mudah ditemukan. Pelanggan tidak
                  melihat ini.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  label="Nama automasi *"
                  placeholder="Contoh: Balas harga di Grup Promo"
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
                  Gunakan nama spesifik seperti “Balas stok” bukan “Tes 1”.
                </p>
              </div>
            </div>
          )}

          {autoStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Kategori pemicu</label>
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
                  <option value="prefix">Awalan: pesan diawali ini</option>
                  <option value="contains">Mengandung: muncul di mana saja</option>
                  <option value="exact">Sama persis: harus cocok persis</option>
                </select>
                <p className="text-xs leading-relaxed text-text-muted">
                  {autoForm.trigger_category === "contains"
                    ? "Cocok jika keyword muncul di mana saja. Pesan “ada promo?” akan memicu balasan untuk keyword “promo”."
                    : autoForm.trigger_category === "prefix"
                      ? "Balas hanya jika pesan diawali keyword tersebut. “harga berapa” cocok, “berapa harga” tidak."
                      : "Balas hanya jika pesan sama persis dengan salah satu keyword. “harga” tidak cocok dengan “harga berapa”."}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Keyword pemicu *</label>
                  <span className="text-xs font-mono text-text-muted border border-border bg-surface-subtle rounded-full px-2 py-0.5">
                    {autoForm.pattern.split(/[,\n]+/).filter((s) => s.trim()).length}/10
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const raw = keywordInput.trim();
                        if (!raw) return;
                        const kws = raw
                          .split(/[,\n]+/)
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const existing = autoForm.pattern
                          .split(/[,\n]+/)
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const merged = Array.from(new Set([...existing, ...kws])).slice(0, 10);
                        if (merged.length === existing.length && kws.length > 0 && existing.includes(kws[0])) {
                          toast.error("Keyword sudah ada");
                          setKeywordInput("");
                          return;
                        }
                        if (existing.length + kws.length > 10) toast.error("Maksimal 10 keyword");
                        if (kws.some((k) => k.length > 50)) { toast.error("Keyword max 50 karakter"); return; }
                        setAutoForm({ ...autoForm, pattern: merged.join(", ") });
                        setKeywordInput("");
                        if (autoErrors.pattern) setAutoErrors((prev) => ({ ...prev, pattern: "" }));
                      }
                    }}
                    placeholder={
                      autoForm.trigger_category === "prefix"
                        ? "Contoh: harga"
                        : autoForm.trigger_category === "exact"
                          ? "Contoh: hello"
                          : "Contoh: promo"
                    }
                    className={`h-10 flex-1 rounded-sm border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${autoErrors.pattern ? "border-error" : "border-border"}`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 shrink-0 rounded-sm px-4"
                    onClick={() => {
                      const raw = keywordInput.trim();
                      if (!raw) {
                        if (!autoForm.pattern.trim()) toast.error("Ketik keyword dulu");
                        return;
                      }
                      const kws = raw
                        .split(/[,\n]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const existing = autoForm.pattern
                        .split(/[,\n]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (kws.length === 0) return;
                      if (kws.some((k) => k.length > 50)) { toast.error("Keyword max 50 karakter"); return; }
                      const merged = Array.from(new Set([...existing, ...kws])).slice(0, 10);
                      if (existing.length >= 10) { toast.error("Maksimal 10 keyword"); return; }
                      setAutoForm({ ...autoForm, pattern: merged.join(", ") });
                      setKeywordInput("");
                      if (autoErrors.pattern) setAutoErrors((prev) => ({ ...prev, pattern: "" }));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Tambah
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  Tekan Enter atau klik Tambah untuk menyimpan. Tempel beberapa kata dipisah koma, contoh harga, price, biaya, lalu Enter.
                </p>
                {(() => {
                  const kws = autoForm.pattern.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
                  if (kws.length === 0) return null;
                  return (
                    <div className="rounded-sm border border-border bg-surface-subtle/50 p-3 space-y-2">
                      <p className="text-xs font-medium text-text-muted">
                        {kws.length} keyword. Salah satu cocok, pesan dibalas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {kws.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-xs font-medium text-text-primary shadow-sm"
                          >
                            {kw}
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = kws.filter((x) => x !== kw);
                                setAutoForm({ ...autoForm, pattern: filtered.join(", ") });
                              }}
                              className="grid h-4 w-4 place-items-center rounded-full bg-surface-subtle border border-border hover:bg-error/10 hover:text-error hover:border-error/20 ml-1"
                              aria-label={`Hapus ${kw}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoForm({ ...autoForm, pattern: "" })}
                        className="text-xs text-text-muted hover:text-error underline"
                      >
                        Hapus semua
                      </button>
                    </div>
                  );
                })()}
                {autoErrors.pattern && <p className="text-xs text-error">{autoErrors.pattern}</p>}
              </div>
              <label className="flex items-start gap-3 rounded-sm border border-border bg-surface p-3 cursor-pointer hover:bg-surface-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={autoForm.is_case_sensitive}
                  onChange={(e) => setAutoForm({ ...autoForm, is_case_sensitive: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded-sm border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm leading-snug">
                  <span className="font-medium flex items-center gap-1.5">
                    Bedakan huruf besar dan kecil <span className="rounded-sm bg-surface-subtle border border-border px-1.5 py-0.5 font-mono text-xs">Aa</span>
                  </span>
                  <span className="text-xs text-text-muted block mt-1">
                    Jika aktif, “Harga” tidak akan cocok dengan “harga”. Matikan untuk mengabaikan perbedaan huruf.
                  </span>
                </span>
              </label>
            </div>
          )}

          {autoStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Berlaku untuk</label>
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
                  <option value="">Semua chat</option>
                  <option value="group">Hanya grup</option>
                  <option value="private">Hanya privat</option>
                </select>
                <p className="text-xs text-text-muted">
                  Hanya grup menjaga balasan tidak masuk ke chat privat.
                </p>
                {autoErrors.target && (
                  <p className="text-xs text-error">{autoErrors.target}</p>
                )}
              </div>
              {autoForm.target_type === "group" ? (
                <div className="rounded-sm border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Pilih grup ({autoForm.target_jids.length} dipilih)
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setGroupPickerOpen(!groupPickerOpen)}
                    >
                      {groupPickerOpen ? "Tutup" : "Pilih"}
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
                            className="inline-flex items-center gap-1 rounded-full bg-primary-subtle dark:bg-[#1E4D3B]/30 px-2.5 py-1 text-xs text-[#1E4D3B] dark:text-[#6EE7B7] border border-primary/20"
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
                        placeholder="Cari grup"
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                      />
                      <div className="max-h-48 overflow-auto rounded-sm border border-border divide-y">
                        {groupsLoading ? (
                          <div className="p-4 text-center text-sm text-text-muted">
                            Memuat grup
                          </div>
                        ) : displayedGroups.length === 0 ? (
                          <div className="p-4 text-center text-xs text-text-muted">
                            {groups.length === 0
                              ? "Tidak ada grup. Hubungkan perangkat dulu."
                              : "Tidak ada hasil"}
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
                          Menampilkan 100 dari {filteredGroups.length}. Use
                          search to narrow.
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
                          Pilih 20 pertama
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setAutoForm({ ...autoForm, target_jids: [] })
                          }
                        >
                          Bersihkan
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    Kosongkan untuk berlaku ke semua grup. Memilih beberapa akan
                    membuat satu automasi per grup.
                  </p>
                </div>
              ) : (
                <div className="rounded-sm border border-dashed border-border bg-surface-subtle p-5 text-center">
                  <p className="text-sm text-text-secondary">
                    {autoForm.target_type === ""
                      ? "Balasan akan dikirim ke chat apa pun yang cocok."
                      : "Hanya chat privat yang akan dibalas."}
                  </p>
                </div>
              )}
            </div>
          )}

          {autoStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Pesan balasan <span className="text-error">*</span>
                </label>
                <textarea
                  value={autoForm.reply}
                  onChange={(e) => {
                    setAutoForm({ ...autoForm, reply: e.target.value });
                    if (autoErrors.reply)
                      setAutoErrors((prev) => ({ ...prev, reply: "" }));
                  }}
                  className={`min-h-[110px] w-full rounded-sm border bg-surface px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${autoErrors.reply ? "border-error" : "border-border"}`}
                  placeholder="Hai, stok tersedia. Harga 25rb, cek katalog ya"
                />
                {autoErrors.reply ? (
                  <p className="text-xs text-error">{autoErrors.reply}</p>
                ) : (
                  <p className="text-xs text-text-muted">
                    Tulis seperti membalas manual. Emoji boleh.
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
                    <span className="font-medium">Kutip pesan asli</span>
                    <br />
                    <span className="text-xs text-text-muted">
                      Balas sebagai kutipan.
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
                    <span className="font-medium">
                      Tandai sebagai diteruskan
                    </span>
                    <br />
                    <span className="text-xs text-text-muted">
                      Tampilkan label Diteruskan.
                    </span>
                  </span>
                </label>
              </div>
              {autoForm.target_type === "group" && (
                <div className="space-y-3">
                  <Input
                    label="Sebut"
                    placeholder="@everyone or 628123456789"
                    value={autoForm.mentions}
                    onChange={(e) =>
                      setAutoForm({ ...autoForm, mentions: e.target.value })
                    }
                  />
                  <p className="text-xs text-text-muted">
                    Hanya grup. Kosongkan jika tidak perlu menyebut.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium">Pesan menghilang</label>
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
                  <option value={0}>Permanen</option>
                  <option value={86400}>24 jam</option>
                  <option value={604800}>7 hari</option>
                  <option value={7776000}>90 hari</option>
                </select>
                <p className="text-xs text-text-muted">
                  Pewaktu pesan menghilang WhatsApp.
                </p>
              </div>
              <div className="rounded-sm border border-border bg-surface p-3">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Ringkasan
                </p>
                <div className="mt-2 space-y-1 text-xs text-text-secondary">
                  <p>
                    <span className="font-medium text-text-primary">Nama:</span>{" "}
                    {autoForm.name || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Trigger:
                    </span>{" "}
                    {autoForm.trigger_category} “{autoForm.pattern || "-"}”{" "}
                    {autoForm.is_case_sensitive ? "(case-sensitive)" : "(case-insensitive)"}
                  </p>
                  <p>
                    <span className="font-medium text-text-primary">
                      Target:
                    </span>{" "}
                    {autoForm.target_type === "group"
                      ? `${autoForm.target_jids.length ? autoForm.target_jids.map((j) => groups.find((g) => g.JID === j)?.Name || j).join(", ") : "semua grup"}`
                      : autoForm.target_type === "private"
                        ? "privat"
                        : "semua chat"}
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
              {autoStep === 1 ? "Batal" : "Kembali"}
            </Button>
            <div className="flex gap-2">
              {autoStep < 4 ? (
                <Button
                  onClick={() => {
                    // flush keywordInput yang belum di-Enter
                    let currentPattern = autoForm.pattern;
                    const pending = keywordInput.trim().replace(/,+$/, "");
                    if (autoStep === 2 && pending) {
                      const existing = currentPattern
                        .split(/[,\n]+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (!existing.includes(pending) && existing.length < 10 && pending.length <= 50) {
                        currentPattern = [...existing, pending].join(", ");
                        setAutoForm({ ...autoForm, pattern: currentPattern });
                        setKeywordInput("");
                      }
                    }
                    const kws = currentPattern
                      .split(/[,\n]+/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const nextErrors: Record<string, string> = {};
                    if (autoStep === 1 && !autoForm.name.trim())
                      nextErrors.name = "Nama wajib diisi";
                    if (autoStep === 2) {
                      if (kws.length === 0) nextErrors.pattern = "Minimal 1 keyword wajib diisi";
                      else if (kws.length > 10) nextErrors.pattern = "Maksimal 10 keyword";
                    }
                    if (
                      autoStep === 3 &&
                      autoForm.target_type === "group" &&
                      autoForm.target_jids.length === 0
                    )
                      nextErrors.target = "Pilih minimal satu grup";
                    if (Object.keys(nextErrors).length) {
                      setAutoErrors(nextErrors);
                      return;
                    }
                    setAutoErrors({});
                    setAutoStep(autoStep + 1);
                  }}
                >
                  Lanjut
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const errs: Record<string, string> = {};
                    if (!autoForm.reply.trim())
                      errs.reply = "Balasan wajib diisi";
                    if (Object.keys(errs).length) {
                      setAutoErrors(errs);
                      return;
                    }
                    saveAutomation();
                  }}
                  loading={autoSaving}
                  disabled={autoSaving}
                >
                  {editingAuto ? "Simpan" : "Buat automasi"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={importModal}
        onClose={() => !importing && setImportModal(false)}
        title="Impor automasi"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            Salin automasi dari perangkat lain ke perangkat ini. Pilih sumber,
            lalu pilih automasi yang ingin dipakai di sini.
          </p>
          <div className="space-y-3">
            <label className="text-sm font-medium">Perangkat sumber</label>
            {importDevicesLoading ? (
              <div className="rounded-sm border border-border p-4 text-center text-sm text-text-muted">
                Memuat perangkat...
              </div>
            ) : importDevices.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border bg-surface-subtle p-6 text-center">
                <p className="text-sm text-text-muted">
                  Belum ada perangkat lain untuk diimpor.
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Tambah perangkat dulu, hubungkan, lalu kembali ke sini.
                </p>
              </div>
            ) : (
              <select
                value={importSourceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setImportSourceId(id);
                  if (id) fetchImportSourceAutomations(id);
                  else {
                    setImportSourceAutomations([]);
                    setImportSelectedIds(new Set());
                  }
                }}
                className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Pilih perangkat</option>
                {importDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.display_name} ·{" "}
                    {d.state === "logged_in"
                      ? "Terhubung"
                      : d.state === "connecting"
                        ? "Menghubungkan"
                        : "Terputus"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {importSourceId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Pilih automasi{" "}
                  {importSourceAutomations.length > 0
                    ? `(${importSelectedIds.size}/${importSourceAutomations.length} dipilih)`
                    : ""}
                </p>
                {importSourceAutomations.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setImportSelectedIds(
                          new Set(importSourceAutomations.map((a) => a.id)),
                        )
                      }
                    >
                      Pilih semua
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImportSelectedIds(new Set())}
                    >
                      Bersihkan
                    </Button>
                  </div>
                )}
              </div>

              {importSourceLoading ? (
                <div className="rounded-sm border border-border p-4 text-center text-sm text-text-muted">
                  Memuat automasi...
                </div>
              ) : importSourceAutomations.length === 0 ? (
                <div className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-text-muted">
                  Tidak ada automasi di perangkat sumber.
                </div>
              ) : (
                <div className="max-h-64 overflow-auto rounded-sm border border-border divide-y">
                  {importSourceAutomations.map((a) => {
                    const targetLabel =
                      a.target_type === "group"
                        ? a.target_jid
                          ? a.target_jid.slice(0, 18) + "…"
                          : "Semua grup"
                        : a.target_type === "private"
                          ? "Hanya privat"
                          : "Semua chat";
                    return (
                      <label
                        key={a.id}
                        className="flex items-start gap-3 p-3 hover:bg-surface-subtle cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={importSelectedIds.has(a.id)}
                          onChange={(e) => {
                            const next = new Set(importSelectedIds);
                            if (e.target.checked) next.add(a.id);
                            else next.delete(a.id);
                            setImportSelectedIds(next);
                          }}
                          className="mt-1 rounded-sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-text-primary">
                            {a.name}
                          </span>
                          <span className="mt-1 block font-mono text-xs text-text-muted truncate">
                            “{a.pattern}” → “{a.reply.slice(0, 40)}
                            {a.reply.length > 40 ? "…" : ""}”
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            <span className="inline-flex rounded-sm bg-surface-subtle border border-border px-1.5 py-0.5 text-xs text-text-muted">
                              {a.trigger_category}
                            </span>
                            <span className="inline-flex rounded-sm bg-surface-subtle border border-border px-1.5 py-0.5 text-xs text-text-muted">
                              {targetLabel}
                            </span>
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs leading-relaxed text-text-muted">
                Nama yang sudah ada akan disimpan sebagai “Nama (salinan)”.
                Target grup memakai JID yang sama, jadi pastikan perangkat ini
                juga join grup tersebut.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => !importing && setImportModal(false)}
              disabled={importing}
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={
                importing || importSelectedIds.size === 0 || !importSourceId
              }
            >
              Impor{" "}
              {importSelectedIds.size > 0 ? `(${importSelectedIds.size})` : ""}
            </Button>
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
        title="Hubungkan WhatsApp"
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
              Kode QR
            </button>
            <button
              role="tab"
              aria-selected={activeConnectTab === "code"}
              onClick={() => setActiveConnectTab("code")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium ${activeConnectTab === "code" ? "bg-surface shadow border border-border" : "text-text-muted"}`}
            >
              <KeyRound className="h-4 w-4" />
              Kode Taut
            </button>
          </div>
          {activeConnectTab === "qr" ? (
            <div className="space-y-3">
              <div className="rounded-sm border border-primary/20 bg-primary/5 p-2.5 text-sm">
                Di ponsel:{" "}
                <b>WhatsApp → Perangkat Tertaut → Tautkan perangkat</b>
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
                    QR tidak tersedia
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="secondary"
                  onClick={() => setConnectModal(false)}
                >
                  Tutup
                </Button>
                <Button
                  variant="secondary"
                  loading={qrLoading}
                  onClick={() => fetchQr(deviceId)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Nomor HP"
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
                Dapatkan Kode
              </Button>
              {pairCode ? (
                <div className="rounded-sm border border-primary/20 bg-primary-subtle dark:bg-[#1E4D3B]/20 p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-text-muted">
                    Kode Taut
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
                  Belum ada kode
                </div>
              )}
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="secondary"
                  onClick={() => setConnectModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
