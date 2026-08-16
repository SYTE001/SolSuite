import { signIn, signUp } from '../../lib/auth.js';
import { showToast } from './toast.js';
import { getLogoIconSVG } from './logo.js';

export function renderAuthPage(isRegister = false) {
  const titleText = isRegister ? 'Mulai Workspace Anda' : 'Selamat Datang Kembali';
  const subtitleText = isRegister
    ? 'Kelola klien, invoice, proposal, dan pengingat dalam satu platform terpadu.'
    : 'Masuk untuk mengelola keuangan dan administrasi bisnis solo Anda.';
  const submitText = isRegister ? 'Daftar Akun Baru' : 'Masuk';
  const toggleLinkText = isRegister ? 'Sudah memiliki akun?' : 'Baru di SoloSuite?';
  const toggleActionText = isRegister ? 'Masuk' : 'Daftar';
  const togglePath = isRegister ? '/login' : '/register';
  const logoSVG = getLogoIconSVG(36);

  return `
    <div class="auth-page-container" style="display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh;">
      <!-- Editorial Panel -->
      <section class="auth-editorial" style="background: #08080a; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; color: white; position: relative;">
        <div>
          <a href="/" class="landing-brand" data-path="/" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: white;">
            ${logoSVG}
            <span class="brand-title-bold" style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">SoloSuite</span>
          </a>
          <h1 style="font-size: 38px; font-weight: 850; line-height: 1.1; margin-top: 64px; letter-spacing: -0.03em;">Administrasi bisnis yang tidak merepotkan Anda.</h1>
          <p class="brand-sub" style="font-size: 15px; color: var(--text-muted); line-height: 1.6; margin-top: 16px; max-width: 440px;">
            Invoice profesional, proposal konversi tinggi, CRM klien terpadu, dan agenda tindak lanjut dalam satu dasbor minimalis.
          </p>
        </div>

        <div class="auth-quote-card" style="padding: 20px; border-radius: var(--radius-md); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(10px); max-width: 440px;">
          <p style="font-size: 13.5px; line-height: 1.6; font-style: italic; color: rgba(255,255,255,0.85); margin: 0;">
            "SoloSuite membantu saya melacak invoice overdue secara instan dan meningkatkan konversi proposal proyek hingga 40%."
          </p>
          <div style="font-size: 11.5px; font-weight: 700; color: white; margin-top: 10px;">— Sarah K., Konsultan Desain</div>
        </div>
      </section>

      <!-- Action Panel -->
      <section class="auth-panel" style="background: var(--bg-app); padding: 48px; display: flex; align-items: center; justify-content: center;">
        <div class="auth-card" style="width: 100%; max-width: 380px; padding: 32px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
          <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0; letter-spacing: -0.02em;">${titleText}</h2>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 24px 0;">${subtitleText}</p>

          <div id="auth-page-error" class="auth-error" style="display: none; background: var(--danger-bg); color: var(--danger); border: 1px solid color-mix(in srgb, var(--danger) 15%, transparent); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 12.5px; margin-bottom: 16px;"></div>

          <form id="auth-page-form" style="display:flex; flex-direction:column; gap:16px;">
            ${isRegister ? `
              <div class="form-group">
                <label class="form-label" for="auth-page-fullname" style="font-size: 12px; font-weight: 700; color: var(--text-muted); display:block; margin-bottom: 6px;">Nama Lengkap</label>
                <input type="text" id="auth-page-fullname" class="form-control" placeholder="Alex Freelancer" required>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label" for="auth-page-email" style="font-size: 12px; font-weight: 700; color: var(--text-muted); display:block; margin-bottom: 6px;">Alamat Email</label>
              <input type="email" id="auth-page-email" class="form-control" placeholder="alex@example.com" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="auth-page-password" style="font-size: 12px; font-weight: 700; color: var(--text-muted); display:block; margin-bottom: 6px;">Kata Sandi</label>
              <input type="password" id="auth-page-password" class="form-control" placeholder="••••••••" required>
            </div>

            <button type="submit" id="auth-page-submit-btn" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:8px;">
              ${submitText}
            </button>
          </form>

          <div class="auth-switch" style="text-align: center; margin-top: 24px; font-size: 12.5px; color: var(--text-muted);">
            <span>${toggleLinkText}</span>
            <a href="${togglePath}" class="auth-page-toggle-link" data-path="${togglePath}" style="color: var(--accent-primary); font-weight: 700; text-decoration: none; margin-left: 4px;">${toggleActionText}</a>
          </div>

          <div style="text-align:center; margin-top: 14px;">
            <a href="/pricing" class="auth-secondary-link auth-page-pricing-link" data-path="/pricing" style="font-size: 11.5px; color: var(--text-dim); text-decoration:none; font-weight:600;">Lihat Pilihan Paket</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function attachAuthPageEvents(isRegister, onSuccess, onNavigate) {
  const form = document.getElementById('auth-page-form');
  const errorDiv = document.getElementById('auth-page-error');
  const submitBtn = document.getElementById('auth-page-submit-btn');

  document.querySelectorAll('.auth-page-toggle-link, .auth-page-pricing-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      if (onNavigate && path) onNavigate(path);
    });
  });

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorDiv) errorDiv.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Memproses...';
    }

    const email = document.getElementById('auth-page-email')?.value;
    const password = document.getElementById('auth-page-password')?.value;
    const fullName = document.getElementById('auth-page-fullname')?.value;

    try {
      if (isRegister) {
        await signUp({ email, password, fullName });
        showToast('Pendaftaran berhasil. Silakan masuk.', 'success');
        if (onNavigate) onNavigate('/login');
      } else {
        await signIn({ email, password });
        showToast('Berhasil masuk.', 'success');
        if (onSuccess) await onSuccess();
      }
    } catch (err) {
      if (errorDiv) {
        errorDiv.innerText = err.message || 'Otentikasi gagal.';
        errorDiv.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = isRegister ? 'Daftar Akun Baru' : 'Masuk';
      }
    }
  });
}
