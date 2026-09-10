"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { subscribeNewsletter } from "@/server/actions/newsletter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    startTransition(async () => {
      try {
        await subscribeNewsletter(email);
        setSubscribed(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal berlangganan. Coba lagi.");
      }
    });
  }

  if (subscribed) {
    return (
      <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-[var(--radius-md)] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-strong">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        Terdaftar! Update berikutnya dikirim ke email Anda.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">
        Alamat email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="email@anda.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={cn(
            "h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            error && "border-error focus:border-error focus:ring-error/40"
          )}
        />
        <Button type="submit" disabled={isPending} loading={isPending} className="shrink-0">
          Berlangganan
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-left text-sm text-error-strong">
          {error}
        </p>
      )}
    </form>
  );
}
