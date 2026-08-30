"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, RefreshCw, QrCode, Plug, Unplug, Smartphone, Signal, WifiOff } from "lucide-react";
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

  // Poll status of connecting devices
  useEffect(() => {
    const connecting = devices.filter((d) => d.state === "connecting");
    if (connecting.length === 0) return;

    const interval = setInterval(async () => {
      for (const d of connecting) {
        try {
          const res = await fetch(`/api/devices/${d.id}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.is_logged_in) {
              toast.success(`${d.display_name} connected!`);
              setQrModal(false);
              fetchDevices();
            }
          }
        } catch {
          // silent
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [devices, fetchDevices]);

  async function handleAddDevice() {
    if (!deviceName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deviceName.trim() }),
      });

      if (!res.ok) throw new Error("Gagal membuat device");

      const data = await res.json();
      setAddModal(false);
      setDeviceName("");

      // Open QR modal
      setSelectedDevice({ ...data.device, state: "connecting", is_connected: false, is_logged_in: false });
      setQrModal(true);
      setQrLoading(true);

      // Get QR
      const qrRes = await fetch(`/api/devices/${data.device.id}/login`);
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrUrl(qrData.qr_link);
      }
      setQrLoading(false);
      fetchDevices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah device");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    try {
      const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus device");
      toast.success("Device dihapus");
      fetchDevices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus device");
    }
    setDeleteConfirm(null);
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

      {/* Stats — same card language as landing “Cara kerja” */}
      {!loading && devices.length > 0 && (
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

      {/* Content */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex gap-3.5">
                <Skeleton className="hidden h-11 w-11 shrink-0 rounded-lg sm:block" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-1">
          <EmptyState
            title="Belum ada device"
            description="Tambahkan device WhatsApp pertama Anda. Sama seperti WhatsApp Web — beri nama, scan QR, dan device langsung terhubung. Tidak perlu setting server."
            icon={<QrCode className="h-5 w-5" />}
            action={
              <Button onClick={() => setAddModal(true)}>
                <Plus className="h-4 w-4" />
                Tambah Device
              </Button>
            }
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
                setLoading(true);
                fetchDevices();
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
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
                      <h3 className="truncate text-[15px] font-semibold text-text-primary">{device.display_name}</h3>
                      {getStateBadge(device.state)}
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-text-muted">{device.id}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{getStateHint(device.state)}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-stretch border-t border-border pt-3 sm:border-0 sm:pt-0">
                  {device.state !== "logged_in" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Hubungkan ${device.display_name}`}
                      onClick={async () => {
                        setSelectedDevice(device);
                        setQrModal(true);
                        setQrLoading(true);
                        try {
                          const res = await fetch(`/api/devices/${device.id}/login`);
                          if (res.ok) {
                            const data = await res.json();
                            setQrUrl(data.qr_link);
                          }
                        } catch {}
                        setQrLoading(false);
                      }}
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
                      onClick={async () => {
                        try {
                          await fetch(`/api/devices/${device.id}/logout`, { method: "POST" });
                          toast.success("Device disconnected");
                          fetchDevices();
                        } catch {}
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

      {/* QR Connect Modal */}
      <Modal open={qrModal} onClose={() => setQrModal(false)} title="Hubungkan WhatsApp">
        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-relaxed text-text-secondary">
            Buka <span className="font-medium text-text-primary">WhatsApp → Perangkat Tertaut → Tautkan perangkat</span>, lalu scan QR di bawah. QR berlaku ~20 detik.
          </div>
          <div className="flex justify-center">
            {qrLoading ? (
              <Skeleton className="h-64 w-64 rounded-xl" />
            ) : qrUrl ? (
              // QR is a short-lived authenticated proxy URL; next/image adds no value here
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
            <Button
              variant="secondary"
              onClick={() => {
                setQrModal(false);
                fetchDevices();
              }}
            >
              Tutup
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!selectedDevice) return;
                setQrLoading(true);
                try {
                  const res = await fetch(`/api/devices/${selectedDevice.id}/login`);
                  if (res.ok) {
                    const data = await res.json();
                    setQrUrl(data.qr_link);
                  }
                } catch {}
                setQrLoading(false);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Muat Ulang
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Device">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            Device akan dihapus permanen dari bot dan database. Sesi WhatsApp akan terputus dan tidak dapat dibatalkan.
          </p>
          <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2.5 text-xs leading-relaxed text-error-strong">
            Tindakan ini tidak dapat diurungkan. Pastikan device tidak sedang melayani pelanggan aktif.
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDeleteDevice(deleteConfirm)}>
              Hapus permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
