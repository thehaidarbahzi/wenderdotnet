"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, RefreshCw, QrCode, Plug, Unplug, Smartphone, Signal, WifiOff, KeyRound, Copy, Check, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { toast } from "sonner";

interface DeviceWithStatus {
  id: string;
  display_name: string;
  state: string;
  is_connected: boolean;
  is_logged_in: boolean;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithStatus | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [hubungkanLoadingId, setHubungkanLoadingId] = useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // QR / Code tabbing
  const [activeTab, setActiveTab] = useState<"qr" | "code">("qr");
  const [phone, setPhone] = useState("");
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairCodeLoading, setPairCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const total = devices.length;
    const connected = devices.filter((d) => d.state === "logged_in").length;
    const connecting = devices.filter((d) => d.state === "connecting").length;
    const disconnected = total - connected - connecting;
    return { total, connected, connecting, disconnected };
  }, [devices]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load; migrate to RSC data loading to satisfy set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();
  }, [fetchDevices]);

  // Poll status of connecting devices — backend wraps di results (openapi.yaml DeviceStatusResponse)
  // + auto-close QR modal ketika logged_in — dedup biar tidak double notif dengan 5s polling
  useEffect(() => {
    const connecting = devices.filter((d) => d.state === "connecting");
    if (connecting.length === 0) return;
    const interval = setInterval(async () => {
      for (const d of connecting) {
        try {
          const res = await fetch(`/api/devices/${d.id}/status`);
          if (res.ok) {
            const data = await res.json();
            const loggedIn = data.is_logged_in || data.results?.is_logged_in || data.state === "logged_in";
            if (loggedIn && !notifiedRef.current.has(d.id)) {
              notifiedRef.current.add(d.id);
              toast.success(`${d.display_name} connected!`);
              setQrModal(false);
              setQrUrl("");
              setPairCode(null);
              fetchDevices();
            }
          }
        } catch {}
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [devices, fetchDevices]);

  // Auto refresh per-device 5s (tanpa whole page) — visibility-aware, update semua state
  // Ketika bot cabut, state langsung ke disconnected tanpa repeat hit per card (1 call GET /api/devices)
  // Skeleton tidak ditampilkan lagi setelah initial (biarin list aja)
  useEffect(() => {
    if (devices.length === 0) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/devices", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const fresh = data.devices || [];
          // shallow compare untuk hindari rerender kalau tidak ada perubahan
          setDevices((prev) => {
            if (prev.length !== fresh.length) return fresh;
            const same = prev.every((p, i) => p.id === fresh[i].id && p.state === fresh[i].state);
            return same ? prev : fresh;
          });
          // bersihkan notified jika device kembali disconnected (biar bisa notif lagi next connect)
          for (const d of fresh as DeviceWithStatus[]) {
            if (d.state !== "logged_in") notifiedRef.current.delete(d.id);
          }
          // auto-close modal jika selectedDevice sudah logged_in — dedup
          if (qrModal && selectedDevice) {
            const matched = fresh.find((d: DeviceWithStatus) => d.id === selectedDevice.id);
            if (matched?.state === "logged_in" && !notifiedRef.current.has(matched.id)) {
              notifiedRef.current.add(matched.id);
              toast.success(`${matched.display_name} connected!`);
              setQrModal(false);
              setQrUrl("");
              setPairCode(null);
            }
          }
        }
      } catch {}
    };
    interval = setInterval(tick, 5000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [devices.length, fetchDevices, qrModal, selectedDevice]);

  const fetchQr = useCallback(async (deviceId: string) => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/login`);
      if (res.ok) {
        const data = await res.json();
        const link = (data as { qr_link?: string; results?: { qr_link?: string } }).qr_link || (data as { results?: { qr_link?: string } }).results?.qr_link || "";
        if (link) setQrUrl(link);
        else toast.error((data as { error?: string }).error || "QR tidak tersedia. Coba muat ulang.");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Gagal mengambil QR");
      }
    } catch {
      toast.error("Gagal mengambil QR");
    } finally {
      setQrLoading(false);
    }
  }, []);

  const fetchPairCode = useCallback(async (deviceId: string, phoneNumber: string) => {
    if (!phoneNumber.trim()) {
      toast.error("Nomor HP wajib diisi");
      return;
    }
    setPairCodeLoading(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/login/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const code = (data as { pair_code?: string; results?: { pair_code?: string } }).pair_code || (data as { results?: { pair_code?: string } }).results?.pair_code || "";
        if (code) {
          setPairCode(code);
          toast.success("Kode pairing didapatkan");
        } else toast.error(data.error || "Kode tidak tersedia");
      } else {
        toast.error(data.error || "Gagal mendapatkan kode");
      }
    } catch {
      toast.error("Gagal mendapatkan kode");
    } finally {
      setPairCodeLoading(false);
    }
  }, []);

  const openConnectModal = useCallback(async (device: DeviceWithStatus) => {
    if (hubungkanLoadingId) return;
    setHubungkanLoadingId(device.id);
    try {
      notifiedRef.current.delete(device.id);
      setSelectedDevice(device);
      setActiveTab("qr");
      setQrUrl("");
      setPairCode(null);
      setPhone("");
      setQrModal(true);
      await fetchQr(device.id);
    } finally {
      setHubungkanLoadingId(null);
    }
  }, [fetchQr, hubungkanLoadingId]);

  const handleCloseQrModal = useCallback(() => {
    setQrModal(false);
    setQrUrl("");
    setPairCode(null);
    setPhone("");
    setActiveTab("qr");
    fetchDevices();
  }, [fetchDevices]);

  async function handleAddDevice() {
    if (!deviceName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deviceName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat device");
      }

      const data = await res.json();
      setAddModal(false);
      setDeviceName("");

      // Open QR modal
      const newDevice = { ...data.device, state: "connecting", is_connected: false, is_logged_in: false } as DeviceWithStatus;
      setSelectedDevice(newDevice);
      setActiveTab("qr");
      setPairCode(null);
      setPhone("");
      setQrUrl("");
      setQrModal(true);
      await fetchQr(data.device.id);
      fetchDevices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah device");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menghapus device");
      }
      toast.success("Device dihapus");
      fetchDevices();
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus device");
    } finally {
      setDeleting(false);
    }
  }

  function getStateBadge(state: string) {
    switch (state) {
      case "logged_in":
        return <Badge variant="success">Connected</Badge>;
      case "connecting":
        return <Badge variant="warning">Connecting</Badge>;
      default:
        return <Badge variant="default">Disconnected</Badge>;
    }
  }

  function getStateHint(state: string) {
    if (state === "logged_in") return "Siap menerima & membalas chat";
    if (state === "connecting") return "Menunggu scan QR di HP";
    return "Perlu dihubungkan ulang";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace · WhatsApp"
        title="Devices"
        description="Kelola semua nomor WhatsApp Anda. Tambah device, scan QR seperti WhatsApp Web, dan pantau status koneksi real-time."
        actions={
          <Button onClick={() => setAddModal(true)} size="md">
            <Plus className="h-4 w-4" />
            Tambah Device
          </Button>
        }
      />

      {/* Stats — keep visible even while loading (jangan sembunyikan pas refresh) */}
      {devices.length > 0 && (
        <StatGrid>
          <StatCard
            label="Total Devices"
            value={stats.total}
            hint={`${stats.connected} connected · ${stats.disconnected} offline`}
            icon={<Smartphone className="h-5 w-5" />}
            tone="default"
          />
          <StatCard
            label="Terhubung"
            value={stats.connected}
            hint={stats.connected > 0 ? "Siap membalas otomatis" : "Belum ada yang terhubung"}
            icon={<Signal className="h-5 w-5" />}
            tone="success"
          />
          <StatCard
            label="Butuh perhatian"
            value={stats.connecting + stats.disconnected}
            hint={stats.connecting > 0 ? `${stats.connecting} menunggu QR` : "Semua device stabil"}
            icon={<WifiOff className="h-5 w-5" />}
            tone={stats.connecting + stats.disconnected > 0 ? "warning" : "default"}
          />
        </StatGrid>
      )}

      {/* Content — jangan liatin skeleton pas initial/refresh, biarin list tetap keliatan */}
      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-1">
          <EmptyState
            title="Belum ada device"
            description="Tambahkan device WhatsApp pertama Anda. Sama seperti WhatsApp Web — beri nama, scan QR, dan device langsung terhubung. Tidak perlu setting server."
            icon={<QrCode className="h-5 w-5" />}
            className="border-0 bg-transparent"
          />
          <div className="mx-auto mb-6 flex max-w-xl items-center justify-center gap-2 px-6 text-center text-xs text-text-muted">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="font-mono uppercase tracking-widest">Tips</span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>
          <p className="mx-auto mb-8 max-w-xl px-6 text-center text-xs leading-relaxed text-text-muted">
            Gunakan nama yang mudah dikenali, mis. “Toko Online” atau “CS Utama”. Anda bisa menautkan beberapa nomor untuk tim yang berbeda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">
              Daftar device <span className="font-normal text-text-muted">· {devices.length} total</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                if (loading) return;
                setLoading(true);
                fetchDevices();
              }}
              disabled={loading}
              aria-busy={loading}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface hover:text-text-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="grid gap-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-3.5">
                  <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface-subtle text-text-muted transition-colors group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary sm:grid">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/devices/${device.id}`} className="truncate text-[15px] font-semibold text-text-primary hover:text-primary hover:underline">
                        {device.display_name}
                      </Link>
                      {getStateBadge(device.state)}
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-text-muted">{device.id}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{getStateHint(device.state)}</p>
                    <Link href={`/devices/${device.id}`} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Detail <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-stretch border-t border-border pt-3 sm:border-0 sm:pt-0">
                  {device.state !== "logged_in" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Hubungkan ${device.display_name}`}
                      onClick={() => openConnectModal(device)}
                      loading={hubungkanLoadingId === device.id}
                      disabled={hubungkanLoadingId !== null}
                      className="flex-1 sm:flex-none"
                    >
                      <Plug className="h-3.5 w-3.5" />
                      Hubungkan
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Putuskan ${device.display_name}`}
                      loading={disconnectingId === device.id}
                      disabled={disconnectingId !== null}
                      onClick={async () => {
                        if (disconnectingId) return;
                        setDisconnectingId(device.id);
                        try {
                          const res = await fetch(`/api/devices/${device.id}/logout`, { method: "POST" });
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || "Gagal disconnect");
                          }
                          toast.success("Device disconnected");
                          fetchDevices();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Gagal disconnect");
                        } finally {
                          setDisconnectingId(null);
                        }
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                      Disconnect
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Hapus ${device.display_name}`}
                    onClick={() => setDeleteConfirm(device.id)}
                    className="h-9 w-9 p-0 text-text-muted hover:text-error-strong hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Tambah Device">
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            Beri nama yang mudah dikenali untuk nomor ini. Anda akan diminta scan QR di langkah berikutnya.
          </p>
          <Input
            label="Nama Device"
            placeholder="Contoh: Toko Online"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setAddModal(false)}>
              Batal
            </Button>
            <Button onClick={handleAddDevice} loading={creating} disabled={!deviceName.trim()}>
              Buat & Hubungkan
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Connect Modal — tabbing QR / Kode */}
      <Modal open={qrModal} onClose={handleCloseQrModal} title="Hubungkan WhatsApp">
        <div className="space-y-4">
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Metode koneksi"
            className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-subtle p-1"
          >
            <button
              role="tab"
              aria-selected={activeTab === "qr"}
              aria-controls="panel-qr"
              id="tab-qr"
              onClick={() => setActiveTab("qr")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "qr"
                  ? "bg-surface text-text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "code"}
              aria-controls="panel-code"
              id="tab-code"
              onClick={() => setActiveTab("code")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "code"
                  ? "bg-surface text-text-primary shadow-sm border border-border"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Kode Pairing
            </button>
          </div>

          {activeTab === "qr" ? (
            <div id="panel-qr" role="tabpanel" aria-labelledby="tab-qr" className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-relaxed text-text-secondary">
                Buka <span className="font-medium text-text-primary">WhatsApp → Perangkat Tertaut → Tautkan perangkat</span>, lalu scan QR di bawah. QR berlaku ~30 detik.
              </div>
              <div className="flex justify-center">
                {qrLoading ? (
                  <Skeleton className="h-64 w-64 rounded-xl" />
                ) : qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR Code WhatsApp"
                    className="h-64 w-64 rounded-xl border border-border bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-subtle p-6 text-center text-sm text-text-muted">
                    <QrCode className="h-8 w-8 opacity-50" />
                    QR tidak tersedia. Coba muat ulang.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
                <span
                  className={`h-2 w-2 rounded-full ${selectedDevice?.state === "connecting" ? "animate-pulse bg-warning" : "bg-border"}`}
                  aria-hidden
                />
                {selectedDevice?.state === "connecting" ? "Menunggu scan..." : "Menyiapkan QR..."}
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="secondary" onClick={handleCloseQrModal}>
                  Tutup
                </Button>
                <Button
                  variant="secondary"
                  loading={qrLoading}
                  onClick={() => selectedDevice && fetchQr(selectedDevice.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang
                </Button>
              </div>
            </div>
          ) : (
            <div id="panel-code" role="tabpanel" aria-labelledby="tab-code" className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-subtle px-3 py-2.5 text-sm leading-relaxed text-text-secondary">
                Masukkan nomor HP WhatsApp kamu (contoh <span className="font-mono font-medium text-text-primary">628123456789</span>). Dapatkan kode 8 karakter, lalu di HP buka <span className="font-medium text-text-primary">WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon</span> dan masukkan kode tersebut.
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Nomor HP"
                      placeholder="62812xxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                    <p className="mt-1 text-xs text-text-muted">Format internasional tanpa + , contoh 628123456789</p>
                  </div>
                </div>

                <Button
                  onClick={() => selectedDevice && fetchPairCode(selectedDevice.id, phone)}
                  disabled={!phone.trim() || !selectedDevice}
                  loading={pairCodeLoading}
                  className="w-full"
                >
                  <Phone className="h-4 w-4" />
                  Dapatkan Kode
                </Button>

                {pairCode ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Kode Pairing</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="font-mono text-3xl font-bold tracking-[0.2em] text-text-primary select-all">{pairCode}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(pairCode);
                          setCopied(true);
                          toast.success("Kode disalin");
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-text-muted hover:text-text-primary"
                        aria-label="Salin kode"
                      >
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                      Masukkan kode ini di HP dalam 30-60 detik. Jika expired, klik Dapatkan Kode lagi.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-text-muted">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-warning" aria-hidden />
                      Menunggu konfirmasi di HP...
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-subtle p-6 text-center text-sm text-text-muted">
                    <KeyRound className="h-8 w-8 opacity-50" />
                    Belum ada kode. Masukkan nomor HP lalu klik Dapatkan Kode.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="secondary" onClick={handleCloseQrModal}>
                  Tutup
                </Button>
                {pairCode && (
                  <Button
                    variant="secondary"
                    onClick={() => selectedDevice && fetchPairCode(selectedDevice.id, phone)}
                    loading={pairCodeLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Kode Baru
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => !deleting && setDeleteConfirm(null)} title="Hapus Device">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            Device akan dihapus permanen dari bot dan database. Sesi WhatsApp akan terputus dan tidak dapat dibatalkan.
          </p>
          <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2.5 text-xs leading-relaxed text-error-strong">
            Tindakan ini tidak dapat diurungkan. Pastikan device tidak sedang melayani pelanggan aktif.
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={deleting}
              onClick={() => deleteConfirm && handleDeleteDevice(deleteConfirm)}
            >
              Hapus permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
