import { renderPricingView } from './pricing.js';
import { getLogoIconSVG } from './logo.js';

export function renderLandingPage(isAuthenticated = false) {
  const pricingHTML = renderPricingView(isAuthenticated);
  const logoSVG = getLogoIconSVG(32);
  const appHref = isAuthenticated ? '/app' : '/register';
  const appLabel = isAuthenticated ? 'Open workspace' : 'Start free';

  return `
    <div class="landing-wrapper">
      <header class="landing-header">
        <div class="landing-header-inner">
          <a href="/" class="landing-brand" data-path="/">
            ${logoSVG}
            <span class="brand-title-bold">Kayana</span>
          </a>

          <nav class="landing-nav-center">
            <a href="#features" class="landing-nav-link">Product</a>
            <a href="#pricing" class="landing-nav-link">Pricing</a>
            <a href="#faq" class="landing-nav-link">FAQ</a>
            <a href="/invoice-generator" class="landing-nav-link">Free invoice generator</a>
          </nav>

          <div class="landing-auth-actions">
            <button class="btn-icon" id="btn-landing-theme-toggle" title="Toggle theme" aria-label="Toggle theme">
              <i data-lucide="sun" id="landing-theme-icon"></i>
            </button>
            ${isAuthenticated ? '' : `<a href="/login" class="landing-nav-link" data-path="/login">Login</a>`}
            <a href="${appHref}" class="btn btn-primary" data-path="${appHref}">${appLabel}</a>
          </div>
        </div>
      </header>

      <section class="landing-hero-ultra">
        <div class="hero-content-box">
          <h1 class="hero-huge-headline">Kayana – Platform invoicing dan manajemen proyek untuk pekerja lepas dan profesional.</h1>
          <p class="hero-subtext-clean">
            Kelola klien, buat invoice profesional, susun proposal, dan pantau pengingat pembayaran dalam satu ruang kerja minimalis yang tenang.
          </p>
          <div class="hero-cta-wrapper">
            <a href="${appHref}" class="btn btn-primary btn-pill-lg" data-path="${appHref}">
              <span>${appLabel}</span>
              <i data-lucide="arrow-right"></i>
            </a>
            <a href="/invoice-generator" class="btn btn-secondary">Create one invoice</a>
          </div>
        </div>

        <div class="hero-live-demo-container">
          <div class="hero-demo-controls">
            <span class="demo-controls-badge">Live invoice</span>
            <h3 class="demo-controls-title">Draft the bill while the client is still on the call.</h3>
            <p class="demo-controls-sub">Edit the fields and the document preview updates in place.</p>

            <div class="demo-form-group">
              <label class="demo-label">Client</label>
              <input type="text" id="demo-input-client" class="demo-input" value="PT Kopi Kenangan Nusantara" placeholder="Client name">
            </div>

            <div class="demo-form-group">
              <label class="demo-label">Work</label>
              <input type="text" id="demo-input-title" class="demo-input" value="Mobile app redesign and UI system" placeholder="Work description">
            </div>

            <div class="demo-form-group">
              <label class="demo-label">Amount</label>
              <input type="number" id="demo-input-amount" class="demo-input" value="15000000" placeholder="15000000">
            </div>
          </div>

          <div class="hero-demo-preview-card">
            <div class="demo-preview-header">
              <div class="demo-window-title">Invoice preview</div>
              <span>#INV-2026-LIVE</span>
            </div>

            <div class="demo-invoice-paper">
              <div class="demo-doc-top">
                <div>
                  <div class="demo-brand-name">Kayana</div>
                  <div class="demo-user-meta">Ahmad Fikri, Independent Designer</div>
                </div>
                <div class="demo-doc-badge">
                  <span class="demo-status-tag">Payable</span>
                  <div class="demo-inv-num">Due in 14 days</div>
                </div>
              </div>

              <div class="demo-divider"></div>

              <div class="demo-doc-details">
                <div class="demo-detail-box">
                  <span class="demo-detail-lbl">Billed to</span>
                  <strong class="demo-detail-val" id="demo-preview-client-display">PT Kopi Kenangan Nusantara</strong>
                </div>
                <div class="demo-detail-box">
                  <span class="demo-detail-lbl">Work</span>
                  <strong class="demo-detail-val" id="demo-preview-title-display">Mobile app redesign and UI system</strong>
                </div>
              </div>

              <div class="demo-doc-total-box">
                <div>
                  <span class="demo-total-lbl">Total</span>
                  <div class="demo-total-amount" id="demo-preview-amount-display">Rp 15.000.000</div>
                </div>
                <button class="btn btn-secondary btn-sm" type="button" disabled>WhatsApp proof</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-section" id="features">
        <div class="z-container">
          <div class="z-text-block">
            <span class="z-label">Invoices</span>
            <h2 class="z-headline">A bill that reads like your work is already organized.</h2>
            <p class="z-description">
              Build professional invoices with line items, due dates, tax, discount, bank details, PDF export, and WhatsApp sharing.
            </p>
            <ul class="z-bullet-list">
              <li><i data-lucide="check" class="check-ic"></i> Automatic totals for every line item</li>
              <li><i data-lucide="check" class="check-ic"></i> Clear payment instructions on every PDF</li>
              <li><i data-lucide="check" class="check-ic"></i> Status tracking from draft to paid</li>
            </ul>
          </div>

          <div class="ui-card-create-invoice">
            <div class="card-header-sm">
              <span class="title">New invoice</span>
              <span class="badge-status draft">Draft</span>
            </div>
            <div class="card-form-sample">
              <div class="form-row-mini">
                <label>Client</label>
                <div class="fake-input">Studio Inovasi Digital</div>
              </div>
              <div class="form-row-mini">
                <label>Work</label>
                <div class="fake-input">Product strategy and web redesign</div>
              </div>
              <div class="form-row-dual">
                <div>
                  <label>Amount</label>
                  <div class="fake-input bold">Rp 18.500.000</div>
                </div>
                <div>
                  <label>Due</label>
                  <div class="fake-input">15 Aug 2026</div>
                </div>
              </div>
              <button class="btn btn-primary btn-full-sm" disabled>Send invoice</button>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-section">
        <div class="z-container reverse">
          <div class="ui-card-payment-success">
            <div class="success-icon-wrap">
              <i data-lucide="check"></i>
            </div>
            <span class="success-title">Payment confirmed</span>
            <span class="success-subtitle">The client sends transfer proof directly through WhatsApp.</span>
            <div class="success-amount">Rp 15.000.000</div>
            <button class="btn btn-secondary btn-receipt" disabled>View invoice</button>
          </div>

          <div class="z-text-block">
            <span class="z-label">Client follow-through</span>
            <h2 class="z-headline">Reduce the small moments where payment gets stuck.</h2>
            <p class="z-description">
              Keep proposals, reminders, clients, and payment context connected so every next step is obvious.
            </p>
            <ul class="z-bullet-list">
              <li><i data-lucide="check" class="check-ic"></i> Proposal status and budget tracking</li>
              <li><i data-lucide="check" class="check-ic"></i> Reminder queues for follow-ups</li>
              <li><i data-lucide="check" class="check-ic"></i> Client records reused across documents</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="landing-pricing-section" id="pricing">
        ${pricingHTML}
      </section>

      <section class="landing-faq-section" id="faq">
        <div class="faq-container">
          <div class="faq-header-wrap">
            <span class="z-label">FAQ</span>
            <h2 class="z-headline">A few practical answers.</h2>
            <p class="faq-subtitle">The product is built around direct freelancer-client workflows.</p>
          </div>

          <div class="faq-accordion-list">
            ${[
              ['Do clients need a Kayana account?', 'No. They can open the invoice, read the payment details, transfer to your bank account, and send proof through WhatsApp.'],
              ['Can I use the free plan permanently?', 'Yes. The Free plan stays available with monthly limits for clients, invoices, and proposals.'],
              ['How does payment work?', 'Your own bank details appear on the invoice. Kayana helps create the document and the confirmation path; the transfer happens directly between client and freelancer.'],
              ['Can I export PDFs?', 'Yes. Invoices and proposals can be previewed and exported as polished PDF documents.'],
              ['Is my data protected?', 'Authentication and profile data are handled through Supabase, with application data scoped to the signed-in user.']
            ].map(([question, answer]) => `
              <div class="faq-accordion-item">
                <button class="faq-accordion-trigger" type="button" aria-expanded="false">
                  <span class="faq-question">${question}</span>
                  <i data-lucide="chevron-down" class="faq-icon"></i>
                </button>
                <div class="faq-accordion-content">
                  <div class="faq-accordion-content-inner">
                    <p>${answer}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

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
            <a href="#features">Invoices</a>
            <a href="#features">Proposals</a>
            <a href="#pricing">Pricing</a>
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
    </div>
  `;
}
