"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { WMark } from "@/components/logo";

const navLinks = [
  { href: "/devices", label: "Devices" },
  { href: "/logs", label: "Logs" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const close = () => setOpen(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    close();
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth");
      router.refresh();
    } finally {
      setTimeout(() => setLoggingOut(false), 2000);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        {}
        <div className="flex flex-1 items-center">
          <Link href="/" onClick={close} className="flex items-center gap-2">
            <WMark className="h-5 w-5 text-[#34D399]" />
            <span className="text-base font-semibold tracking-tight text-text-primary">
              wenderdotnet
            </span>
          </Link>
        </div>

        {}
        <nav aria-label="Utama" className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary-subtle text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {}
        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <ThemeToggle />

          {}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Keluar dari akun"
            aria-busy={loggingOut}
            title="Keluar"
            className="hidden h-9 w-9 place-items-center rounded-sm text-text-muted transition-colors hover:bg-error/10 hover:text-error-strong disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 sm:grid cursor-pointer hover:cursor-pointer active:cursor-pointer active:scale-95"
          >
            {loggingOut ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="-mr-2 grid h-10 w-10 place-items-center rounded-sm text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary sm:hidden cursor-pointer hover:cursor-pointer active:cursor-pointer active:scale-95"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {}
      {open && (
        <div className="border-t border-border bg-surface sm:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary-subtle text-primary"
                    : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-busy={loggingOut}
                className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-error/10 hover:text-error-strong disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 cursor-pointer hover:cursor-pointer active:cursor-pointer active:scale-[0.98]"
              >
                {loggingOut ? (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {loggingOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
