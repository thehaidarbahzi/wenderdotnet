import { QrCode, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WMark } from "@/components/logo";

export function HeroPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-3xl overflow-visible sm:mt-16">
      <div
        aria-hidden
        className="absolute -inset-x-8 -top-10 bottom-0 rounded-sm bg-primary/15 blur-3xl dark:bg-primary/20"
      />
      <div className="relative overflow-hidden rounded-sm border border-border bg-surface shadow-lg">
        {}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <WMark className="h-[18px] w-[18px] text-primary" />
          <span className="text-sm font-semibold text-text-primary">wenderdotnet</span>
          <span className="ml-2 hidden text-xs text-text-muted sm:inline">Devices</span>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {}
          <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-surface-subtle/60 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">Toko Online</p>
              <p className="mt-0.5 truncate font-mono text-xs text-text-muted">62812•••••••@s.whatsapp.net</p>
            </div>
            <Badge variant="success">Connected</Badge>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-surface-subtle/60 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">CS Admin</p>
              <p className="mt-0.5 truncate text-xs text-text-muted">Menunggu scan QR</p>
            </div>
            <Badge variant="warning">
              <span className="animate-pulse" aria-hidden>
                ●
              </span>
              Connecting
            </Badge>
          </div>

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            {}
            <div className="rounded-sm border border-border bg-surface-subtle/60 p-3.5">
              <p className="text-xs font-medium text-text-secondary">Rules aktif</p>
              <ul className="mt-2 space-y-1.5 text-xs text-text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-info" aria-hidden />
                  Auto-read grup promo
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-success" aria-hidden />
                  Balas &ldquo;ready&rdquo; ke pelanggan
                </li>
              </ul>
            </div>
            {}
            <div className="rounded-sm border border-border bg-surface-subtle/60 p-3.5">
              <p className="text-xs font-medium text-text-secondary">Aktivitas terbaru</p>
              <ul className="mt-2 space-y-1.5 text-xs text-text-muted">
                <li>Auto reply terkirim ke Grup Promo</li>
                <li>Pesan diterima dari Pelanggan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-sm border border-border bg-surface p-3 shadow-md sm:flex lg:-left-12">
        <span className="grid h-11 w-11 place-items-center rounded-sm border border-dashed border-border bg-surface-subtle text-text-secondary">
          <QrCode className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium text-text-primary">Scan QR</p>
          <p className="text-xs text-text-muted">Connect dalam hitungan detik</p>
        </div>
      </div>

      <div className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary shadow-md sm:flex lg:-right-8">
        <Plus className="h-3.5 w-3.5 text-primary" aria-hidden />
        Tambah device
      </div>
    </div>
  );
}
