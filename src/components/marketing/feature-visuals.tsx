import { QrCode, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DeviceStackVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden py-6">
      {}
      <div className="absolute left-0 top-0 w-44 rotate-[-4deg] rounded-sm border border-border bg-surface p-4 shadow-md">
        <div className="grid h-28 place-items-center rounded-sm border border-dashed border-border bg-surface-subtle">
          <QrCode className="h-12 w-12 text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="mt-3 text-center text-xs font-medium text-text-secondary">
          Scan untuk connect
        </p>
      </div>

      {}
      <div className="relative ml-auto w-64 translate-y-10 rounded-sm border border-border bg-surface p-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary-subtle text-primary">
            <Smartphone className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">Toko Online</p>
            <p className="text-xs text-text-muted">Device utama</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-text-muted">Status</span>
          <Badge variant="success">Connected</Badge>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-text-muted">Rules aktif</span>
          <span className="font-mono text-xs text-text-secondary">2</span>
        </div>
      </div>
    </div>
  );
}

export function AutoReplyVisual() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-3 rounded-sm border border-border bg-surface p-5 shadow-md">
      <div className="flex items-start">
        <div className="max-w-[85%] rounded-sm rounded-bl-sm bg-surface-subtle px-3.5 py-2.5">
          <p className="text-sm text-text-primary">
            Pagi, stok ukuran L{" "}
            <mark className="rounded bg-warning/15 px-1 text-warning-strong">
              masih ready?
            </mark>
          </p>
          <p className="mt-1 text-xs text-text-muted">Pelanggan · 23:41</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Badge variant="success" className="mr-1">
          Auto reply
        </Badge>
      </div>

      <div className="flex items-end justify-end">
        <div className="max-w-[85%] rounded-sm rounded-br-sm bg-primary px-3.5 py-2.5">
          <p className="text-sm text-white dark:text-text-primary">
            Selamat pagi! Stok ukuran L tersedia. Bisa langsung order ya.
          </p>
          <p className="mt-1 text-right text-xs text-white/75 dark:text-text-secondary">
            Dikirim otomatis
          </p>
        </div>
      </div>
    </div>
  );
}

const LOG_ROWS = [
  {
    label: "Pesan diterima",
    desc: "Grup Promo · \u201Cbisa COD gan?\u201D",
    variant: "info" as const,
  },
  {
    label: "Auto reply",
    desc: "Balasan terkirim ke Grup Promo",
    variant: "success" as const,
  },
  {
    label: "Auto read",
    desc: "Grup Komunitas ditandai dibaca",
    variant: "warning" as const,
  },
];

export function LogsVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm space-y-3 pl-5">
      <div aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
      {LOG_ROWS.map((row) => (
        <div key={row.label} className="relative">
          <span
            aria-hidden
            className="absolute -left-5 top-4 block h-2.5 w-2.5 rounded-full border-2 border-border bg-surface"
          />
          <div className="rounded-sm border border-border bg-surface p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={row.variant}>{row.label}</Badge>
              <span className="font-mono text-xs text-text-muted">
                {row.variant === "info" ? "23:41" : row.variant === "success" ? "23:41" : "23:42"}
              </span>
            </div>
            <p className="mt-2 truncate text-sm text-text-secondary">{row.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
