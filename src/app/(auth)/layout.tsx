import { Check } from "lucide-react";
import { WMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const CAPABILITIES = [
  "Connect via QR, sama seperti WhatsApp Web",
  "Auto-reply berbasis keyword dan regex",
  "Log aktivitas lengkap untuk tiap device",
];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/devices");
  }

  return (
    <div className="flex min-h-screen">
      {}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-hover via-primary to-emerald-900"
        />
        {}
        <div aria-hidden className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-white/15 text-white">
            <WMark />
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            wenderdotnet
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Satu dashboard untuk semua nomor WhatsApp Anda.
          </h1>
          <ul className="mt-8 space-y-3.5">
            {CAPABILITIES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/70">
          Gratis selama masa MVP. Data Anda terpisah per akun (row-level security).
        </p>
      </div>

      {}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
