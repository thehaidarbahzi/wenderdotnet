"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { WMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const NAV_LINKS = [
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-pakai", label: "Cara pakai" },
] as const;

const linkClass =
  "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <WMark className="h-5 w-5 text-[#34D399]" />
            <span className="text-base font-semibold tracking-tight text-text-primary">
              wenderdotnet
            </span>
          </Link>
        </div>

        {}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
          <Link href="/auth" className="hidden sm:inline-flex">
            <Button size="sm">Masuk</Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="-mr-2 grid h-10 w-10 place-items-center rounded-sm text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary sm:hidden"
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-sm px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/auth" onClick={close} className="mt-2">
              <Button className="w-full">Masuk</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
