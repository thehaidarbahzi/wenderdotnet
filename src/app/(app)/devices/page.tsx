"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, QrCode, Plug, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Devices</h1>
          <p className="mt-1 text-sm text-text-muted">
            Kelola device WhatsApp Anda
          </p>
        </div>
        <Button onClick={() => setAddModal(true)}>
          <Plus className="h-4 w-4" />
          Tambah Device
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="mt-3 h-4 w-48" />
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          title="Belum ada device"
          description="Tambahkan device WhatsApp untuk mulai mengotomatiskan chat."
          icon={<QrCode className="h-5 w-5" />}
          action={
            <Button onClick={() => setAddModal(true)}>
              <Plus className="h-4 w-4" />
              Tambah Device
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                {getStateBadge(device.state)}
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    {device.display_name}
                  </p>
                  <p className="truncate text-xs text-text-muted font-mono">
                    {device.id}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {device.state !== "logged_in" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Hubungkan ${device.display_name}`}
                    title="Connect via QR"
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
                  >
                    <Plug className="h-3.5 w-3.5" />
                  </Button>
                )}
                {device.state === "logged_in" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Putuskan ${device.display_name}`}
                    title="Disconnect"
                    onClick={async () => {
                      try {
                        await fetch(`/api/devices/${device.id}/logout`, { method: "POST" });
                        toast.success("Device disconnected");
                        fetchDevices();
                      } catch {}
                    }}
                  >
                    <Unplug className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Hapus ${device.display_name}`}
                  title="Hapus device"
                  onClick={() => setDeleteConfirm(device.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-error-strong" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Tambah Device">
        <div className="space-y-4">
          <Input
            label="Nama Device"
            placeholder="Contoh: Toko Online"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddModal(false)}>
              Batal
            </Button>
            <Button onClick={handleAddDevice} loading={creating}>
              Buat
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Connect Modal */}
      <Modal open={qrModal} onClose={() => setQrModal(false)} title="Hubungkan WhatsApp">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Scan QR code ini menggunakan WhatsApp di HP Anda.
          </p>
          <div className="flex justify-center">
            {qrLoading ? (
              <Skeleton className="h-64 w-64" />
            ) : qrUrl ? (
              // QR is a short-lived authenticated proxy URL; next/image adds no value here
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR Code"
                className="h-64 w-64 rounded-[var(--radius-md)] border border-border"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border bg-surface-subtle text-sm text-text-muted">
                QR tidak tersedia
              </div>
            )}
          </div>
          <p className="text-xs text-text-muted text-center">
            {selectedDevice?.state === "connecting"
              ? "Menunggu scan..."
              : "Menunggu QR code..."}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQrModal(false);
                fetchDevices();
              }}
            >
              Batal
            </Button>
            <Button
              variant="ghost"
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
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Device"
      >
        <p className="text-sm text-text-secondary mb-4">
          Device akan dihapus permanen dari bot dan database. Tindakan ini tidak
          dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDeleteDevice(deleteConfirm)}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
}
