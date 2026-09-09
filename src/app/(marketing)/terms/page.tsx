import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat Layanan — wenderdotnet",
  description: "Syarat Layanan wenderdotnet: aturan penggunaan dashboard bot WhatsApp.",
};

const updated = "8 September 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-text-muted">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Syarat Layanan</h1>
        <p className="mt-2 text-sm text-text-muted">Terakhir diperbarui: {updated}</p>
      </div>

      <div className="prose prose-neutral max-w-none dark:prose-invert prose-a:text-primary prose-headings:tracking-tight prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary">
        <p className="lead">
          Dengan membuat akun atau menggunakan wenderdotnet (“Layanan”), Anda menyetujui Syarat ini dan <Link href="/privacy">Kebijakan Privasi</Link>. Jika tidak setuju, jangan gunakan Layanan.
        </p>

        <h2>1. Deskripsi Layanan</h2>
        <p>
          Dashboard untuk mengelola nomor WhatsApp multi-device: konek via QR (<code>GET /api/devices/:id/login</code>) atau Kode Pairing (<code>POST /login/code</code>), atur webhook per-device (<code>PATCH /api/devices/:id/webhook</code> → GOWA <code>PATCH /devices/&#123;id&#125;/webhook</code>), buat automasi per-device (<code>device_automations</code> — prefix/contains/exact/regex, opsi <code>is_reply</code>/<code>mentions</code> <code>@everyone</code>/<code>duration</code>/<code>is_forwarded</code> per <code>openapi.yaml:1210</code>, target 1 grup per row duplicate per grup), dan lihat log (<code>/logs</code>). Bot WhatsApp sendiri berjalan di container <code>go-whatsapp-web-multidevice</code> (bukan bagian repo), terhubung via <code>BOT_API_URL</code>/<code>BOT_AUTH</code> (<code>src/lib/gowa.ts</code>).
        </p>

        <h2>2. Akun</h2>
        <ul>
          <li>Anda bertanggung jawab menjaga kredensial Supabase Auth (email/Google). Satu akun untuk satu entitas.</li>
          <li>Kami bisa suspend jika terdeteksi penyalahgunaan service-role key atau percobaan bypass RLS <code>user_owns_device</code>.</li>
        </ul>

        <h2>3. Kepatuhan WhatsApp</h2>
        <p>
          <strong>Tidak berafiliasi dengan WhatsApp/Meta.</strong> Automasi tunduk pada <a href="https://www.whatsapp.com/legal/business-terms" target="_blank" rel="noreferrer">WhatsApp Business Terms</a> dan kebijakan antispam. Risiko banned nomor ditanggung Anda. Gunakan opt-in, jangan spam, patuhi “Kata depan/contains” secara wajar.
        </p>

        <h2>4. Penggunaan yang dapat diterima</h2>
        <ul>
          <li>Dilarang: spam, phishing, penipuan, konten ilegal, scraping grup tanpa consent, bypass RLS, brute-force <code>BOT_AUTH</code>.</li>
          <li>Automasi <code>@everyone</code> hanya untuk grup di mana Anda admin dan anggota expect mention.</li>
          <li>Webhook: Anda bertanggung jawab atas endpoint yang Anda isi (<code>webhook_url</code>). Test dummy real akan hit URL Anda.</li>
        </ul>

        <h2>5. Automasi &amp; Group Picker</h2>
        <p>
          Daftar grup diambil live via <code>GET /user/my/groups</code> (header <code>X-Device-Id</code>, cached 30s, limit 500 <code>openapi.yaml:1074</code>). Performa dijaga dengan search debounce + virtual 100. Satu automasi = satu <code>target_jid</code>; untuk multi grup, sistem duplicate 1 row per grup. Status device polling 5s visibility-aware + auto-close QR modal ketika <code>logged_in</code> (bukan WebSocket karena <code>BOT_AUTH</code> server-only).
        </p>

        <h2>6. Paket gratis</h2>
        <p>Sekarang gratis (Phase 1 MVP). Kami bisa memperkenalkan batasan/berbayar nanti dengan pemberitahuan 14 hari. Data Anda tetap bisa diekspor via log.</p>

        <h2>7. Kekayaan intelektual</h2>
        <p>Anda memiliki konten pesan dan konfigurasi Anda. Kami memiliki kode dashboard. GOWA adalah proyek pihak ketiga (<code>aldinokemal2104/go-whatsapp-web-multidevice</code>) lisensi terpisah.</p>

        <h2>8. Penafian</h2>
        <p>Layanan “apa adanya”. Kami tidak menjamin nomor tidak akan di-banned WhatsApp, webhook 100% uptime, atau QR selalu 30 detik. Pin image GOWA <code>v9.2.2</code> di <code>compose.yaml</code>.</p>

        <h2>9. Batasan tanggung jawab</h2>
        <p>Sejauh diizinkan hukum, tanggung jawab kami terbatas pada biaya yang Anda bayar dalam 3 bulan terakhir (saat ini 0). Tidak termasuk kerugian tidak langsung akibat banned.</p>

        <h2>10. Penghentian</h2>
        <p>Kami bisa suspend/hapus akun/device jika melanggar Syarat atau terdeteksi spam massal. Anda bisa hapus device di <code>/devices</code> → <code>DELETE /api/devices/:id</code> (hapus slot GOWA + <code>user_devices</code> cascade) atau hapus akun via Supabase Auth.</p>

        <h2>11. Perubahan Syarat</h2>
        <p>Update akan ubah tanggal di atas dan notice di dashboard. Lanjut pakai = setuju.</p>

        <h2>12. Hukum yang berlaku</h2>
        <p>Indonesia, domisili Jakarta. Sengketa diselesaikan musyawarah, gagal → pengadilan Jakarta.</p>

        <h2>13. Kontak</h2>
        <p>
          Email: <a href="mailto:legal@wenderdotnet.com">legal@wenderdotnet.com</a> — untuk pertanyaan Syarat. Lihat juga <Link href="/privacy">Kebijakan Privasi</Link>.
        </p>

        <hr />
        <p className="text-xs text-text-muted">Bukan penasihat hukum. Konsultasikan ke kuasa hukum sebelum produksi.</p>
      </div>
    </div>
  );
}
