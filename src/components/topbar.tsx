"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/logo";

const navLinks = [
  { href: "/devices", label: "Devices" },
  { href: "/rules", label: "Rules" },
  { href: "/logs", label: "Logs" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Wordmark href="/devices" />
          <nav aria-label="Utama" className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary-subtle text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Keluar dari akun"
            title="Keluar"
            className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-error/10 hover:text-error-strong"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav row: the three app sections stay reachable on small screens */}
      <nav
        aria-label="Navigasi perangkat"
        className="flex gap-1 border-t border-border px-3 pb-2 pt-1.5 sm:hidden"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary-subtle text-primary"
                : "text-text-secondary"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
