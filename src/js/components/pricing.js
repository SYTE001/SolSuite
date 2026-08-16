import { ApiService } from '../api.js';

export function renderPricingView(isLoggedIn = false) {
  const currentUser = isLoggedIn ? ApiService.getUser() : null;
  const currentPlan = isLoggedIn ? (currentUser?.plan || 'free').toLowerCase() : 'none';
  
  const getButton = (planName, defaultText) => {
    const plan = planName.toLowerCase();
    
    if (isLoggedIn) {
      if (currentPlan === plan) {
        return `<button class="btn btn-secondary btn-select-plan" style="width:100%; justify-content:center; cursor:default; opacity:0.8;" data-plan="${planName}" disabled>Aktif Saat Ini</button>`;
      }
    }
    
    const btnClass = plan === 'pro' ? 'btn-primary' : 'btn-secondary';
    return `<button class="btn ${btnClass} btn-select-plan" style="width:100%; justify-content:center;" data-plan="${planName}">${defaultText}</button>`;
  };

  const checkIcon = `<i data-lucide="check" style="width:16px; height:16px; color:var(--success); flex-shrink:0;"></i>`;

  return `
    <div class="pricing-container" style="max-width: 1040px; margin: 0 auto; padding: 20px 0 40px 0;">
      <div class="pricing-header" style="text-align: center; margin-bottom: 40px;">
        <span class="pricing-tag" style="font-size: 11px; font-weight:800; letter-spacing: 0.1em; color: var(--accent-primary); text-transform: uppercase; background: var(--accent-subtle); padding: 4px 10px; border-radius: var(--radius-full);">PILILHAN PAKET LAYANAN</span>
        <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 14px; letter-spacing:-0.025em;">Tingkatkan Kapasitas Bisnis Solo Anda</h2>
        <p style="font-size: 14px; color: var(--text-muted); margin-top: 6px; max-width: 480px; margin-left:auto; margin-right:auto;">Pilih tingkat layanan yang sesuai dengan kebutuhan operasional usaha kreatif & jasa konsultasi Anda.</p>
        ${!isLoggedIn ? `
          <div class="pricing-auth-control" style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
            <a href="/login" class="btn btn-primary nav-link-pricing" data-path="/login">Masuk</a>
            <a href="/register" class="btn btn-secondary nav-link-pricing" data-path="/register">Daftar Akun Baru</a>
          </div>
        ` : ''}
      </div>

      <div class="pricing-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch;">
        <!-- Free Plan -->
        <div class="card pricing-card" style="padding: 28px; display:flex; flex-direction:column; justify-content:space-between; border: 1px solid var(--border-color); background:var(--bg-card);">
          <div>
            <div style="font-size: 11px; font-weight:700; color: var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">FREE TIER</div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 6px 0 0 0;">Free</h3>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); margin: 16px 0 20px 0;" class="font-mono">Rp 0 <span style="font-size: 13px; color: var(--text-muted); font-weight:600;">/bln</span></div>
            
            <ul style="list-style:none; padding:0; margin: 0 0 28px 0; display:flex; flex-direction:column; gap:12px; font-size:12.5px; color:var(--text-secondary);">
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Maksimal 3 klien aktif</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Maks 5 invoice / bulan</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Maks 3 proposal proyek / bulan</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Ekspor standar PDF</span></li>
            </ul>
          </div>
          ${getButton('Free', 'Downgrade ke Free')}
        </div>

        <!-- Starter Plan -->
        <div class="card pricing-card" style="padding: 28px; display:flex; flex-direction:column; justify-content:space-between; border: 1px solid var(--border-color); background:var(--bg-card);">
          <div>
            <div style="font-size: 11px; font-weight:700; color: var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">STARTER PACK</div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 6px 0 0 0;">Starter</h3>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); margin: 16px 0 20px 0;" class="font-mono">Rp 39.000 <span style="font-size: 13px; color: var(--text-muted); font-weight:600;">/bln</span></div>
            
            <ul style="list-style:none; padding:0; margin: 0 0 28px 0; display:flex; flex-direction:column; gap:12px; font-size:12.5px; color:var(--text-secondary);">
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Maksimal 15 klien aktif</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Maks 30 invoice / bulan</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Maks 20 proposal proyek / bulan</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Kustomisasi logo & identitas</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Ekspor PDF kualitas tinggi</span></li>
            </ul>
          </div>
          ${getButton('Starter', 'Pilih Paket Starter')}
        </div>

        <!-- Pro Plan (Vibrant highlight) -->
        <div class="card pricing-card featured" style="padding: 28px; display:flex; flex-direction:column; justify-content:space-between; border: 2px solid var(--text-primary); background:var(--bg-card); position:relative; box-shadow: var(--shadow-md);">
          <span style="position: absolute; top: -11px; right: 20px; font-size: 9.5px; font-weight: 800; background: var(--text-primary); color: var(--bg-card); padding: 4px 10px; border-radius: var(--radius-full); letter-spacing:0.04em;">PALING POPULER</span>
          <div>
            <div style="font-size: 11px; font-weight:700; color: var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">PRO PROFESSIONAL</div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 6px 0 0 0;">Pro</h3>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); margin: 16px 0 20px 0;" class="font-mono">Rp 79.000 <span style="font-size: 13px; color: var(--text-muted); font-weight:600;">/bln</span></div>
            
            <ul style="list-style:none; padding:0; margin: 0 0 28px 0; display:flex; flex-direction:column; gap:12px; font-size:12.5px; color:var(--text-secondary);">
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Klien & Dokumen Tanpa Batas</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Integrasi WA invoice direct send</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Fitur follow-up agenda otomatis</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Multi-currency invoice generator</span></li>
              <li style="display:flex; gap:8px; align-items:center;">${checkIcon}<span>Akses template proposal premium</span></li>
            </ul>
          </div>
          ${getButton('Pro', 'Upgrade ke Pro')}
        </div>
      </div>
    </div>
  `;
}
