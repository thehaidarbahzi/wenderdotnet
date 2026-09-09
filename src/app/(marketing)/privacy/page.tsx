import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — wenderdotnet",
  description: "Kebijakan Privasi wenderdotnet: bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const updated = "8 September 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-text-muted">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-text-muted">Terakhir diperbarui: {updated}</p>
      </div>

      <div className="prose prose-neutral max-w-none dark:prose-invert prose-a:text-primary prose-headings:tracking-tight prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary prose-strong:text-text-primary">
        <p className="lead">
          wenderdotnet (“kami”) mengelola dashboard untuk menghubungkan nomor WhatsApp via QR/kode pairing, mengatur webhook dan automasi per-device, serta mencatat log aktivitas. Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa, dan bagaimana Anda mengontrolnya.
        </p>

        <h2>1. Data yang kami kumpulkan</h2>
        <ul>
          <li><strong>Akun:</strong> email, nama lengkap, avatar (dari Supabase Auth / Google OAuth), password terenkripsi (tidak kami simpan plain).</li>
          <li><strong>Device:</strong> <code>device_key</code> (ID slot dari bot GOWA), nama ramah device, JID WhatsApp setelah terhubung, status koneksi.</li>
          <li><strong>Konfigurasi per-device:</strong> <code>webhook_url</code>, <code>webhook_secret</code>, <code>webhook_events</code>, serta automasi (<code>trigger_category</code> prefix/contains/exact/regex, <code>pattern</code>, <code>reply</code>, <code>mentions</code>, <code>duration</code>, target grup/private).</li>
          <li><strong>Log aktivitas:</strong> <code>device_key</code>, <code>event_type</code> (message_received/sent, auto_reply_sent, session_connected/disconnected, error), <code>chat_jid</code>, <code>sender_jid</code>, <code>body</code> pesan, metadata. Log dibuat dari webhook bot, bukan scraping.</li>
          <li><strong>Newsletter:</strong> email jika Anda berlangganan.</li>
          <li><strong>Teknis:</strong> IP, user-agent, cookie sesi Supabase, preferensi tema.</li>
        </ul>

        <h2>2. Bagaimana kami menggunakan data</h2>
        <ul>
          <li>Menyediakan layanan: menghubungkan device, menyimpan automasi per-device, menjalankan rule engine saat webhook masuk, mengirim balasan via GOWA <code>POST /send/message</code>.</li>
          <li>Menampilkan dashboard: daftar device (polling 5s), detail device, daftar grup via <code>GET /user/my/groups</code> (X-Device-Id), log timeline.</li>
          <li>Keamanan: verifikasi HMAC webhook (<code>X-Hub-Signature-256</code> dengan <code>WHATSAPP_WEBHOOK_SECRET</code>), RLS <code>user_owns_device(device_key)</code>.</li>
          <li>Komunikasi: email verifikasi/reset via Supabase Auth, toast di UI.</li>
        </ul>

        <h2>3. WhatsApp &amp; GOWA</h2>
        <p>
          Koneksi WhatsApp ditangani container <code>aldinokemal2104/go-whatsapp-web-multidevice</code> via QR/kode pairing (seperti WhatsApp Web). Kami tidak menyimpan password WhatsApp. Pesan Anda diteruskan bot ke webhook kami hanya jika Anda mengkonfigurasi <code>webhook_url</code> per-device. Balasan otomatis dikirim kembali via bot dengan <code>is_reply</code>/<code>mentions</code> (<code>@everyone</code>)/<code>duration</code> sesuai <code>openapi.yaml</code>.
        </p>

        <h2>4. Penyimpanan &amp; Supabase</h2>
        <ul>
          <li>Data disimpan di Supabase Postgres (region sesuai project Anda) dengan RLS. Migration <code>003_grants.sql</code> &amp; <code>004_per_device_automations.sql</code> mengatur grants &amp; RLS per-device.</li>
          <li>Sesi device bot disimpan di volume <code>whatsapp:/app/storages</code> di server bot, bukan di Supabase.</li>
          <li>QR image <code>http://BOT/statics/qrcode/...</code> publik sementara (30 detik).</li>
        </ul>

        <h2>5. Cookie &amp; pihak ketiga</h2>
        <ul>
          <li><strong>Supabase Auth:</strong> cookie sesi <code>sb-*</code> untuk login, Google OAuth via <code>https://&lt;ref&gt;.supabase.co/auth/v1/callback</code> (hence “Lanjutkan ke supabase.co” di consent Google — normal).</li>
          <li><strong>Google OAuth:</strong> hanya jika Anda pakai “Masuk dengan Google”. Kami menerima email/nama/avatar dari Google.</li>
          <li><strong>Tidak ada tracker iklan.</strong> Hanya <code>next-themes</code> untuk tema dan <code>sonner</code> untuk toast.</li>
        </ul>

        <h2>6. Retention</h2>
        <ul>
          <li>Log: append-only, tidak auto-hapus. Anda bisa minta penghapusan via kontak.</li>
          <li>Device: hapus di <code>/devices</code> → <code>DELETE /api/devices/:id</code> (hapus slot di GOWA + row <code>user_devices</code> + <code>device_automations</code> cascade).</li>
          <li>Akun: hapus via Supabase Dashboard → Auth → Users (atau hubungi kami).</li>
        </ul>

        <h2>7. Hak Anda</h2>
        <p>Akses, koreksi, hapus data, dan cabut consent. Untuk device, atur sendiri di detail device (Webhook/Automasi). Untuk data akun/log, email kami.</p>

        <h2>8. Keamanan</h2>
        <p>Basic Auth bot (<code>BOT_AUTH</code>), HMAC webhook, RLS per-device, service-role key server-only (<code>src/lib/supabase/server.ts</code>). Namun WhatsApp melarang automasi yang spam — risiko banned nomor ada di Anda (lihat Terms).</p>

        <h2>9. Anak di bawah umur</h2>
        <p>Layanan untuk 17+ atau dengan izin wali.</p>

        <h2>10. Perubahan</h2>
        <p>Kami akan update tanggal di atas dan tampilkan notice di dashboard jika material.</p>

        <h2>11. Kontak</h2>
        <p>
          Email: <a href="mailto:privacy@wenderdotnet.com">privacy@wenderdotnet.com</a> — untuk permintaan data/hapus. Untuk setup lihat <Link href="/terms">Syarat Layanan</Link>.
        </p>

        <hr />
        <p className="text-xs text-text-muted">Bukan penasihat hukum. Sesuaikan dengan kebutuhan bisnis Anda sebelum produksi.</p>
      </div>
    </div>
  );
}
