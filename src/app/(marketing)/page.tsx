import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DeviceStackVisual,
  AutoReplyVisual,
  LogsVisual,
} from "@/components/marketing/feature-visuals";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

const STEPS = [
  {
    title: "Masuk dan tambah device",
    desc: "Beri nama nomor WhatsApp Anda, misalnya \u201CToko Online\u201D.",
  },
  {
    title: "Scan QR dari aplikasi WhatsApp",
    desc: "Sama seperti WhatsApp Web. Device langsung terhubung.",
  },
  {
    title: "Buat aturan, biarkan berjalan",
    desc: "Tentukan chat mana yang didengarkan dan balasan otomatisnya.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Kelola bot WhatsApp Anda dari satu dashboard
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-text-secondary">
              Hubungkan beberapa nomor, atur auto-reply, dan pantau semua
              aktivitas. Cukup scan QR, tanpa instalasi teknis.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Buat akun gratis
                </Button>
              </Link>
              <Link href="#cara-pakai" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Lihat cara pakai
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Gratis selama masa MVP. Tanpa kartu kredit.
            </p>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* How it works: the actual onboarding flow from the product spec */}
      <section id="cara-pakai" className="border-t border-border bg-surface-subtle/50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Jalan dalam tiga langkah
            </h2>
            <p className="mt-3 text-text-secondary">
              Tidak ada CLI, server, atau sesi terminal yang perlu Anda sentuh.
            </p>
          </div>
          <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-l-2 border-primary/30 pl-4">
                <span className="font-mono text-xs text-primary">0{i + 1}</span>
                <h3 className="mt-1.5 font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features: alternating visual/text sections (approved structure) */}
      <section id="fitur" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionFeature
            title="Semua nomor di satu tempat"
            description="
              Tambah device sebanyak yang Anda butuhkan, connect lewat QR,
              dan pantau statusnya langsung dari daftar. Nomor bermasalah?
              Disconnect dan sambungkan ulang tanpa konfigurasi ulang."
            ctaLabel="Hubungkan nomor pertama"
            visual={<DeviceStackVisual />}
          />
          <SectionFeature
            reversed
            title="Auto-reply yang bisa dikontrol"
            description="
              Buat aturan berbasis keyword atau regex, arahkan ke grup atau
              chat pribadi tertentu. Balasan terkirim otomatis saat Anda
              tidak bisa memegang ponsel."
            ctaLabel="Coba aturan auto-reply"
            visual={<AutoReplyVisual />}
          />
          <SectionFeature
            title="Setiap aktivitas tercatat"
            description="
              Pesan masuk, balasan otomatis, auto-read, sampai error koneksi:
              semuanya ada di timeline log, bisa difilter per device dan
              jenis event."
            ctaLabel="Lihat contoh lognya"
            visual={<LogsVisual />}
          />
        </div>
      </section>

      {/* Creator statement */}
      <section id="tentang" className="border-t border-border bg-surface-subtle/50">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <figure className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <span
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-subtle text-base font-semibold text-primary"
            >
              W
            </span>
            <div>
              <blockquote className="text-pretty text-lg leading-relaxed text-text-secondary">
                &ldquo;wenderdotnet dibuat untuk pelaku UMKM yang butuh otomasi
                WhatsApp tanpa harus memahami teknis server. Setup simpel,
                kontrol penuh, dan bisa di-host sendiri.&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-medium text-text-primary">Tim wenderdotnet</span>
                <span className="text-text-muted"> · pembuat proyek</span>
              </figcaption>
            </div>
          </figure>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="border-t border-border">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Dapat kabar fitur baru lebih dulu
          </h2>
          <p className="mx-auto mt-3 max-w-md text-text-secondary">
            Satu email sesekali: update produk dan tips mengatur bot WhatsApp.
            Berhenti kapan saja.
          </p>
          <div className="mt-8">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}

function SectionFeature({
  title,
  description,
  ctaLabel,
  visual,
  reversed = false,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  visual: React.ReactNode;
  reversed?: boolean;
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className={reversed ? "order-1 lg:order-2" : "order-2 lg:order-1"}>{visual}</div>
      <div className={reversed ? "order-2 lg:order-1" : "order-1 lg:order-2"}>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 leading-relaxed text-text-secondary">{description}</p>
        <Link
          href="/auth"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {ctaLabel}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
