import { getCurrentUser, signOut } from '../lib/auth.js';
import { supabase } from '../lib/supabase.js';
import { renderAuthPage, attachAuthPageEvents } from './components/auth.js';
import { ApiService, escapeHtml } from './api.js';
import { showToast } from './components/toast.js';
import { renderDashboard, getDashboardSkeletonHTML } from './components/dashboard.js';
import { getSkeletonHTML } from './components/skeletons.js';
import { renderClientsView, getClientModalHTML, getClientDetailModalHTML } from './components/clients.js';
import { renderInvoicesView, getInvoiceFormModalHTML, getInvoicePreviewModalHTML } from './components/invoices.js';
import { renderProposalsView, getProposalFormModalHTML, getProposalPreviewModalHTML } from './components/proposals.js';
import { renderRemindersView, getReminderFormModalHTML } from './components/reminders.js';
import { renderPricingView } from './components/pricing.js';
import { renderLandingPage } from './components/landing.js';
import { renderTermsPage, renderPrivacyPage, renderContactPage, renderRefundPage } from './components/publicPages.js';
import { initCustomDropdowns } from './components/dropdown.js';
import { checkPlanLimits } from './utils/limits.js';
import { Router } from './router.js';
import { buildWhatsAppInvoiceUrl } from './utils/whatsapp.js';
import { openCommandPalette } from './components/commandPalette.js';

// Currency Formatter
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function countItemsCreatedThisMonth(items) {
  const now = new Date();
  return items.filter(item => {
    const createdAt = new Date(item.created_at || item.createdAt);
    return !Number.isNaN(createdAt.getTime())
      && createdAt.getFullYear() === now.getFullYear()
      && createdAt.getMonth() === now.getMonth();
  }).length;
}

// Helper to handle plan limit errors
function handleSaveError(err) {
  if (err.message === 'LIMIT_REACHED') {
    closeModal();
    showToast('Plan limit reached. Upgrade your plan to create more.', 'danger');
    if (window.appInstance?.router) {
      window.appInstance.router.navigate('/app/pricing');
    }
    return true;
  }
  return false;
}

// Modal Control
const modalBackdrop = document.getElementById('modal-backdrop');
const modalDialog = document.getElementById('modal-dialog');

function openModal(htmlContent) {
  if (!modalDialog || !modalBackdrop) return;
  modalDialog.innerHTML = htmlContent;
  modalBackdrop.classList.add('open');
  if (window.lucide) window.lucide.createIcons();
  initCustomDropdowns(modalDialog);
  attachModalEvents();
}
window.openModal = openModal;

function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('open');
}
window.closeModal = closeModal;

function attachModalEvents() {
  modalDialog?.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
}

function showConfirmModal({
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus item ini?',
  confirmText = 'Hapus',
  confirmType = 'danger',
  icon = 'trash-2',
  onConfirm
}) {
  openModal(`
    <div class="modal-body" style="padding:32px 28px 28px; text-align:center;">
      <div style="width:52px; height:52px; margin:0 auto 18px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--danger-bg); color:var(--danger);">
        <i data-lucide="${icon}" style="width:24px; height:24px;"></i>
      </div>
      <h2 style="margin:0 0 10px; color:var(--text-main); font-size:1.15rem; font-weight:700; letter-spacing:-0.02em;">${escapeHtml(title)}</h2>
      <p style="margin:0; color:var(--text-muted); font-size:0.9rem; line-height:1.55;">${escapeHtml(message)}</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:26px;">
        <button type="button" class="btn btn-secondary modal-close">Batal</button>
        <button type="button" class="btn btn-${confirmType}" id="btn-modal-confirm-action">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `);

  document.getElementById('btn-modal-confirm-action')?.addEventListener('click', async () => {
    closeModal();
    if (onConfirm) await onConfirm();
  });
}

modalBackdrop?.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

function getSettingsModalHTML(user = {}) {
  return `
    <div class="modal-header">
      <h2>Account & Business Settings</h2>
      <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
    </div>
    <form id="form-settings">
      <div class="modal-body">
        <div style="font-weight: 600; font-size: 0.88rem; margin-bottom: 12px; color: var(--text-primary);">
          Identitas Penerbit Invoice (Issuer)
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Nama Lengkap *</label>
            <input type="text" name="fullName" class="form-control" value="${escapeHtml(user.name || '')}" required placeholder="e.g., Ahmad Fikri">
          </div>
          <div class="form-group">
            <label class="form-label">Nama Studio / Usaha</label>
            <input type="text" name="company" class="form-control" value="${escapeHtml(user.company || '')}" placeholder="e.g., Fikri Creative Studio">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">No. Telepon / WhatsApp</label>
            <input type="text" name="phone" class="form-control" value="${escapeHtml(user.phone || '')}" placeholder="+62 812 3456 7890">
          </div>
          <div class="form-group">
            <label class="form-label">NPWP (Opsional)</label>
            <input type="text" name="npwp" class="form-control" value="${escapeHtml(user.npwp || '')}" placeholder="e.g., 01.234.567.8-901.000">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Alamat Usaha / Kota</label>
          <input type="text" name="address" class="form-control" value="${escapeHtml(user.address || '')}" placeholder="e.g., Jl. Sudirman No. 12, Jakarta Selatan">
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 20px 0;">
        <div style="font-weight: 600; font-size: 0.88rem; margin-bottom: 12px; color: var(--text-primary);">
          Informasi Rekening Bank (Tampil di Invoice)
        </div>
        <div class="form-group">
          <label class="form-label">Nama Bank</label>
          <input type="text" name="bankName" class="form-control" value="${escapeHtml(user.bankName || '')}" placeholder="e.g. BCA / Mandiri / BNI">
        </div>
        <div class="form-group">
          <label class="form-label">Nomor Rekening</label>
          <input type="text" name="bankAccountNumber" class="form-control" value="${escapeHtml(user.bankAccountNumber || '')}" placeholder="e.g. 1234567890">
        </div>
        <div class="form-group">
          <label class="form-label">Nama Pemilik Rekening (a.n.)</label>
          <input type="text" name="bankAccountName" class="form-control" value="${escapeHtml(user.bankAccountName || user.name || '')}" placeholder="e.g. Ahmad Fikri">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
      </div>
    </form>
  `;
}

// Main App Controller
class App {
  constructor() {
    this.currentPage = 'dashboard';
    this.navigationVersion = 0;
    this.iconRenderFrame = null;
    this.pageAnimationFrame = null;
    this.profileSyncUserId = null;
    this.profileSyncPromise = null;
    this.formatIDR = formatIDR;
    this.init();
  }

  async init() {
    // Theme setup
    const currentTheme = ApiService.getTheme();
    ApiService.setTheme(currentTheme);
    this.updateThemeIcon(currentTheme);

    this.setupEventListeners();
    this.setupKeyboardShortcuts();

    // Initialize SPA Router
    this.router = new Router(
      ['landing', 'dashboard', 'invoices', 'proposals', 'reminders', 'clients', 'pricing', 'login', 'register', 'terms', 'privacy', 'contact', 'refund'],
      async (page, routeInfo) => {
        await this.handleNavigation(page, routeInfo);
      },
      (page) => this.prepareNavigation(page)
    );

    window.appInstance = this;
    await this.router.handleRoute();
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  setupKeyboardShortcuts() {
    let lastKey = '';
    let keyTimeout = null;

    window.addEventListener('keydown', async (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = ['input', 'textarea', 'select'].includes(activeTag) || document.activeElement?.isContentEditable;

      // Cmd/Ctrl + K (Command Palette) works everywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette(this);
        return;
      }

      if (e.key === 'Escape') {
        window.closeModal();
        return;
      }

      // Ignore single & sequence shortcuts when typing inside form fields
      if (isInput) return;

      const key = e.key.toLowerCase();

      // Handle sequence shortcuts (G + D, G + I, N + I, etc.)
      if (lastKey) {
        const combo = `${lastKey}+${key}`;
        lastKey = '';
        if (keyTimeout) clearTimeout(keyTimeout);

        switch (combo) {
          case 'g+d':
            e.preventDefault();
            this.router.navigate('/app/dashboard');
            break;
          case 'g+i':
            e.preventDefault();
            this.router.navigate('/app/invoices');
            break;
          case 'g+p':
            e.preventDefault();
            this.router.navigate('/app/proposals');
            break;
          case 'g+c':
            e.preventDefault();
            this.router.navigate('/app/clients');
            break;
          case 'g+r':
            e.preventDefault();
            this.router.navigate('/app/reminders');
            break;
          case 'n+i':
            e.preventDefault();
            openModal(await getInvoiceFormModalHTML());
            this.attachInvoiceFormEvents();
            break;
          case 'n+p':
            e.preventDefault();
            openModal(await getProposalFormModalHTML());
            this.attachProposalFormEvents();
            break;
          case 'n+c':
            e.preventDefault();
            openModal(getClientModalHTML());
            this.attachClientFormEvents();
            break;
        }
        return;
      }

      if (['g', 'n'].includes(key)) {
        lastKey = key;
        if (keyTimeout) clearTimeout(keyTimeout);
        keyTimeout = setTimeout(() => {
          lastKey = '';
        }, 1200);
      }
    });
  }

  updateFormRealtimePreview() {
    const form = document.getElementById('form-invoice');
    if (!form) return;

    const invoiceNum = form.querySelector('[name="invoiceNumber"]')?.value || '—';
    const title = form.querySelector('[name="title"]')?.value || '—';
    const dueDate = form.querySelector('[name="dueDate"]')?.value || '—';
    const taxPercent = parseFloat(form.querySelector('[name="taxPercent"]')?.value) || 0;
    const discountPercent = parseFloat(form.querySelector('[name="discountPercent"]')?.value) || 0;
    const paymentNotes = form.querySelector('[name="paymentNotes"]')?.value || '';
    
    // Client Name
    const clientSelect = form.querySelector('[name="clientId"]');
    let clientName = '—';
    let clientCompany = '';
    if (clientSelect) {
      // Look for the selected custom dropdown option if custom dropdown is used
      const selectedOption = clientSelect.closest('.custom-dropdown')?.querySelector('.custom-dropdown-option.selected') || clientSelect.querySelector('option:checked');
      if (selectedOption) {
        clientName = selectedOption.querySelector?.('.option-label')?.textContent || selectedOption.textContent || '—';
        clientCompany = selectedOption.querySelector?.('.option-subtext')?.textContent || '';
      }
    }

    // Items list
    const descs = Array.from(form.querySelectorAll('.item-desc')).map(i => i.value);
    const qtys = Array.from(form.querySelectorAll('.item-qty')).map(i => parseFloat(i.value) || 0);
    const prices = Array.from(form.querySelectorAll('.item-price')).map(i => parseFloat(i.value) || 0);

    const items = descs.map((desc, i) => {
      const qty = qtys[i];
      const price = prices[i];
      return { desc, qty, price, total: qty * price };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxAmount = subtotal * (taxPercent / 100);
    const total = subtotal - discountAmount + taxAmount;

    // Render into preview elements
    const prevNumber = document.getElementById('prev-number');
    if (prevNumber) prevNumber.textContent = '#' + invoiceNum;
    
    const prevDue = document.getElementById('prev-due');
    if (prevDue) prevDue.textContent = 'Due: ' + dueDate;

    const prevClientName = document.getElementById('prev-client-name');
    if (prevClientName) prevClientName.textContent = clientName;

    const prevClientInfo = document.getElementById('prev-client-info');
    if (prevClientInfo) prevClientInfo.textContent = clientCompany || 'Personal';

    // Render items table body
    const prevItemsBody = document.getElementById('prev-items-body');
    if (prevItemsBody) {
      if (items.length === 0 || (items.length === 1 && !items[0].desc)) {
        prevItemsBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:12px; color:#94a3b8;">Belum ada item ditambahkan.</td></tr>`;
      } else {
        prevItemsBody.innerHTML = items.map(item => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px; font-size:10px; color:#0f172a; white-space:pre-line;">${escapeHtml(item.desc || '—')}</td>
            <td style="padding:8px; font-size:10px; color:#475569; text-align:center;">${item.qty}</td>
            <td style="padding:8px; font-size:10px; color:#475569; text-align:right;">${this.formatIDR(item.price)}</td>
            <td style="padding:8px; font-size:10px; font-weight:700; color:#0f172a; text-align:right;">${this.formatIDR(item.total)}</td>
          </tr>
        `).join('');
      }
    }

    // Render calculations
    const prevSubtotal = document.getElementById('prev-subtotal');
    if (prevSubtotal) prevSubtotal.textContent = this.formatIDR(subtotal);

    const prevDiscountRow = document.getElementById('prev-discount-row');
    const prevDiscount = document.getElementById('prev-discount');
    if (prevDiscountRow && prevDiscount) {
      if (discountAmount > 0) {
        prevDiscountRow.style.display = 'flex';
        prevDiscount.textContent = '-' + this.formatIDR(discountAmount);
      } else {
        prevDiscountRow.style.display = 'none';
      }
    }

    const prevTaxRow = document.getElementById('prev-tax-row');
    const prevTax = document.getElementById('prev-tax');
    if (prevTaxRow && prevTax) {
      if (taxAmount > 0) {
        prevTaxRow.style.display = 'flex';
        prevTax.textContent = '+' + this.formatIDR(taxAmount);
      } else {
        prevTaxRow.style.display = 'none';
      }
    }

    const prevTotal = document.getElementById('prev-total');
    if (prevTotal) prevTotal.textContent = this.formatIDR(total);

    const prevNotes = document.getElementById('prev-notes');
    if (prevNotes) prevNotes.textContent = paymentNotes;
  }

  openCommandMenu() {
    openModal(`
      <div class="modal-header">
        <h2>Create</h2>
        <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:8px;">
        <button class="btn btn-secondary" id="quick-new-invoice" style="justify-content:flex-start; padding:12px 14px;">
          <i data-lucide="receipt" style="color:var(--accent-primary);"></i>
          <div style="text-align:left; margin-left:6px;">
            <strong>Invoice</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Create a professional invoice for a client.</div>
          </div>
        </button>

        <button class="btn btn-secondary" id="quick-new-proposal" style="justify-content:flex-start; padding:12px 14px;">
          <i data-lucide="file-text" style="color:var(--info);"></i>
          <div style="text-align:left; margin-left:6px;">
            <strong>Proposal</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Send a polished project proposal.</div>
          </div>
        </button>

        <button class="btn btn-secondary" id="quick-new-reminder" style="justify-content:flex-start; padding:12px 14px;">
          <i data-lucide="bell" style="color:var(--warning);"></i>
          <div style="text-align:left; margin-left:6px;">
            <strong>Reminder</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Never miss a follow-up or payment deadline.</div>
          </div>
        </button>

        <button class="btn btn-secondary" id="quick-new-client" style="justify-content:flex-start; padding:12px 14px;">
          <i data-lucide="user-plus" style="color:var(--success);"></i>
          <div style="text-align:left; margin-left:6px;">
            <strong>Client</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">Add a new client contact.</div>
          </div>
        </button>
      </div>
    `);

    document.getElementById('quick-new-invoice')?.addEventListener('click', async () => { closeModal(); openModal(await getInvoiceFormModalHTML()); this.attachInvoiceFormEvents(); });
    document.getElementById('quick-new-proposal')?.addEventListener('click', async () => { closeModal(); openModal(await getProposalFormModalHTML()); this.attachProposalFormEvents(); });
    document.getElementById('quick-new-client')?.addEventListener('click', () => { closeModal(); openModal(getClientModalHTML()); this.attachClientFormEvents(); });
    document.getElementById('quick-new-reminder')?.addEventListener('click', () => { closeModal(); openModal(getReminderFormModalHTML()); this.attachReminderFormEvents(); });
  }

  setupEventListeners() {
    // Theme Switch
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      const nextTheme = ApiService.getTheme() === 'dark' ? 'light' : 'dark';
      ApiService.setTheme(nextTheme);
      this.updateThemeIcon(nextTheme);
      showToast(`Switched to ${nextTheme} theme`, 'info');
    });

    // Mobile Sidebar Toggle & Drawer Overlay
    const sidebarEl = document.getElementById('sidebar');
    const overlayEl = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const closeBtn = document.getElementById('btn-close-sidebar');

    const toggleSidebar = () => {
      if (sidebarEl) sidebarEl.classList.toggle('mobile-open');
      if (overlayEl) overlayEl.classList.toggle('active');
    };

    const closeSidebar = () => {
      if (sidebarEl) {
        sidebarEl.classList.remove('mobile-open', 'open', 'active');
        if (sidebarEl.style.display === 'none' && !['landing', 'login', 'register', 'terms', 'privacy', 'contact', 'refund'].includes(this.currentPage)) {
          sidebarEl.style.display = '';
        }
      }
      if (overlayEl) {
        overlayEl.classList.remove('active', 'open', 'mobile-open', 'show');
      }
    };

    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });

    overlayEl?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        closeSidebar();
      }
    });

    // Nav Links (Desktop & Mobile Bottom Nav)
    document.querySelectorAll('.nav-item, .mobile-nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) {
          this.router.navigate(`/app/${page}`);
          closeSidebar();
        }
      });
    });

    // Mobile Bottom Nav Menu Trigger
    document.getElementById('btn-mobile-menu-trigger')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    // Global Create Button
    document.getElementById('btn-global-add')?.addEventListener('click', () => {
      openCommandPalette(this);
    });

    // Logout Button
    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(`
        <div class="modal-body" style="padding:32px 28px 28px; text-align:center;">
          <div style="width:52px; height:52px; margin:0 auto 18px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--danger-bg); color:var(--danger);">
            <i data-lucide="log-out" style="width:24px; height:24px;"></i>
          </div>
          <h2 style="margin:0 0 10px; color:var(--text-main); font-size:1.15rem; font-weight:700; letter-spacing:-0.02em;">Keluar dari SoloSuite?</h2>
          <p style="margin:0; color:var(--text-muted); font-size:0.9rem; line-height:1.55;">Sesi Anda akan diakhiri. Anda harus masuk kembali untuk mengakses data Anda nanti.</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:26px;">
            <button type="button" class="btn btn-secondary modal-close">Batal</button>
            <button type="button" class="btn btn-danger" id="btn-confirm-logout">Ya, Keluar</button>
          </div>
        </div>
      `);

      document.getElementById('btn-confirm-logout')?.addEventListener('click', async (event) => {
        const confirmButton = event.currentTarget;
        if (confirmButton.disabled) return;
        confirmButton.disabled = true;
        confirmButton.textContent = 'Keluar...';

        try {
          await signOut();
        } catch (err) {
          // ignore signout errors if session was already invalidated
        }
        ApiService.saveUser({});
        localStorage.clear();
        closeModal();
        showToast('Berhasil keluar', 'info');
        this.router.navigate('/');
      });
    });

    // Klik Profile Row di Sidebar untuk Buka Settings Modal
    document.querySelector('.user-profile-row')?.addEventListener('click', (e) => {
      if (e.target.closest('#btn-logout')) return; // Abaikan jika tombol logout yang diklik
      
      const currentUser = ApiService.getUser();
      openModal(getSettingsModalHTML(currentUser));
      this.attachSettingsFormEvents();
    });
  }

  async syncUserCache(user) {
    if (!user) {
      ApiService.saveUser({});
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const existingCache = ApiService.getUser() || {};
    const userData = {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.user_metadata?.full_name || existingCache.name || user.email.split('@')[0],
      company: profile?.company || existingCache.company || '',
      phone: profile?.phone || existingCache.phone || '',
      address: profile?.address || existingCache.address || '',
      npwp: profile?.npwp || existingCache.npwp || '',
      plan: profile?.plan ? (profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)) : 'Free',
      subscription_status: profile?.subscription_status || 'active',
      avatar: (profile?.full_name || user.email).slice(0, 2).toUpperCase(),
      // Data Rekening Bank Dinamis
      bankName: profile?.bank_name || existingCache.bankName || '',
      bankAccountNumber: profile?.bank_account_number || existingCache.bankAccountNumber || '',
      bankAccountName: profile?.bank_account_name || profile?.full_name || existingCache.bankAccountName || ''
    };
    ApiService.saveUser(userData);
  }

  updateLayoutVisibility(page, isAuthenticated) {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');
    const topHeader = document.querySelector('.top-header');
    const mainContent = document.getElementById('main-content');
    const mobileBottomNav = document.getElementById('mobile-bottom-nav');

    const publicPages = ['landing', 'login', 'register', 'terms', 'privacy', 'contact', 'refund'];
    const isFullBleedPage = publicPages.includes(page) || (page === 'pricing' && !isAuthenticated);

    if (isFullBleedPage) {
      if (sidebar) sidebar.style.display = 'none';
      if (topHeader) topHeader.style.display = 'none';
      if (mobileBottomNav) mobileBottomNav.style.display = 'none';
      if (mainWrapper) {
        mainWrapper.style.marginLeft = '0';
        mainWrapper.style.width = '100%';
      }
      if (mainContent) {
        mainContent.style.padding = '0';
        mainContent.style.maxWidth = '100%';
        mainContent.style.width = '100%';
      }
    } else {
      if (sidebar) sidebar.style.display = '';
      if (topHeader) topHeader.style.display = '';
      if (mobileBottomNav) mobileBottomNav.style.display = '';
      if (mainWrapper) {
        mainWrapper.style.marginLeft = '';
        mainWrapper.style.width = '';
      }
      if (mainContent) {
        mainContent.style.padding = '';
        mainContent.style.maxWidth = '';
        mainContent.style.width = '';
      }
    }
  }

  async handleNavigation(page, { isAuthenticated, user }) {
    const navigationVersion = this.currentPage === page
      ? this.navigationVersion
      : this.prepareNavigation(page);

    // Profile data is nice-to-have for the shell, but must never delay a route
    // paint. The active view will use the existing cache until it is refreshed.
    void this.refreshUserCache(user).then(() => {
      if (navigationVersion === this.navigationVersion) this.updateShellUser();
    }).catch(() => {});

    // Update active state in sidebar nav menu & mobile bottom navigation
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(i => {
      if (i.getAttribute('data-page') === page) {
        i.classList.add('active');
      } else {
        i.classList.remove('active');
      }
    });

    this.updateLayoutVisibility(page, isAuthenticated);
    await this.render(isAuthenticated, user, navigationVersion);
  }

  updateShellUser() {
    const currentUser = ApiService.getUser();
    if (!currentUser?.name) return;
    const userDisplayNameEl = document.getElementById('user-display-name');
    const userPlanEl = document.getElementById('user-display-plan');
    const avatarEl = document.getElementById('user-avatar-text');
    if (userDisplayNameEl) userDisplayNameEl.textContent = currentUser.name;
    if (userPlanEl) userPlanEl.textContent = currentUser.plan || 'Free';
    if (avatarEl) avatarEl.textContent = currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase();
  }

  refreshUserCache(user) {
    if (!user) {
      this.profileSyncUserId = null;
      this.profileSyncPromise = null;
      return this.syncUserCache(null);
    }
    if (this.profileSyncUserId !== user.id) {
      this.profileSyncUserId = user.id;
      this.profileSyncPromise = this.syncUserCache(user).catch((error) => {
        this.profileSyncUserId = null;
        throw error;
      });
    }
    return this.profileSyncPromise;
  }

  prepareNavigation(page) {
    this.currentPage = page;
    const navigationVersion = ++this.navigationVersion;
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return navigationVersion;

    const skeleton = page === 'dashboard'
      ? getDashboardSkeletonHTML()
      : ['invoices', 'proposals', 'reminders', 'clients'].includes(page)
        ? getSkeletonHTML(page)
        : null;
    if (skeleton) this.mountView(mainContent, skeleton);
    return navigationVersion;
  }

  mountView(mainContent, html, { icons = true } = {}) {
    // Replacing the subtree releases every page-scoped handler with its old DOM.
    // It also prevents an old route from retaining interactive controls.
    mainContent.innerHTML = html;
    initCustomDropdowns(mainContent);
    if (icons) this.queueIconRender();
    this.animatePageContent(mainContent);
  }

  queueIconRender() {
    if (this.iconRenderFrame) cancelAnimationFrame(this.iconRenderFrame);
    this.iconRenderFrame = requestAnimationFrame(() => {
      this.iconRenderFrame = null;
      if (window.lucide) window.lucide.createIcons();
    });
  }

  animatePageContent(mainContent) {
    if (this.pageAnimationFrame) cancelAnimationFrame(this.pageAnimationFrame);
    mainContent.classList.remove('page-content-enter');
    this.pageAnimationFrame = requestAnimationFrame(() => {
      this.pageAnimationFrame = null;
      if (mainContent.isConnected) mainContent.classList.add('page-content-enter');
    });
  }

  async render(isAuthenticated, user, navigationVersion = this.navigationVersion) {
    const mainContent = document.getElementById('main-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const mobilePageTitle = document.getElementById('mobile-page-title');
    const currentUser = ApiService.getUser();

    if (isAuthenticated && currentUser?.name) {
      this.updateShellUser();
    }

    // Header Headings
    const pageHeadings = {
      dashboard: { title: `Good day, ${(currentUser?.name || 'Freelancer').split(' ')[0]}.`, sub: 'Here’s what needs your attention.' },
      invoices: { title: 'Invoices', sub: 'Manage billing and track client payments.' },
      proposals: { title: 'Proposals', sub: 'Send project estimates and track client approvals.' },
      reminders: { title: 'Reminders', sub: 'Schedule follow-ups and never miss a payment deadline.' },
      clients: { title: 'Clients', sub: 'Your client relationships and contact directory.' },
      pricing: { title: 'Plan', sub: 'Simple, predictable pricing for your freelance business.' }
    };

    const mobileTitles = {
      dashboard: 'Dashboard',
      invoices: 'Invoices',
      proposals: 'Proposals',
      reminders: 'Reminders',
      clients: 'Clients',
      pricing: 'Plan'
    };

    if (pageHeadings[this.currentPage]) {
      if (pageTitle) pageTitle.textContent = pageHeadings[this.currentPage].title;
      if (pageSubtitle) pageSubtitle.textContent = pageHeadings[this.currentPage].sub;
    }

    if (mobilePageTitle) {
      mobilePageTitle.textContent = mobileTitles[this.currentPage] || 'SoloSuite';
    }

    // Render Views
    switch (this.currentPage) {
      case 'landing':
        this.mountView(mainContent, renderLandingPage(isAuthenticated));
        this.attachLandingEvents(isAuthenticated);
        break;
      case 'login':
        this.mountView(mainContent, renderAuthPage(false));
        attachAuthPageEvents(false, async () => {
          await this.onLoginSuccess();
        }, (path) => this.router.navigate(path));
        break;
      case 'register':
        this.mountView(mainContent, renderAuthPage(true));
        attachAuthPageEvents(true, async () => {
          await this.onLoginSuccess();
        }, (path) => this.router.navigate(path));
        break;
      case 'dashboard':
        this.mountView(mainContent, getDashboardSkeletonHTML(), { icons: false });
        const dashboardHTML = await renderDashboard(formatIDR);
        if (navigationVersion !== this.navigationVersion) return;
        this.mountView(mainContent, dashboardHTML);
        await this.attachDashboardEvents();
        break;
      case 'clients':
        this.mountView(mainContent, getSkeletonHTML('clients'), { icons: false });
        const clientsHTML = await renderClientsView();
        if (navigationVersion !== this.navigationVersion) return;
        this.mountView(mainContent, clientsHTML);
        await this.attachClientsViewEvents();
        break;
      case 'invoices':
        this.mountView(mainContent, getSkeletonHTML('invoices'), { icons: false });
        const invoicesHTML = await renderInvoicesView(formatIDR);
        if (navigationVersion !== this.navigationVersion) return;
        this.mountView(mainContent, invoicesHTML);
        await this.attachInvoicesViewEvents();
        break;
      case 'proposals':
        this.mountView(mainContent, getSkeletonHTML('proposals'), { icons: false });
        const proposalsHTML = await renderProposalsView(formatIDR);
        if (navigationVersion !== this.navigationVersion) return;
        this.mountView(mainContent, proposalsHTML);
        await this.attachProposalsViewEvents();
        break;
      case 'reminders':
        this.mountView(mainContent, getSkeletonHTML('reminders'), { icons: false });
        const remindersHTML = await renderRemindersView();
        if (navigationVersion !== this.navigationVersion) return;
        this.mountView(mainContent, remindersHTML);
        await this.attachRemindersViewEvents();
        break;
      case 'pricing':
        this.mountView(mainContent, renderPricingView(isAuthenticated));
        this.attachPricingViewEvents(isAuthenticated);
        
        mainContent.querySelectorAll('.nav-link-pricing').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-path');
            if (path) this.router.navigate(path);
          });
        });
        break;
      case 'terms':
        this.mountView(mainContent, renderTermsPage(isAuthenticated));
        this.attachPublicPageEvents();
        break;
      case 'privacy':
        this.mountView(mainContent, renderPrivacyPage(isAuthenticated));
        this.attachPublicPageEvents();
        break;
      case 'contact':
        this.mountView(mainContent, renderContactPage(isAuthenticated));
        this.attachPublicPageEvents();
        break;
      case 'refund':
        this.mountView(mainContent, renderRefundPage(isAuthenticated));
        this.attachPublicPageEvents();
        break;
    }

  }

  attachLandingEvents(isAuthenticated = false) {
    const pageRoot = document.getElementById('main-content');
    if (!pageRoot) return;
    this.attachPricingViewEvents(isAuthenticated);

    // Smooth scroll for landing anchor links (#features, #pricing)
    pageRoot.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href && href.length > 1) {
          const targetEl = document.getElementById(href.slice(1));
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    const landingThemeBtn = document.getElementById('btn-landing-theme-toggle');
    if (landingThemeBtn) {
      const currentTheme = ApiService.getTheme();
      const icon = document.getElementById('landing-theme-icon');
      if (icon) {
        icon.setAttribute('data-lucide', currentTheme === 'dark' ? 'sun' : 'moon');
      }
      landingThemeBtn.addEventListener('click', () => {
        const nextTheme = ApiService.getTheme() === 'dark' ? 'light' : 'dark';
        ApiService.setTheme(nextTheme);
        this.updateThemeIcon(nextTheme);
        if (icon) icon.setAttribute('data-lucide', nextTheme === 'dark' ? 'sun' : 'moon');
        if (window.lucide) window.lucide.createIcons();
        showToast(`Switched to ${nextTheme} theme`, 'info');
      });
    }

    // Interactive Mini Generator Live Preview Listeners
    const clientInput = document.getElementById('demo-input-client');
    const titleInput = document.getElementById('demo-input-title');
    const amountInput = document.getElementById('demo-input-amount');

    const clientDisplay = document.getElementById('demo-preview-client-display');
    const titleDisplay = document.getElementById('demo-preview-title-display');
    const amountDisplay = document.getElementById('demo-preview-amount-display');

    const updateLiveDemo = () => {
      if (clientDisplay && clientInput) {
        clientDisplay.textContent = clientInput.value.trim() || 'Nama Klien Anda';
      }
      if (titleDisplay && titleInput) {
        titleDisplay.textContent = titleInput.value.trim() || 'Deskripsi Pekerjaan Invoice';
      }
      if (amountDisplay && amountInput) {
        const val = parseFloat(amountInput.value) || 0;
        amountDisplay.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
      }
    };

    if (clientInput) clientInput.addEventListener('input', updateLiveDemo);
    if (titleInput) titleInput.addEventListener('input', updateLiveDemo);
    if (amountInput) amountInput.addEventListener('input', updateLiveDemo);

    // FAQ Accordion Toggles
    pageRoot.querySelectorAll('.faq-accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-accordion-item');
        const isOpen = item.classList.contains('active');
        
        pageRoot.querySelectorAll('.faq-accordion-item').forEach(el => {
          el.classList.remove('active');
          const t = el.querySelector('.faq-accordion-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    pageRoot.querySelectorAll('[data-path]').forEach(link => {
      link.addEventListener('click', (e) => {
        const path = link.getAttribute('data-path');
        if (path) {
          e.preventDefault();
          this.router.navigate(path);
        }
      });
    });
  }

  attachPublicPageEvents() {
    const pageRoot = document.getElementById('main-content');
    if (!pageRoot) return;

    const themeBtn = document.getElementById('btn-public-theme-toggle');
    if (themeBtn) {
      const currentTheme = ApiService.getTheme();
      const icon = document.getElementById('public-theme-icon');
      if (icon) icon.setAttribute('data-lucide', currentTheme === 'dark' ? 'sun' : 'moon');

      themeBtn.addEventListener('click', () => {
        const nextTheme = ApiService.getTheme() === 'dark' ? 'light' : 'dark';
        ApiService.setTheme(nextTheme);
        this.updateThemeIcon(nextTheme);
        if (icon) icon.setAttribute('data-lucide', nextTheme === 'dark' ? 'sun' : 'moon');
        if (window.lucide) window.lucide.createIcons();
        showToast(`Switched to ${nextTheme} theme`, 'info');
      });
    }

    pageRoot.querySelectorAll('[data-path]').forEach(link => {
      link.addEventListener('click', (e) => {
        const path = link.getAttribute('data-path');
        if (path) {
          e.preventDefault();
          this.router.navigate(path);
        }
      });
    });
  }

  async onLoginSuccess() {
    const user = await getCurrentUser();
    await this.syncUserCache(user);
    this.profileSyncUserId = user?.id || null;
    this.profileSyncPromise = Promise.resolve();

    const pendingPlanStr = localStorage.getItem('pending_plan');
    if (pendingPlanStr) {
      localStorage.removeItem('pending_plan');
      const { planName, planAmount } = JSON.parse(pendingPlanStr);
      this.router.navigate('/app/pricing');
      setTimeout(() => {
        this.triggerMidtransCheckout(planName, planAmount);
      }, 400);
    } else {
      this.router.navigate('/app');
    }
  }

  // Dashboard Events
  async attachDashboardEvents() {
    document.getElementById('btn-goto-invoices')?.addEventListener('click', () => {
      this.router.navigate('/app/invoices');
    });

    document.getElementById('btn-create-first-invoice-dashboard')?.addEventListener('click', async () => {
      const invoices = await ApiService.getInvoices();
      const user = ApiService.getUser();
      const limits = checkPlanLimits(user.plan, { invoicesCount: countItemsCreatedThisMonth(invoices) });
      if (!limits.canAddInvoice) {
        showToast('Batas paket Free tercapai (Maks 5 Invoice). Silakan upgrade ke Starter/Pro untuk menambah lebih banyak.', 'error');
        return;
      }
      openModal(await getInvoiceFormModalHTML());
      this.attachInvoiceFormEvents();
    });

    document.getElementById('btn-add-reminder-quick')?.addEventListener('click', () => {
      openModal(getReminderFormModalHTML());
      this.attachReminderFormEvents();
    });
  }

  // Clients View Events
  async attachClientsViewEvents() {
    const clients = await ApiService.getClients();
    const invoices = await ApiService.getInvoices();
    const proposals = await ApiService.getProposals();

    const handleAdd = () => {
      const user = ApiService.getUser();
      const limits = checkPlanLimits(user.plan, { clientsCount: clients.length });
      if (!limits.canAddClient) {
        showToast('Batas paket Free tercapai (Maks 3 Klien). Silakan upgrade ke Starter/Pro untuk menambah lebih banyak.', 'error');
        return;
      }
      openModal(getClientModalHTML());
      this.attachClientFormEvents();
    };

    document.getElementById('btn-add-client')?.addEventListener('click', handleAdd);
    document.getElementById('btn-add-client-empty')?.addEventListener('click', handleAdd);

    // CRM Details Sheet Hook
    document.querySelectorAll('.btn-crm-details').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const client = clients.find(c => String(c.id) === String(id));
        if (!client) return;

        openModal(getClientDetailModalHTML(client, invoices, proposals, this.formatIDR));

        // Tab swapping listeners
        const tabBtns = document.querySelectorAll('.crm-tab-btn');
        tabBtns.forEach(tBtn => {
          tBtn.addEventListener('click', () => {
            tabBtns.forEach(b => {
              b.classList.remove('active');
              b.style.color = 'var(--text-muted)';
              b.style.borderBottom = 'none';
            });
            tBtn.classList.add('active');
            tBtn.style.color = 'var(--text-primary)';
            tBtn.style.borderBottom = '2px solid var(--text-primary)';

            const tab = tBtn.dataset.tab;
            document.getElementById('crm-tab-content-invoices').style.display = tab === 'invoices' ? 'block' : 'none';
            document.getElementById('crm-tab-content-proposals').style.display = tab === 'proposals' ? 'block' : 'none';
          });
        });

        // Click handlers on invoices or proposals rows in CRM sheet to view them
        document.querySelectorAll('.crm-row-click').forEach(row => {
          row.addEventListener('click', async () => {
            const type = row.dataset.type;
            const itemId = row.dataset.id;
            
            if (type === 'invoice') {
              const inv = invoices.find(i => String(i.id) === String(itemId));
              if (inv) {
                openModal(await getInvoicePreviewModalHTML(inv, this.formatIDR));
                // Bind PDF and copy buttons for preview
                document.getElementById('btn-copy-link-preview')?.addEventListener('click', () => {
                  const url = `${window.location.origin}/invoice-generator?inv=${encodeURIComponent(inv.invoiceNumber)}`;
                  navigator.clipboard.writeText(url).then(() => showToast('Link invoice berhasil disalin', 'success'));
                });
                document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
                  const element = document.getElementById('invoice-printable-area');
                  if (window.html2pdf && element) {
                    window.html2pdf().set({
                      margin: 10,
                      filename: `${inv.invoiceNumber}.pdf`,
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    }).from(element).save();
                  } else {
                    window.print();
                  }
                });
              }
            } else if (type === 'proposal') {
              const prop = proposals.find(p => String(p.id) === String(itemId));
              if (prop) {
                openModal(await getProposalPreviewModalHTML(prop, this.formatIDR));
                // Bind PDF and copy buttons for preview
                document.getElementById('btn-copy-link-preview')?.addEventListener('click', () => {
                  const url = `${window.location.origin}/proposal-view?id=${encodeURIComponent(prop.id)}`;
                  navigator.clipboard.writeText(url).then(() => showToast('Link proposal berhasil disalin', 'success'));
                });
                document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
                  const element = document.getElementById('proposal-printable-area');
                  if (window.html2pdf && element) {
                    window.html2pdf().set({
                      margin: 10,
                      filename: `${prop.title}.pdf`,
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    }).from(element).save();
                  } else {
                    window.print();
                  }
                });
              }
            }
          });
        });

        // Quick create invoice for client
        document.querySelector('.btn-crm-quick-invoice')?.addEventListener('click', async () => {
          openModal(await getInvoiceFormModalHTML({ clientId: client.id }));
          this.attachInvoiceFormEvents();
        });

        // Quick create proposal for client
        document.querySelector('.btn-crm-quick-proposal')?.addEventListener('click', async () => {
          openModal(await getProposalFormModalHTML({ clientId: client.id }));
          this.attachProposalFormEvents();
        });
      });
    });

    document.querySelectorAll('.btn-edit-client').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const client = clients.find(c => String(c.id) === String(id));
        openModal(getClientModalHTML(client || {}));
        this.attachClientFormEvents();
      });
    });

    document.querySelectorAll('.btn-delete-client').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const client = clients.find(c => String(c.id) === String(id));
        const clientName = client?.name ? `"${client.name}"` : 'klien ini';

        showConfirmModal({
          title: 'Hapus Klien?',
          message: `Apakah Anda yakin ingin menghapus ${clientName}? Data klien ini akan dihapus secara permanen.`,
          confirmText: 'Hapus Klien',
          confirmType: 'danger',
          icon: 'user-x',
          onConfirm: async () => {
            try {
              await ApiService.deleteClient(id);
              showToast('Client deleted', 'danger');
              await this.render(true, await getCurrentUser());
            } catch (err) {
              showToast(err.message || 'Error deleting client', 'danger');
            }
          }
        });
      });
    });
  }

  attachClientFormEvents() {
    const form = document.getElementById('form-client');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Save Client';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.status = 'active';

        await ApiService.saveClient(data);
        closeModal();
        showToast('Saved successfully!', 'success');
        await this.render(true, await getCurrentUser(), this.navigationVersion);
      } catch (err) {
        showToast(`Error: ${err.message || 'Terjadi kesalahan saat menyimpan data client.'}`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Invoices View Events
  async attachInvoicesViewEvents() {
    const invoices = await ApiService.getInvoices();

    const handleAdd = async () => {
      const user = ApiService.getUser();
      const limits = checkPlanLimits(user.plan, { invoicesCount: countItemsCreatedThisMonth(invoices) });
      if (!limits.canAddInvoice) {
        showToast('Batas paket Free tercapai (Maks 5 Invoice). Silakan upgrade ke Starter/Pro untuk menambah lebih banyak.', 'error');
        return;
      }
      openModal(await getInvoiceFormModalHTML());
      this.attachInvoiceFormEvents();
    };

    document.getElementById('btn-add-invoice')?.addEventListener('click', handleAdd);
    document.getElementById('btn-add-invoice-empty')?.addEventListener('click', handleAdd);

    // Duplikasi Invoice Hook
    document.querySelectorAll('.btn-duplicate-invoice').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const invoice = invoices.find(i => String(i.id) === String(id));
        if (!invoice) return;

        // Prefill form but generate a new number and remove IDs
        const dupInvoice = {
          ...invoice,
          id: '',
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
        };

        openModal(await getInvoiceFormModalHTML(dupInvoice));
        this.attachInvoiceFormEvents();
        showToast('Invoice diduplikasi. Silakan simpan untuk membuat data baru.', 'info');
      });
    });

    // Filtering & Searching implementation
    const searchInput = document.getElementById('invoice-search');
    const sortSelect = document.getElementById('invoice-sort');
    const tabButtons = document.querySelectorAll('.invoice-tabs-row .tab-btn');
    const tableBody = document.getElementById('invoices-table-body');
    const rows = Array.from(document.querySelectorAll('.invoice-row-item'));

    let currentFilterStatus = 'all';
    let searchQuery = '';

    const filterList = () => {
      let visibleCount = 0;
      rows.forEach(row => {
        const rowStatus = row.dataset.status.toLowerCase();
        const number = row.dataset.number.toLowerCase();
        const client = row.dataset.client.toLowerCase();
        const desc = row.dataset.desc.toLowerCase();

        const matchesStatus = currentFilterStatus === 'all' || rowStatus === currentFilterStatus;
        const matchesSearch = !searchQuery || number.includes(searchQuery) || client.includes(searchQuery) || desc.includes(searchQuery);

        if (matchesStatus && matchesSearch) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      // Handle empty row if all hidden
      let emptyRow = document.getElementById('invoices-empty-row');
      if (!emptyRow && visibleCount === 0) {
        emptyRow = document.createElement('tr');
        emptyRow.id = 'invoices-empty-row';
        emptyRow.innerHTML = `
          <td colspan="7">
            <div class="empty-state" style="padding:20px;">
              <p style="margin:0; color:var(--text-muted);">Tidak ada invoice yang cocok dengan kriteria pencarian.</p>
            </div>
          </td>
        `;
        tableBody.appendChild(emptyRow);
      } else if (emptyRow && visibleCount > 0) {
        emptyRow.remove();
      }
    };

    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterList();
    });

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilterStatus = btn.dataset.status.toLowerCase();
        filterList();
      });
    });

    sortSelect?.addEventListener('change', () => {
      const sortValue = sortSelect.value;
      const sortedRows = rows.sort((a, b) => {
        if (sortValue === 'newest') {
          return b.dataset.number.localeCompare(a.dataset.number);
        } else if (sortValue === 'oldest') {
          return a.dataset.number.localeCompare(b.dataset.number);
        } else if (sortValue === 'highest') {
          return parseFloat(b.dataset.amount) - parseFloat(a.dataset.amount);
        } else if (sortValue === 'lowest') {
          return parseFloat(a.dataset.amount) - parseFloat(b.dataset.amount);
        }
        return 0;
      });

      sortedRows.forEach(row => tableBody.appendChild(row));
    });

    document.querySelectorAll('.btn-copy-invoice-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const number = btn.getAttribute('data-number') || '';
        const url = `${window.location.origin}/invoice-generator?inv=${encodeURIComponent(number)}`;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link invoice berhasil disalin ke clipboard', 'success');
        }).catch(() => {
          showToast('Link invoice berhasil disalin ke clipboard', 'success');
        });
      });
    });

    document.querySelectorAll('.btn-send-whatsapp-invoice').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const invoice = invoices.find(i => String(i.id) === String(id));
        if (!invoice) return;
        const clientsList = await ApiService.getClients();
        const client = clientsList.find(c => String(c.id) === String(invoice.clientId)) || { name: 'Klien' };

        const waUrl = buildWhatsAppInvoiceUrl(invoice, client, formatIDR);
        showToast('Membuka WhatsApp...', 'info');
        window.open(waUrl, '_blank');
      });
    });

    document.querySelectorAll('.btn-edit-invoice').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const invoice = invoices.find(i => String(i.id) === String(id));
        openModal(await getInvoiceFormModalHTML(invoice || {}));
        this.attachInvoiceFormEvents();
      });
    });

    document.querySelectorAll('.btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const invoice = invoices.find(i => String(i.id) === String(id));
        openModal(await getInvoicePreviewModalHTML(invoice || {}, formatIDR));

        document.getElementById('btn-copy-link-preview')?.addEventListener('click', () => {
          const number = invoice.invoiceNumber || '';
          const url = `${window.location.origin}/invoice-generator?inv=${encodeURIComponent(number)}`;
          navigator.clipboard.writeText(url).then(() => {
            showToast('Link invoice berhasil disalin ke clipboard', 'success');
          }).catch(() => {
            showToast('Link invoice berhasil disalin ke clipboard', 'success');
          });
        });

        document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
          const element = document.getElementById('invoice-printable-area');
          if (window.html2pdf && element) {
            showToast('Generating PDF...', 'info');
            const opt = {
              margin: 10,
              filename: `${invoice.invoiceNumber}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            window.html2pdf().set(opt).from(element).save();
          } else {
            window.print();
          }
        });
      });
    });

    document.querySelectorAll('.btn-delete-invoice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const inv = invoices.find(i => String(i.id) === String(id));
        const invoiceNum = inv?.invoiceNumber ? `Invoice #${inv.invoiceNumber}` : 'invoice ini';

        showConfirmModal({
          title: 'Hapus Invoice?',
          message: `Apakah Anda yakin ingin menghapus ${invoiceNum}? Data invoice yang dihapus tidak dapat dipulihkan.`,
          confirmText: 'Hapus Invoice',
          confirmType: 'danger',
          icon: 'receipt',
          onConfirm: async () => {
            try {
              await ApiService.deleteInvoice(id);
              showToast('Invoice deleted', 'danger');
              await this.render(true, await getCurrentUser());
            } catch (err) {
              showToast(err.message || 'Error deleting invoice', 'danger');
            }
          }
        });
      });
    });
  }

  attachInvoiceFormEvents() {
    const itemsContainer = document.getElementById('invoice-items-container');
    const addItemBtn = document.getElementById('btn-add-item-row');

    const updatePreviewTrigger = () => {
      this.updateFormRealtimePreview();
    };

    if (addItemBtn && itemsContainer) {
      addItemBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.style.cssText = 'display:grid; grid-template-columns: 3fr 1fr 2fr 34px; gap:8px; margin-bottom:8px; align-items:center;';
        row.innerHTML = `
          <input type="text" class="form-control item-desc" name="item_desc[]" placeholder="Deskripsi pekerjaan" required>
          <input type="number" class="form-control item-qty" name="item_qty[]" placeholder="Qty" value="1" min="1" required>
          <input type="number" class="form-control item-price" name="item_price[]" placeholder="Harga" value="0" min="0" required>
          <button type="button" class="btn-icon btn-remove-item-row" style="color:var(--danger); border:none;" aria-label="Remove"><i data-lucide="trash-2"></i></button>
        `;
        itemsContainer.appendChild(row);
        if (window.lucide) window.lucide.createIcons();

        // Listen for preview updates
        row.querySelectorAll('input').forEach(input => {
          input.addEventListener('input', updatePreviewTrigger);
        });

        row.querySelector('.btn-remove-item-row')?.addEventListener('click', () => {
          if (itemsContainer.querySelectorAll('.item-row').length > 1) {
            row.remove();
            updatePreviewTrigger();
          } else {
            showToast('Invoice harus memiliki minimal 1 item', 'warning');
          }
        });

        updatePreviewTrigger();
      });
    }

    itemsContainer?.querySelectorAll('.btn-remove-item-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.item-row');
        if (itemsContainer.querySelectorAll('.item-row').length > 1) {
          row?.remove();
          updatePreviewTrigger();
        } else {
          showToast('Invoice harus memiliki minimal 1 item', 'warning');
        }
      });
    });

    const form = document.getElementById('form-invoice');
    if (!form) return;

    // Attach real-time input event listeners
    form.addEventListener('input', updatePreviewTrigger);
    form.addEventListener('change', updatePreviewTrigger);
    
    // Custom dropdown hooks
    form.querySelectorAll('.custom-dropdown-option').forEach(option => {
      option.addEventListener('click', () => {
        setTimeout(updatePreviewTrigger, 50); // slight delay to let DOM select populate
      });
    });

    // Run initial preview compile
    setTimeout(updatePreviewTrigger, 100);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Save Invoice';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const descs = formData.getAll('item_desc[]');
        const qtys = formData.getAll('item_qty[]');
        const prices = formData.getAll('item_price[]');

        const items = descs.map((desc, i) => {
          const qty = parseFloat(qtys[i]) || 1;
          const price = parseFloat(prices[i]) || 0;
          return {
            desc,
            qty,
            price,
            total: qty * price
          };
        }).filter(item => item.desc.trim() !== '');

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxPercent = parseFloat(data.taxPercent) || 0;
        const discountPercent = parseFloat(data.discountPercent) || 0;

        const taxVal = subtotal * (taxPercent / 100);
        const discountVal = subtotal * (discountPercent / 100);
        const total = subtotal + taxVal - discountVal;

        data.items = items;
        data.subtotal = subtotal;
        data.taxPercent = taxPercent;
        data.discountPercent = discountPercent;
        data.total = total;

        await ApiService.saveInvoice(data);
        closeModal();
        showToast('Saved successfully!', 'success');
        await this.render(true, await getCurrentUser());
      } catch (err) {
        showToast(`Error: ${err.message || 'Gagal menyimpan invoice'}`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Proposals Events
  async attachProposalsViewEvents() {
    const proposals = await ApiService.getProposals();
    
    const handleAdd = async () => {
      const user = ApiService.getUser();
      const limits = checkPlanLimits(user.plan, { proposalsCount: countItemsCreatedThisMonth(proposals) });
      if (!limits.canAddProposal) {
        showToast('Batas paket Free tercapai (Maks 3 Proposal). Silakan upgrade ke Starter/Pro untuk menambah lebih banyak.', 'error');
        return;
      }
      openModal(await getProposalFormModalHTML());
      this.attachProposalFormEvents();
    };

    document.getElementById('btn-add-proposal')?.addEventListener('click', handleAdd);
    document.getElementById('btn-add-proposal-empty')?.addEventListener('click', handleAdd);

    // Convert Proposal to Invoice Hook
    document.querySelectorAll('.btn-convert-proposal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const proposal = proposals.find(p => String(p.id) === String(id));
        if (!proposal) return;

        // Populate invoice draft form details from proposal
        const convInvoice = {
          clientId: proposal.clientId,
          title: proposal.title,
          total: proposal.budget,
          items: [{
            desc: proposal.description || proposal.title,
            qty: 1,
            price: proposal.budget
          }]
        };

        openModal(await getInvoiceFormModalHTML(convInvoice));
        this.attachInvoiceFormEvents();
        showToast('Proposal diubah menjadi invoice draft. Lengkapi dan simpan untuk menerbitkan.', 'success');
      });
    });

    document.querySelectorAll('.btn-edit-proposal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const proposal = proposals.find(p => String(p.id) === String(id));
        openModal(await getProposalFormModalHTML(proposal || {}));
        this.attachProposalFormEvents();
      });
    });

    document.querySelectorAll('.btn-delete-proposal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const prop = proposals.find(p => String(p.id) === String(id));
        const propTitle = prop?.title ? `Proposal "${prop.title}"` : 'proposal ini';

        showConfirmModal({
          title: 'Hapus Proposal?',
          message: `Apakah Anda yakin ingin menghapus ${propTitle}? Data proposal ini tidak dapat dikembalikan.`,
          confirmText: 'Hapus Proposal',
          confirmType: 'danger',
          icon: 'file-x',
          onConfirm: async () => {
            try {
              await ApiService.deleteProposal(id);
              showToast('Proposal deleted', 'danger');
              await this.render(true, await getCurrentUser());
            } catch (err) {
              showToast(err.message || 'Error deleting proposal', 'danger');
            }
          }
        });
      });
    });
  }

  async handleProposalCardClick(id) {
    const proposals = await ApiService.getProposals();
    const proposal = proposals.find(p => String(p.id) === String(id));
    if (!proposal) return;

    openModal(await getProposalPreviewModalHTML(proposal, this.formatIDR));

    document.getElementById('btn-copy-proposal-link')?.addEventListener('click', () => {
      const url = `${window.location.origin}/proposal-view?id=${encodeURIComponent(proposal.id)}`;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link proposal berhasil disalin ke clipboard', 'success');
      }).catch(() => {
        showToast('Link proposal berhasil disalin ke clipboard', 'success');
      });
    });

    document.getElementById('btn-export-proposal-pdf')?.addEventListener('click', () => {
      const element = document.getElementById('proposal-printable-area');
      if (window.html2pdf && element) {
        showToast('Generating PDF...', 'info');
        const opt = {
          margin: 10,
          filename: `proposal-${proposal.title}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    });
  }

  attachProposalFormEvents() {
    const form = document.getElementById('form-proposal');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Save Proposal';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.budget = parseFloat(data.budget) || 0;

        await ApiService.saveProposal(data);
        closeModal();
        showToast('Saved successfully!', 'success');
        await this.render(true, await getCurrentUser());
      } catch (err) {
        showToast(`Error: ${err.message || 'Gagal menyimpan proposal'}`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Reminders Events
  async attachRemindersViewEvents() {
    const remindersList = await ApiService.getReminders();

    document.getElementById('btn-add-reminder')?.addEventListener('click', () => {
      openModal(getReminderFormModalHTML());
      this.attachReminderFormEvents();
    });

    document.getElementById('btn-add-reminder-empty')?.addEventListener('click', () => {
      openModal(getReminderFormModalHTML());
      this.attachReminderFormEvents();
    });

    document.querySelectorAll('.btn-complete-reminder').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const rem = remindersList.find(r => String(r.id) === String(id));
        if (rem) {
          rem.status = 'completed';
          await ApiService.saveReminder(rem);
          showToast('Reminder completed', 'success');
          await this.render(true, await getCurrentUser());
        }
      });
    });

    document.querySelectorAll('.btn-delete-reminder').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rem = remindersList.find(r => String(r.id) === String(id));
        const remTask = rem?.title || rem?.task ? `"${rem.title || rem.task}"` : 'pengingat ini';

        showConfirmModal({
          title: 'Hapus Pengingat?',
          message: `Apakah Anda yakin ingin menghapus pengingat ${remTask}?`,
          confirmText: 'Hapus Pengingat',
          confirmType: 'danger',
          icon: 'bell-off',
          onConfirm: async () => {
            try {
              await ApiService.deleteReminder(id);
              showToast('Reminder deleted', 'danger');
              await this.render(true, await getCurrentUser());
            } catch (err) {
              showToast(err.message || 'Error deleting reminder', 'danger');
            }
          }
        });
      });
    });
  }

  attachReminderFormEvents() {
    const form = document.getElementById('form-reminder');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Save Reminder';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.status = 'pending';

        await ApiService.saveReminder(data);
        closeModal();
        showToast('Saved successfully!', 'success');
        await this.render(true, await getCurrentUser());
      } catch (err) {
        showToast(`Error: ${err.message || 'Gagal menyimpan reminder'}`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Pricing Plan Events
  attachPricingViewEvents(isAuthenticated) {
    const pageRoot = document.getElementById('main-content');
    pageRoot?.querySelectorAll('.btn-select-plan').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Memproses...';

        try {
          const planName = btn.getAttribute('data-plan');
          const targetPlan = planName ? planName.toLowerCase() : '';
          let planAmount = 0;
          if (targetPlan === 'starter') planAmount = 39000;
          else if (targetPlan === 'pro') planAmount = 79000;
          else if (targetPlan !== 'free') {
            showToast('Paket yang dipilih tidak tersedia.', 'error');
            return;
          }

          if (!isAuthenticated) {
            if (targetPlan === 'free') {
              this.router.navigate('/register');
              return;
            }
            localStorage.setItem('pending_plan', JSON.stringify({
              planName,
              planAmount
            }));
            showToast(`Silakan masuk terlebih dahulu untuk melanjutkan pembayaran paket ${planName}.`, 'info');
            this.router.navigate('/login');
            return;
          }

          const currentUser = ApiService.getUser();
          const currentPlan = (currentUser?.plan || 'free').toLowerCase();
          
          if (currentPlan === targetPlan) return;

          const doDowngrade = async () => {
            if (!currentUser || !currentUser.id) return;

            try {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              const response = await fetch('/api/downgrade-plan', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                  userId: currentUser.id
                })
              });

              if (response.ok) {
                currentUser.plan = planName;
                currentUser.subscription_status = 'inactive';
                ApiService.saveUser(currentUser);
                showToast('Plan berhasil diperbarui ke Free', 'success');
                setTimeout(() => window.location.reload(), 1200);
              } else {
                const errData = await response.json().catch(() => ({}));
                showToast(errData.message || 'Gagal melakukan downgrade plan.', 'error');
              }
            } catch (err) {
              showToast('Terjadi kesalahan saat downgrade plan.', 'error');
            }
          };

          if (targetPlan === 'free') {
            if (['pro', 'starter'].includes(currentPlan)) {
              showConfirmModal({
                title: 'Downgrade ke Paket Free?',
                message: 'Apakah Anda yakin ingin downgrade ke paket Free? Fitur premium Anda akan dinonaktifkan.',
                confirmText: 'Ya, Downgrade',
                confirmType: 'warning',
                icon: 'arrow-down-circle',
                onConfirm: doDowngrade
              });
              return;
            }
            await doDowngrade();
            return;
          }

          await this.triggerMidtransCheckout(planName, planAmount);
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });
    });
  }

  async triggerMidtransCheckout(planName, planAmount) {
    const currentUser = ApiService.getUser();
    if (!currentUser || !currentUser.id) return;

    showToast(`Menyiapkan pembayaran Midtrans untuk paket ${planName}...`, 'info');

    let snapToken = null;
    try {
      // FIX 9: Pass Supabase bearer token for server-side verification
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId: `SOL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          amount: planAmount,
          planName: planName,
          userId: currentUser.id,
          customerEmail: currentUser.email,
        })
      });
      if (response.ok) {
        const data = await response.json();
        snapToken = data.token || data.snap_token;
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.message || 'Gagal membuat transaksi Midtrans.', 'error');
        return;
      }
    } catch (err) {
      console.warn('Endpoint /api/create-transaction tidak merespons:', err);
      showToast('Terjadi kesalahan koneksi ke server.', 'error');
      return;
    }

    // Dynamic snap script loader fallback if window.snap is not loaded
    if (!window.snap) {
      const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
      const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '';
      const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL || (isProd ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js');
      
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = snapUrl;
        if (clientKey) script.setAttribute('data-client-key', clientKey);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }).catch(() => {});
    }

    if (window.snap && typeof window.snap.pay === 'function') {
      if (snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: async (result) => {
            // FIX 1: Remove client-side profile/localStorage plan grant.
            // Server-side Midtrans webhook is the sole source of truth for updating user plans.
            showToast('Payment received, confirming your plan...', 'info');
            setTimeout(() => window.location.reload(), 3000);
          },
          onPending: (result) => {
            showToast('Menunggu penyelesaian pembayaran Midtrans.', 'info');
          },
          onError: (result) => {
            showToast('Pembayaran gagal atau dibatalkan.', 'error');
          },
          onClose: () => {
            showToast('Modal pembayaran Midtrans ditutup.', 'info');
          }
        });
      } else {
        showToast(`Gagal mendapatkan snapToken dari backend /api/create-transaction.`, 'error');
      }
    } else {
      showToast('Library Midtrans Snap JS belum terikat atau gagal dimuat.', 'error');
    }
  }

  attachSettingsFormEvents() {
    const form = document.getElementById('form-settings');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
      }

      try {
        const currentUser = ApiService.getUser();
        const fullName = form.querySelector('[name="fullName"]')?.value.trim();
        const company = form.querySelector('[name="company"]')?.value.trim();
        const phone = form.querySelector('[name="phone"]')?.value.trim();
        const address = form.querySelector('[name="address"]')?.value.trim();
        const npwp = form.querySelector('[name="npwp"]')?.value.trim();
        const bankName = form.querySelector('[name="bankName"]')?.value.trim();
        const bankAccountNumber = form.querySelector('[name="bankAccountNumber"]')?.value.trim();
        const bankAccountName = form.querySelector('[name="bankAccountName"]')?.value.trim();

        const updatedUser = {
          ...currentUser,
          name: fullName || currentUser.name,
          company: company || '',
          phone: phone || '',
          address: address || '',
          npwp: npwp || '',
          bankName: bankName || '',
          bankAccountNumber: bankAccountNumber || '',
          bankAccountName: bankAccountName || ''
        };

        ApiService.saveUser(updatedUser);

        // Update data profil ke Supabase jika terhubung
        try {
          await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              company: company,
              phone: phone,
              address: address,
              npwp: npwp,
              bank_name: bankName,
              bank_account_number: bankAccountNumber,
              bank_account_name: bankAccountName
            })
            .eq('id', currentUser.id);
        } catch (supabaseErr) {
          // Abaikan jika offline / dev mode tanpa db connection
        }

        closeModal();
        showToast('Pengaturan identitas & rekening berhasil diperbarui!', 'success');
        await this.render(true, await getCurrentUser());
      } catch (err) {
        showToast(`Gagal menyimpan: ${err.message}`, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Simpan Pengaturan';
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
