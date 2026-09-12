import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { ScrollReveal } from "@/components/scroll-reveal";

const STEPS = [
  {
    title: "Masuk dan tambah device",
    desc: "Beri nama nomor WhatsApp Anda, misalnya \u201CToko Online\u201D.",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    title: "Scan QR dari aplikasi WhatsApp",
    desc: "Sama seperti WhatsApp Web. Device langsung terhubung.",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
        />
      </svg>
    ),
  },
  {
    title: "Buat aturan, biarkan berjalan",
    desc: "Tentukan chat mana yang didengarkan dan balasan otomatisnya.",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-32 top-1/2 h-64 w-64 rounded-full bg-whatsapp/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal delay={100}>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                Kelola bot WhatsApp Anda dari{" "}
                <span className="relative">
                  <span className="relative z-10 text-primary">
                    satu dashboard
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-primary/20 z-0" />
                </span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-text-secondary">
                Hubungkan beberapa nomor, atur auto-reply, dan pantau semua
                aktivitas. Cukup scan QR, tanpa instalasi teknis.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Buat akun gratis
                  </Button>
                </Link>
                <Link href="#cara-pakai" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Lihat cara pakai
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal animation="scale" delay={400}>
            <HeroPreview />
          </ScrollReveal>
        </div>
      </section>

      <section
        id="cara-pakai"
        className="relative border-t border-border bg-surface-subtle/50"
      >
        <div
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--primary) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:px-8">
          <ScrollReveal>
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Jalan dalam tiga langkah
              </h2>
              <p className="mt-3 text-text-secondary">
                Tidak ada CLI, server, atau sesi terminal yang perlu Anda
                sentuh.
              </p>
            </div>
          </ScrollReveal>
          <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 100}>
                <li className="group relative rounded-sm border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs text-primary">
                    0{i + 1}
                  </span>
                  <h3 className="mt-1.5 font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {step.desc}
                  </p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="fitur" className="border-t border-border">
        <div className="mx-auto max-w-6xl flex flex-col gap-20 px-4 py-20 sm:gap-28 sm:py-28 lg:px-8">
          <ScrollReveal>
            <SectionFeature
              title="Semua nomor di satu tempat"
              description="
                Tambah device sebanyak yang Anda butuhkan, connect lewat QR,
                dan pantau statusnya langsung dari daftar. Nomor bermasalah?
                Disconnect dan sambungkan ulang tanpa konfigurasi ulang."
              ctaLabel="Hubungkan nomor pertama"
              visual={
                <div className="relative flex w-full items-center justify-center isolate">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-primary/10 blur-2xl"
                  />
                  <Image
                    src="/illustrations/device-stack.svg"
                    alt="Device management dashboard"
                    width={300}
                    height={300}
                    className="relative block h-auto w-full max-w-75 mx-auto rounded-sm shadow-lg"
                  />
                </div>
              }
            />
          </ScrollReveal>
          <ScrollReveal>
            <SectionFeature
              reversed
              title="Auto-reply yang bisa dikontrol"
              description="
                Buat aturan berbasis keyword atau regex, arahkan ke grup atau
                chat pribadi tertentu. Balasan terkirim otomatis saat Anda
                tidak bisa memegang ponsel."
              ctaLabel="Coba aturan auto-reply"
              visual={
                <div className="relative flex w-full items-center justify-center isolate">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-whatsapp/10 blur-2xl"
                  />
                  <Image
                    src="/illustrations/auto-reply.svg"
                    alt="Auto-reply chat flow"
                    width={300}
                    height={200}
                    className="relative block h-auto w-full max-w-[320px] mx-auto rounded-sm shadow-lg"
                  />
                </div>
              }
            />
          </ScrollReveal>
          <ScrollReveal>
            <SectionFeature
              title="Setiap aktivitas tercatat"
              description="
                Pesan masuk, balasan otomatis, auto-read, sampai error koneksi:
                semuanya ada di timeline log, bisa difilter per device dan
                jenis event."
              ctaLabel="Lihat contoh lognya"
              visual={
                <div className="relative flex w-full items-center justify-center isolate">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-info/10 blur-2xl"
                  />
                  <Image
                    src="/illustrations/logs-timeline.svg"
                    alt="Activity log timeline"
                    width={300}
                    height={250}
                    className="relative block h-auto w-full max-w-[320px] mx-auto rounded-sm shadow-lg"
                  />
                </div>
              }
            />
          </ScrollReveal>
        </div>
      </section>

      <section
        id="tentang"
        className="relative border-t border-border bg-surface-subtle/50"
      >
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src="/illustrations/dot-pattern.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-20 lg:px-8">
          <ScrollReveal>
            <figure className="mx-auto max-w-2xl text-center">
              <blockquote className="text-pretty text-lg leading-relaxed text-text-secondary">
                &ldquo;wenderdotnet dibuat untuk pelaku UMKM yang butuh otomasi
                WhatsApp tanpa harus memahami teknis server. Setup simpel,
                kontrol penuh, dan bisa di-host sendiri.&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-base">
                <span className="font-medium text-text-primary">
                  Tim wenderdotnet
                </span>
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>
      </section>

      <section
        id="newsletter"
        className="relative border-t border-border overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-whatsapp/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl px-4 py-16 text-center sm:py-20 lg:px-8">
          <ScrollReveal>
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
          </ScrollReveal>
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
    <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
      <div
        className={`flex w-full items-center justify-center order-1 ${reversed ? "lg:order-2" : "lg:order-1"}`}
      >
        <div className="flex w-full max-w-90 items-center justify-center">
          {visual}
        </div>
      </div>
      <div
        className={`order-2 flex flex-col items-center text-center lg:items-start lg:text-left ${reversed ? "lg:order-1" : "lg:order-2"}`}
      >
        <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 leading-relaxed text-text-secondary">
          {description}
        </p>
        <Link
          href="/auth"
          className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
