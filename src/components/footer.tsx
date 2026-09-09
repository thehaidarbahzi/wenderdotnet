import Link from "next/link";
import { WMark } from "@/components/logo";

const FOOTER_LINKS = [
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-pakai", label: "Cara pakai" },
  { href: "/#newsletter", label: "Berlangganan update" },
  { href: "/auth", label: "Masuk" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat Layanan" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-start sm:gap-16">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <WMark className="h-5 w-5 text-[#34D399]" />
              <span className="text-base font-semibold tracking-tight text-text-primary">
                wenderdotnet
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Dashboard untuk mengatur dan mengonfigurasi bot WhatsApp:
              multi-device, auto-reply, dan log aktivitas.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-sm font-medium text-text-primary">Navigasi</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-muted transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <p className="text-sm font-medium text-text-primary">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-muted transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} wenderdotnet</p>
          <p>Tidak berafiliasi dengan WhatsApp atau Meta.</p>
        </div>
      </div>
    </footer>
  );
}
