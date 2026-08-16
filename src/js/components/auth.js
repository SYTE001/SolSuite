import { signIn, signUp, signInWithGoogle } from '../../lib/auth.js';
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

          <button type="button" id="btn-google-auth" class="btn-google-auth" style="width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; gap: 10px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.16s var(--ease);">
            <svg style="width: 18px; height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>${isRegister ? 'Daftar dengan Google' : 'Lanjutkan dengan Google'}</span>
          </button>

          <div style="display: flex; align-items: center; gap: 12px; margin: 18px 0 16px 0;">
            <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em;">atau</span>
            <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
          </div>

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

  const googleBtn = document.getElementById('btn-google-auth');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      if (googleBtn.disabled) return;
      googleBtn.disabled = true;
      googleBtn.style.opacity = '0.7';
      const labelText = isRegister ? 'Daftar dengan Google' : 'Lanjutkan dengan Google';
      googleBtn.innerHTML = `
        <span style="display:inline-block; width:14px; height:14px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation: spin 0.6s linear infinite; margin-right:8px;"></span>
        <span>Menghubungkan ke Google...</span>
      `;
      try {
        await signInWithGoogle();
      } catch (err) {
        if (errorDiv) {
          errorDiv.innerText = err.message || 'Gagal masuk dengan Google.';
          errorDiv.style.display = 'block';
        }
        showToast(err.message || 'Gagal masuk dengan Google', 'danger');
        googleBtn.disabled = false;
        googleBtn.style.opacity = '1';
        googleBtn.innerHTML = `
          <svg style="width: 18px; height: 18px; flex-shrink: 0;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>${labelText}</span>
        `;
      }
    });
  }

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
