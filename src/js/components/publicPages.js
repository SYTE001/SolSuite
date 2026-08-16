import { getLogoIconSVG } from './logo.js';

export function renderPublicHeader(isAuthenticated = false) {
  const logoSVG = getLogoIconSVG(32);
  const appHref = isAuthenticated ? '/app' : '/register';
  const appLabel = isAuthenticated ? 'Open workspace' : 'Start free';

  return `
    <header class="landing-header">
      <div class="landing-header-inner">
        <a href="/" class="landing-brand" data-path="/">
          ${logoSVG}
          <span class="brand-title-bold">Kayana</span>
        </a>

        <nav class="landing-nav-center">
          <a href="/#features" class="landing-nav-link" data-path="/">Product</a>
          <a href="/pricing" class="landing-nav-link" data-path="/pricing">Pricing</a>
          <a href="/invoice-generator" class="landing-nav-link">Free invoice generator</a>
        </nav>

        <div class="landing-auth-actions">
          <button class="btn-icon" id="btn-public-theme-toggle" title="Toggle theme" aria-label="Toggle theme">
            <i data-lucide="sun" id="public-theme-icon"></i>
          </button>
          ${isAuthenticated ? '' : `<a href="/login" class="landing-nav-link" data-path="/login">Login</a>`}
          <a href="${appHref}" class="btn btn-primary" data-path="${appHref}">${appLabel}</a>
        </div>
      </div>
    </header>
  `;
}

export function renderPublicFooter() {
  const logoSVG = getLogoIconSVG(32);

  return `
    <footer class="landing-footer-ultra">
      <div class="footer-grid-container">
        <div class="footer-brand-column">
          <a href="/" class="landing-brand" data-path="/">
            ${logoSVG}
            <span class="brand-title-bold">Kayana</span>
          </a>
          <p class="brand-sub">A quieter operating desk for freelance business.</p>
        </div>

        <div class="footer-links-col">
          <h4 class="col-title">Product</h4>
          <a href="/#features" data-path="/">Invoices</a>
          <a href="/#features" data-path="/">Proposals</a>
          <a href="/pricing" data-path="/pricing">Pricing</a>
        </div>

        <div class="footer-links-col">
          <h4 class="col-title">Tools</h4>
          <a href="/invoice-generator">Free generator</a>
          <a href="/app" data-path="/app">Workspace</a>
        </div>

        <div class="footer-links-col">
          <h4 class="col-title">Account</h4>
          <a href="/login" data-path="/login">Login</a>
          <a href="/register" data-path="/register">Register</a>
        </div>

        <div class="footer-links-col">
          <h4 class="col-title">Legal & Support</h4>
          <a href="/privacy" data-path="/privacy">Privacy Policy</a>
          <a href="/terms" data-path="/terms">Terms of Service</a>
          <a href="/refund" data-path="/refund">Refund & Cancellation</a>
          <a href="/contact" data-path="/contact">Contact / Support</a>
        </div>
      </div>

      <div class="footer-bottom-bar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <p>&copy; 2026 Kayana. All rights reserved.</p>
        <p style="margin:0;">Contact Email: <a href="mailto:xnovaav@gmail.com" style="color:var(--accent-primary); text-decoration:underline;">xnovaav@gmail.com</a></p>
      </div>
    </footer>
  `;
}

export function renderTermsPage(isAuthenticated = false) {
  return `
    <div class="public-page-wrapper">
      ${renderPublicHeader(isAuthenticated)}
      
      <main class="public-container">
        <article class="public-card">
          <div class="public-header-badge">
            <i data-lucide="file-text" style="width:16px; height:16px;"></i>
            <span>Legal Documentation</span>
          </div>
          <h1 class="public-title">Terms of Service</h1>
          <p class="public-subtitle">Syarat & Ketentuan Layanan Kayana &bull; Terakhir Diperbarui: 12 Agustus 2026</p>
          <hr class="public-divider">

          <div class="public-content">
            <section class="public-section">
              <h2>1. Ketentuan Umum</h2>
              <p>Selamat datang di Kayana. Dengan mengakses atau menggunakan platform Kayana (aplikasi web dan layanan terkait), Anda setuju untuk terikat oleh Syarat dan Ketentuan Layanan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.</p>
            </section>

            <section class="public-section">
              <h2>2. Deskripsi Layanan</h2>
              <p>Kayana menyediakan platform manajemen operasional freelance yang mencakup pembuatan invoice, penyusunan proposal, penjadwalan pengingat pembayaran, manajemen direktori klien, dan fitur terkait. Kami secara berkala memperbarui dan meningkatkan layanan untuk memberikan pengalaman terbaik.</p>
            </section>

            <section class="public-section">
              <h2>3. Akun Pengguna & Akses</h2>
              <p>Untuk menggunakan fitur workspace Kayana, pengguna diwajibkan mendaftar akun dengan informasi yang akurat. Pengguna bertanggung jawab menjaga kerahasiaan kata sandi dan kredensial akun, serta bertanggung jawab penuh atas segala aktivitas di dalam akun tersebut.</p>
            </section>

            <section class="public-section">
              <h2>4. Langganan & Pembayaran</h2>
              <p>Kayana menawarkan paket Gratis (Free) dan paket Berlangganan Pro. Rincian harga, kuota bulanan, dan fitur tercantum pada halaman <a href="/pricing" data-path="/pricing">Pricing</a>. Pembayaran paket Pro diproses melalui penyedia pembayaran tepercaya.</p>
            </section>

            <section class="public-section">
              <h2>5. Pembatalan & Pengembalian Dana</h2>
              <p>Pembatalan langganan dan ketentuan pengembalian dana diatur secara rinci dalam halaman <a href="/refund" data-path="/refund">Refund & Cancellation Policy</a>. Pengguna dapat membatalkan berlangganan kapan saja melalui sistem atau dengan menghubungi dukungan pelanggan.</p>
            </section>

            <section class="public-section">
              <h2>6. Batasan Tanggung Jawab</h2>
              <p>Kayana disediakan dengan dasar "sebagaimana adanya" (as-is). Kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan pendapatan, atau perselisihan pembayaran antara freelancer dan klien mereka.</p>
            </section>

            <section class="public-section">
              <h2>7. Hubungi Kami</h2>
              <p>Apabila Anda memiliki pertanyaan mengenai Syarat & Ketentuan Layanan ini, silakan hubungi tim kami di <a href="mailto:xnovaav@gmail.com">xnovaav@gmail.com</a> atau melalui halaman <a href="/contact" data-path="/contact">Contact / Support</a>.</p>
            </section>
          </div>
        </article>
      </main>

      ${renderPublicFooter()}
    </div>
  `;
}

export function renderPrivacyPage(isAuthenticated = false) {
  return `
    <div class="public-page-wrapper">
      ${renderPublicHeader(isAuthenticated)}
      
      <main class="public-container">
        <article class="public-card">
          <div class="public-header-badge">
            <i data-lucide="shield-check" style="width:16px; height:16px;"></i>
            <span>Kebijakan Privasi</span>
          </div>
          <h1 class="public-title">Privacy Policy</h1>
          <p class="public-subtitle">Perlindungan Data & Privasi Pengguna Kayana &bull; Terakhir Diperbarui: 12 Agustus 2026</p>
          <hr class="public-divider">

          <div class="public-content">
            <section class="public-section">
              <h2>1. Komitmen Privasi Kami</h2>
              <p>Di Kayana, privasi dan keamanan data Anda adalah prioritas utama. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, mengolah, menyimpan, dan melindungi informasi pribadi serta data bisnis Anda saat menggunakan Kayana.</p>
            </section>

            <section class="public-section">
              <h2>2. Informasi yang Kami Kumpulkan</h2>
              <p>Kami mengumpulkan informasi yang Anda berikan secara langsung saat pendaftaran dan penggunaan layanan, meliputi:</p>
              <ul>
                <li><strong>Informasi Akun:</strong> Alamat email, nama lengkap, dan data profil pengguna.</li>
                <li><strong>Informasi Rekening Bank:</strong> Nama bank, nomor rekening, dan nama pemilik rekening untuk dicantumkan pada dokumen invoice Anda.</li>
                <li><strong>Data Dokumen & Klien:</strong> Nama klien, rincian pekerjaan, nominal invoice, proposal, dan pengingat yang Anda buat di dalam workspace.</li>
              </ul>
            </section>

            <section class="public-section">
              <h2>3. Penggunaan Informasi</h2>
              <p>Informasi yang dikumpulkan digunakan secara eksklusif untuk menyediakan fungsi platform, mengelola autentikasi akun, memproses layanan yang Anda minta, dan memberikan bantuan dukungan pelanggan.</p>
            </section>

            <section class="public-section">
              <h2>4. Kerahasiaan & Keamanan Data</h2>
              <p>Kami menerapkan enkripsi standar industri dan keamanan akses data (Row Level Security). Kayana <strong>tidak pernah menjual, menyewakan, atau membagikan data pribadi Anda</strong> kepada pihak ketiga untuk keperluan pemasaran.</p>
            </section>

            <section class="public-section">
              <h2>5. Hak-Hak Pengguna</h2>
              <p>Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui menu Pengaturan di aplikasi, atau dengan mengajukan permohonan ke tim support kami.</p>
            </section>

            <section class="public-section">
              <h2>6. Kontak Privasi</h2>
              <p>Jika Anda memiliki pertanyaan mengenai penggunaan data atau Kebijakan Privasi ini, hubungi kami via email di <a href="mailto:xnovaav@gmail.com">xnovaav@gmail.com</a>.</p>
            </section>
          </div>
        </article>
      </main>

      ${renderPublicFooter()}
    </div>
  `;
}

export function renderContactPage(isAuthenticated = false) {
  return `
    <div class="public-page-wrapper">
      ${renderPublicHeader(isAuthenticated)}
      
      <main class="public-container">
        <article class="public-card">
          <div class="public-header-badge">
            <i data-lucide="headphones" style="width:16px; height:16px;"></i>
            <span>Dukungan Pelanggan</span>
          </div>
          <h1 class="public-title">Contact & Support</h1>
          <p class="public-subtitle">Memiliki pertanyaan, kendala teknis, atau butuh bantuan langganan? Tim Kayana siap membantu Anda.</p>
          <hr class="public-divider">

          <div class="contact-grid">
            <div class="contact-info-card">
              <div class="contact-icon-box">
                <i data-lucide="mail" style="width:22px; height:22px;"></i>
              </div>
              <h3>Email Support</h3>
              <p>Kirimkan email secara langsung ke alamat resmi dukungan pelanggan kami:</p>
              <a href="mailto:xnovaav@gmail.com" class="contact-email-link">xnovaav@gmail.com</a>
              <span class="contact-note">
                <i data-lucide="clock" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>
                Waktu Respon: Maksimal 1x24 jam kerja (Senin - Jumat)
              </span>
            </div>

            <div class="contact-info-card">
              <div class="contact-icon-box">
                <i data-lucide="help-circle" style="width:22px; height:22px;"></i>
              </div>
              <h3>Layanan & Topik Bantuan</h3>
              <ul class="contact-topics-list">
                <li><i data-lucide="check-circle-2" style="width:16px; height:16px; color:var(--success);"></i> Bantuan Akun & Log In Workspace</li>
                <li><i data-lucide="check-circle-2" style="width:16px; height:16px; color:var(--success);"></i> Pertanyaan Tagihan, Plan Pro & Refund</li>
                <li><i data-lucide="check-circle-2" style="width:16px; height:16px; color:var(--success);"></i> Fitur Invoice, Proposal & Reminders</li>
                <li><i data-lucide="check-circle-2" style="width:16px; height:16px; color:var(--success);"></i> Laporan Kendala Teknis & Feedback</li>
              </ul>
            </div>
          </div>

          <div class="contact-cta-box">
            <h3 style="margin-top:0; font-size:1.15rem; font-weight:700; color:var(--text-main);">Butuh Bantuan Langsung?</h3>
            <p style="color:var(--text-muted); font-size:0.92rem; margin-bottom:18px;">Klik tombol di bawah ini untuk langsung membuka aplikasi email Anda.</p>
            <a href="mailto:xnovaav@gmail.com?subject=Tanya%20Kayana" class="btn btn-primary btn-pill-lg">
              <i data-lucide="send" style="width:18px; height:18px;"></i>
              <span>Kirim Email ke xnovaav@gmail.com</span>
            </a>
          </div>
        </article>
      </main>

      ${renderPublicFooter()}
    </div>
  `;
}

export function renderRefundPage(isAuthenticated = false) {
  return `
    <div class="public-page-wrapper">
      ${renderPublicHeader(isAuthenticated)}
      
      <main class="public-container">
        <article class="public-card">
          <div class="public-header-badge">
            <i data-lucide="refresh-cw" style="width:16px; height:16px;"></i>
            <span>Jaminan & Ketentuan Refund</span>
          </div>
          <h1 class="public-title">Refund & Cancellation Policy</h1>
          <p class="public-subtitle">Kebijakan Pengembalian Dana & Pembatalan Langganan &bull; Terakhir Diperbarui: 12 Agustus 2026</p>
          <hr class="public-divider">

          <div class="public-content">
            <section class="public-section">
              <h2>1. Pembatalan Langganan (Subscription Cancellation)</h2>
              <p>Anda dapat membatalkan berlangganan paket Kayana Pro kapan saja. Setelah pembatalan, Anda tetap memiliki akses penuh ke fitur Pro sampai akhir masa penagihan yang sedang aktif. Akun Anda tidak akan dikenakan tagihan berikutnya dan otomatis beralih ke paket Free setelah masa berlangganan selesai.</p>
            </section>

            <section class="public-section">
              <h2>2. Garansi 7 Hari Uang Kembali (7-Day Money Back Guarantee)</h2>
              <p>Kayana memberikan <strong>Garansi 7 Hari Uang Kembali 100%</strong> untuk pengguna baru yang pertama kali mengupgrade ke paket Pro. Apabila layanan Kayana tidak memenuhi ekspektasi Anda dalam waktu 7 hari sejak transaksi pertama, Anda berhak mendapatkan pengembalian dana penuh.</p>
            </section>

            <section class="public-section">
              <h2>3. Tata Cara Pengajuan Refund</h2>
              <p>Untuk memproses pengajuan pengembalian dana, ikuti langkah berikut:</p>
              <ol>
                <li>Kirim email pengajuan ke <a href="mailto:xnovaav@gmail.com">xnovaav@gmail.com</a>.</li>
                <li>Gunakan subjek: <code>Pengajuan Refund - [Email Akun Anda]</code>.</li>
                <li>Sertakan bukti pembayaran/nomor transaksi dan penjelasan singkat mengenai pengajuan Anda.</li>
              </ol>
            </section>

            <section class="public-section">
              <h2>4. Waktu Proses Pengembalian Dana</h2>
              <p>Permohonan refund yang disetujui akan diproses kembali ke rekening atau metode pembayaran asal Anda dalam waktu <strong>3 - 5 hari kerja</strong>.</p>
            </section>

            <section class="public-section">
              <h2>5. Layanan Bantuan</h2>
              <p>Untuk pertanyaan lanjutan mengenai status refund atau billing, hubungi tim support kami via email di <a href="mailto:xnovaav@gmail.com">xnovaav@gmail.com</a> atau halaman <a href="/contact" data-path="/contact">Contact / Support</a>.</p>
            </section>
          </div>
        </article>
      </main>

      ${renderPublicFooter()}
    </div>
  `;
}
