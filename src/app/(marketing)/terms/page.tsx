import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Shield,
  Zap,
  Users,
  AlertTriangle,
  Mail,
  Scale,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat Layanan: wenderdotnet",
  description:
    "Syarat Layanan wenderdotnet: aturan penggunaan dashboard bot WhatsApp.",
};

const updated = "8 September 2026";

const toc = [
  { id: "desc", label: "01. Deskripsi layanan" },
  { id: "account", label: "02. Akun" },
  { id: "wa", label: "03. Kepatuhan WhatsApp" },
  { id: "use", label: "04. Penggunaan wajar" },
  { id: "auto", label: "05. Automasi dan grup" },
  { id: "free", label: "06. Paket dan biaya" },
  { id: "ip", label: "07. Kekayaan intelektual" },
  { id: "disclaimer", label: "08. Penafian dan batasan" },
  { id: "contact", label: "09. Kontak" },
];

export default function TermsPage() {
  return (
    <div className="bg-background">
      <div className="border-b border-border bg-surface-subtle/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl sm:leading-[1.05]">
              Syarat Layanan
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-text-secondary">
              Aturan yang menjaga layanan tetap adil, aman, dan dapat dipakai
              bersama tanpa mengganggu pengguna lain.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm">
              <span className="inline-flex items-center gap-2 text-text-muted">
                <Clock className="h-4 w-4" />
                Diperbarui {updated}
              </span>
              <span
                className="hidden h-4 w-px bg-border sm:block"
                aria-hidden
              />
              <span className="text-text-muted">
                Waktu baca sekitar 5 menit
              </span>
              <span className="h-4 w-px bg-border" aria-hidden />
              <Link
                href="/privacy"
                className="font-medium text-primary hover:text-primary-hover hover:underline"
              >
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[270px_1fr] lg:gap-14 xl:gap-16">
          <nav aria-label="Daftar isi" className="hidden lg:block">
            <div className="sticky top-28 rounded-sm border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                Daftar isi
              </p>
              <ul className="mt-4 space-y-1">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block truncate whitespace-nowrap rounded-sm px-3 py-2 text-sm leading-none text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
                      title={item.label}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0">
            <div className="rounded-sm border border-border bg-surface p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Shield className="h-4 w-4 text-primary" /> Dengan memakai
                wenderdotnet
              </p>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Saat membuat akun atau masuk, Anda dianggap telah membaca dan
                menyetujui Syarat ini serta{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary hover:underline"
                >
                  Kebijakan Privasi
                </Link>
                . Jika tidak setuju, mohon tidak melanjutkan.
              </p>
            </div>

            <section
              id="desc"
              className="scroll-mt-28 border-t border-border pt-10 mt-10 first:border-0 first:pt-0"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  01
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Deskripsi layanan
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  wenderdotnet adalah dashboard untuk mengelola beberapa nomor
                  WhatsApp dalam satu tempat. Anda menautkan device lewat QR
                  atau kode pairing, membuat automasi balasan per device, dan
                  memantau aktivitas lewat log. Bot berjalan di container
                  terpisah dan terhubung ke dashboard lewat API yang aman.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      icon: Zap,
                      title: "Penautan mudah",
                      desc: "QR atau kode pairing seperti WhatsApp Web",
                    },
                    {
                      icon: Users,
                      title: "Kontrol per grup",
                      desc: "Satu automasi untuk satu grup",
                    },
                    {
                      icon: Shield,
                      title: "Transparan",
                      desc: "Semua aktivitas tercatat di log",
                    },
                  ].map((c) => (
                    <div
                      key={c.title}
                      className="rounded-sm border border-border bg-surface p-6 text-center shadow-sm"
                    >
                      <span className="mx-auto grid h-10 w-10 place-items-center rounded-sm bg-primary/10 text-primary">
                        <c.icon className="h-5 w-5" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-text-primary">
                        {c.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        {c.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              id="account"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  02
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Akun
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Satu akun untuk satu individu atau entitas. Jaga kerahasiaan
                    kata sandi dan akses Google OAuth Anda.
                  </li>
                  <li>
                    Untuk 17 tahun ke atas, atau dengan izin orang tua atau
                    wali.
                  </li>
                  <li>
                    Kami dapat menangguhkan akun jika ada upaya mengakali
                    keamanan atau mengakses device milik pengguna lain.
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="wa"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  03
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Kepatuhan terhadap WhatsApp
                </h2>
              </div>
              <div className="mt-6 rounded-sm border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <Shield className="h-4 w-4" /> Tidak terafiliasi dengan
                  WhatsApp atau Meta
                </p>
                <p className="mt-2.5 text-sm leading-7 text-amber-700 dark:text-amber-200/80">
                  Penggunaan WhatsApp tunduk pada{" "}
                  <a
                    href="https://www.whatsapp.com/legal/business-terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline decoration-amber-300 underline-offset-4 hover:text-amber-900 dark:hover:text-amber-100"
                  >
                    Business Terms WhatsApp
                  </a>
                  . Pelanggaran seperti spam dapat membuat nomor dibatasi atau
                  diblokir. Risiko tersebut menjadi tanggung jawab Anda.
                </p>
              </div>
            </section>

            <section
              id="use"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  04
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Penggunaan wajar
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>Untuk kenyamanan bersama, hindari hal berikut.</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Mengirim spam, phishing, atau konten menyesatkan.</li>
                  <li>
                    Scraping atau percobaan akses tanpa izin, termasuk menebak
                    kredensial layanan bot.
                  </li>
                  <li>
                    Memakai mention{" "}
                    <code className="rounded-sm border border-border bg-surface-subtle px-1.5 py-0.5 font-mono text-[13px] text-text-primary">
                      @everyone
                    </code>{" "}
                    di grup di mana Anda bukan admin atau anggota tidak
                    mengharapkan mention massal.
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="auto"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  05
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Automasi dan grup
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Daftar grup diambil langsung dari WhatsApp lewat device yang
                  terhubung, dengan pembaruan berkala dan pencarian di
                  dashboard. Satu automasi untuk satu grup. Jika aturan yang
                  sama perlu untuk beberapa grup, duplikasi pengaturannya.
                  Status koneksi diperbarui otomatis, dan dialog QR tertutup
                  sendiri setelah device terhubung.
                </p>
              </div>
            </section>

            <section
              id="free"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  06
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Paket dan biaya
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Saat ini gratis sebagai versi awal. Jika ada paket berbayar
                  atau pembatasan baru, kami umumkan setidaknya 14 hari
                  sebelumnya.
                </p>
              </div>
            </section>

            <section
              id="ip"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  07
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Kekayaan intelektual
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Konten dan pesan yang Anda kirim tetap milik Anda. Kode
                  dashboard milik kami, komponen GOWA milik pengembang asalnya.
                </p>
              </div>
            </section>

            <section
              id="disclaimer"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  08
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Penafian dan batasan
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Layanan disediakan apa adanya. Kami tidak menjamin terbebas
                  dari pemblokiran WhatsApp, ketersediaan 100 persen, atau QR
                  yang selalu aktif penuh 30 detik. Perilaku aktual mengikuti
                  kebijakan WhatsApp dan kondisi jaringan.
                </p>
                <p>
                  Tanggung jawab kami terbatas pada total biaya yang Anda
                  bayarkan dalam tiga bulan terakhir. Karena saat ini gratis,
                  batasnya nol. Harap gunakan dengan pertimbangan matang.
                </p>
                <p>
                  Anda dapat menghapus device kapan saja dari halaman Devices.
                  Akun dapat dihapus lewat Supabase Auth atau dengan menghubungi
                  kami. Ketentuan ini tunduk pada hukum Indonesia.
                </p>
              </div>
            </section>

            <section
              id="contact"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  09
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Kontak
                </h2>
              </div>
              <div className="mt-6 rounded-sm border border-border bg-surface p-6">
                <p className="text-sm font-semibold text-text-primary">
                  Ada pertanyaan
                </p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  Kami siap membantu menjelaskan ketentuan ini atau menjawab
                  pertanyaan seputar penggunaan yang sesuai.
                </p>
                <a
                  href="mailto:legal@wenderdotnet.com"
                  className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  <Mail className="h-4 w-4" />
                  legal@wenderdotnet.com
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
