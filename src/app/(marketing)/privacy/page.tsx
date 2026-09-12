import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Database,
  Cookie,
  Lock,
  Mail,
  Clock,
  Info,
  Eye,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi: wenderdotnet",
  description:
    "Kebijakan Privasi wenderdotnet: bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const updated = "8 September 2026";

const toc = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "data", label: "01. Data yang dikumpulkan" },
  { id: "use", label: "02. Penggunaan data" },
  { id: "wa", label: "03. WhatsApp dan GOWA" },
  { id: "storage", label: "04. Penyimpanan" },
  { id: "cookie", label: "05. Cookie dan pihak ketiga" },
  { id: "retention", label: "06. Penyimpanan dan penghapusan" },
  { id: "rights", label: "07. Hak Anda" },
  { id: "security", label: "08. Keamanan" },
  { id: "contact", label: "09. Kontak" },
];

export default function PrivacyPage() {
  return (
    <div className="bg-background">
      <div className="border-b border-border bg-surface-subtle/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl sm:leading-[1.05]">
              Kebijakan Privasi
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-text-secondary">
              Penjelasan langsung tentang data yang kami simpan, tujuan
              penggunaannya, dan kontrol yang tetap berada di tangan Anda.
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
                Waktu baca sekitar 6 menit
              </span>
              <span className="h-4 w-px bg-border" aria-hidden />
              <Link
                href="/terms"
                className="font-medium text-primary hover:text-primary-hover hover:underline"
              >
                Syarat Layanan
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
            <div
              id="ringkasan"
              className="scroll-mt-28 rounded-sm border border-primary/15 bg-primary/5 p-6 sm:p-7"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
                  <Info className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-text-primary">
                    Ringkasan
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    Kami menyimpan akun, pengaturan device, automasi yang Anda
                    buat, dan log aktivitas. Pesan WhatsApp tersimpan hanya
                    sebagai log, bukan arsip lengkap. Hapus device berarti semua
                    data terkait ikut terhapus. Kami tidak menjalankan tracker
                    iklan.
                  </p>
                </div>
              </div>
            </div>

            <section
              id="data"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  01
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Data yang kami kumpulkan
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Kami hanya menyimpan data yang diperlukan agar dashboard dan
                  bot dapat berjalan. Tidak ada yang kami kumpulkan di luar
                  kebutuhan tersebut.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <span className="font-semibold text-text-primary">
                      Akun.
                    </span>{" "}
                    Email, nama, dan foto profil dari pendaftaran atau Google
                    OAuth. Kata sandi tersimpan dalam bentuk terenkripsi.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Device.
                    </span>{" "}
                    Nama device yang Anda buat, identifier slot GOWA, serta
                    identitas WhatsApp dan status koneksi setelah terhubung.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Pengaturan per device.
                    </span>{" "}
                    Aturan automasi yang Anda susun, seperti kata kunci, pola
                    balasan, dan tujuan pengiriman ke grup atau chat pribadi.
                    Jika Anda mengisi webhook, URL dan preferensi event ikut
                    tersimpan.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Log aktivitas.
                    </span>{" "}
                    Catatan kejadian seperti pesan diterima, balasan terkirim,
                    atau perubahan status koneksi beserta konteks chat yang
                    relevan.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Informasi teknis.
                    </span>{" "}
                    Alamat IP, user-agent, cookie sesi, dan preferensi tema.
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="use"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  02
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Penggunaan data
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>Kami menggunakan data untuk tiga keperluan berikut.</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <span className="font-semibold text-text-primary">
                      Menjalankan layanan.
                    </span>{" "}
                    Menyimpan automasi, menjalankan aturan saat pesan masuk, dan
                    mengirim balasan melalui koneksi WhatsApp yang sudah Anda
                    hubungkan.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Menampilkan dashboard.
                    </span>{" "}
                    Menampilkan daftar device, status koneksi, daftar grup, dan
                    linimasa log agar Anda mudah memantau.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Menjaga keamanan.
                    </span>{" "}
                    Memverifikasi webhook dan memastikan setiap pengguna hanya
                    mengakses device miliknya.
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
                  WhatsApp dan GOWA
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Koneksi WhatsApp ditangani oleh container{" "}
                  <code className="rounded-sm border border-border bg-surface-subtle px-1.5 py-0.5 font-mono text-[13px] text-text-primary">
                    go-whatsapp-web-multidevice
                  </code>{" "}
                  dengan QR atau kode pairing, mirip seperti WhatsApp Web. Kami
                  tidak menyimpan kata sandi WhatsApp. Pesan hanya diteruskan ke
                  sistem kami ketika ada kejadian yang perlu diproses, dan
                  balasan dikirim kembali sesuai aturan yang Anda tentukan.
                </p>
              </div>
            </section>

            <section
              id="storage"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  04
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Penyimpanan dan infrastruktur
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Data aplikasi tersimpan di Supabase Postgres dengan Row
                    Level Security. Akses per device diatur melalui migrasi yang
                    membatasi setiap pengguna pada datanya sendiri.
                  </li>
                  <li>
                    Sesi WhatsApp tersimpan pada volume terpisah di server bot,
                    bukan di database utama.
                  </li>
                  <li>
                    Gambar QR bersifat sementara, publik sekitar 30 detik untuk
                    proses penautan.
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="cookie"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  05
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Cookie dan layanan pihak ketiga
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <span className="font-semibold text-text-primary">
                      Supabase Auth.
                    </span>{" "}
                    Cookie sesi menjaga Anda tetap masuk. Jika memakai Google
                    OAuth, login melalui domain Supabase sehingga persetujuan
                    Google menampilkan Lanjutkan ke supabase.co. Ini perilaku
                    normal.
                  </li>
                  <li>
                    <span className="font-semibold text-text-primary">
                      Tanpa tracker iklan.
                    </span>{" "}
                    Kami hanya memakai komponen untuk tema dan notifikasi. Tidak
                    ada skrip pelacakan iklan.
                  </li>
                </ul>
              </div>
            </section>

            <section
              id="retention"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  06
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Berapa lama data disimpan
                </h2>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Log aktivitas",
                    desc: "Tersimpan selama akun aktif. Anda dapat meminta penghapusan kapan saja.",
                    icon: Clock,
                  },
                  {
                    title: "Device",
                    desc: "Hapus dari halaman Devices. Automasi dan log terkait ikut terhapus.",
                    icon: Database,
                  },
                  {
                    title: "Akun",
                    desc: "Hapus melalui Supabase Auth atau hubungi kami untuk bantuan.",
                    icon: Shield,
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-sm border border-border bg-surface p-5 shadow-sm"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-sm bg-surface-subtle text-text-muted">
                      <c.icon className="h-4 w-4" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-text-primary">
                      {c.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-text-muted">
                      {c.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="rights"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  07
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Hak Anda
                </h2>
              </div>
              <div className="mt-6 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Anda dapat mengakses, memperbaiki, menghapus, atau menarik
                  persetujuan atas data Anda. Pengaturan device tersedia di
                  halaman detail device. Untuk permintaan terkait akun atau log,
                  hubungi kami.
                </p>
              </div>
            </section>

            <section
              id="security"
              className="scroll-mt-28 border-t border-border pt-10 mt-10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-primary">
                  08
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-[22px]">
                  Keamanan
                </h2>
              </div>
              <div className="mt-6 rounded-sm border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <Lock className="h-4 w-4" /> Perlu diketahui
                </p>
                <p className="mt-2.5 text-sm leading-7 text-amber-700 dark:text-amber-200/80">
                  WhatsApp melarang spam. Penggunaan automasi yang berlebihan
                  dapat membuat nomor dibatasi atau diblokir. Tanggung jawab
                  penggunaan wajar ada pada Anda. Selalu gunakan automasi dengan
                  bijak, terutama untuk mention di grup. Rincian ada di{" "}
                  <Link
                    href="/terms"
                    className="font-medium underline decoration-amber-300 underline-offset-4 hover:text-amber-900 dark:hover:text-amber-100"
                  >
                    Syarat Layanan
                  </Link>
                  .
                </p>
              </div>
              <div className="mt-8 space-y-4 text-[15px] leading-7 text-text-secondary">
                <p>
                  Layanan untuk 17 tahun ke atas, atau dengan izin orang tua
                  atau wali.
                </p>
                <p>
                  Jika ada perubahan berarti, kami perbarui tanggal di atas dan
                  tampilkan pemberitahuan di dashboard.
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
                  Butuh bantuan terkait data
                </p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  Hubungi kami dan kami akan membantu permintaan akses atau
                  penghapusan data Anda.
                </p>
                <a
                  href="mailto:privacy@wenderdotnet.com"
                  className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  <Mail className="h-4 w-4" />
                  privacy@wenderdotnet.com
                </a>
                <p className="mt-4 text-xs text-text-muted">
                  Lihat juga{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-primary hover:underline"
                  >
                    Syarat Layanan
                  </Link>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
