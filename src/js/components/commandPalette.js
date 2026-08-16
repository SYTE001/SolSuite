import { ApiService, escapeHtml } from '../api.js';
import { getInvoiceFormModalHTML, getInvoicePreviewModalHTML } from './invoices.js';
import { getProposalFormModalHTML, getProposalPreviewModalHTML } from './proposals.js';
import { getClientModalHTML } from './clients.js';
import { getReminderFormModalHTML } from './reminders.js';
import { showToast } from './toast.js';

export async function openCommandPalette(appInstance) {
  const clients = await ApiService.getClients();
  const invoices = await ApiService.getInvoices();
  const proposals = await ApiService.getProposals();

  const containerHTML = `
    <div class="cmd-palette-wrapper">
      <div class="cmd-palette-input-wrapper">
        <i data-lucide="search" class="cmd-search-icon"></i>
        <input type="text" id="cmd-search-input" placeholder="Search invoices, clients, proposals or type a command..." autocomplete="off" autofocus>
        <span class="cmd-esc-badge">ESC</span>
      </div>
      <div class="cmd-palette-results" id="cmd-palette-results">
        <!-- Results will be dynamically populated here -->
      </div>
    </div>
  `;

  window.openModal(containerHTML);
  
  const searchInput = document.getElementById('cmd-search-input');
  const resultsContainer = document.getElementById('cmd-palette-results');
  
  if (searchInput) {
    searchInput.focus();
    searchInput.addEventListener('input', () => {
      renderResults(searchInput.value, resultsContainer, appInstance, clients, invoices, proposals);
    });
  }

  // Initial render with default actions
  renderResults('', resultsContainer, appInstance, clients, invoices, proposals);
  
  // Attach key events to dialog
  attachKeyboardNav(resultsContainer, appInstance);
}

function renderResults(query, container, appInstance, clients, invoices, proposals) {
  if (!container) return;
  const q = query.toLowerCase().trim();

  // If empty, show actions
  if (!q) {
    container.innerHTML = `
      <div class="cmd-group-title">Navigation & Actions</div>
      <div class="cmd-item" data-action="dashboard">
        <i data-lucide="layout-grid"></i>
        <span class="cmd-item-text">Open Dashboard</span>
        <span class="cmd-item-shortcut">G + D</span>
      </div>
      <div class="cmd-item" data-action="invoices">
        <i data-lucide="receipt"></i>
        <span class="cmd-item-text">Open Invoices</span>
        <span class="cmd-item-shortcut">G + I</span>
      </div>
      <div class="cmd-item" data-action="proposals">
        <i data-lucide="file-text"></i>
        <span class="cmd-item-text">Open Proposals</span>
        <span class="cmd-item-shortcut">G + P</span>
      </div>
      <div class="cmd-item" data-action="clients">
        <i data-lucide="users"></i>
        <span class="cmd-item-text">Open Clients</span>
        <span class="cmd-item-shortcut">G + C</span>
      </div>
      <div class="cmd-item" data-action="theme">
        <i data-lucide="sun-moon"></i>
        <span class="cmd-item-text">Toggle Theme (Light / Dark)</span>
        <span class="cmd-item-shortcut">T + T</span>
      </div>

      <div class="cmd-group-title" style="margin-top: 14px;">Creation Shortcuts</div>
      <div class="cmd-item" data-action="create-invoice">
        <i data-lucide="plus-circle" style="color:var(--success);"></i>
        <span class="cmd-item-text">Create New Invoice</span>
        <span class="cmd-item-shortcut">N + I</span>
      </div>
      <div class="cmd-item" data-action="create-proposal">
        <i data-lucide="plus-circle" style="color:var(--info);"></i>
        <span class="cmd-item-text">Create New Proposal</span>
        <span class="cmd-item-shortcut">N + P</span>
      </div>
      <div class="cmd-item" data-action="add-client">
        <i data-lucide="user-plus" style="color:var(--accent-primary);"></i>
        <span class="cmd-item-text">Add New Client</span>
        <span class="cmd-item-shortcut">N + C</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    highlightIndex(container, 0);
    attachItemClicks(container, appInstance);
    return;
  }

  // Filter lists
  const matchedClients = clients.filter(c => 
    c.name.toLowerCase().includes(q) || 
    (c.company && c.company.toLowerCase().includes(q)) || 
    c.email.toLowerCase().includes(q)
  );

  const matchedInvoices = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(q) || 
    i.title.toLowerCase().includes(q)
  );

  const matchedProposals = proposals.filter(p => 
    p.title.toLowerCase().includes(q)
  );

  let html = '';

  if (matchedClients.length > 0) {
    html += `<div class="cmd-group-title">Clients</div>`;
    matchedClients.slice(0, 4).forEach(c => {
      html += `
        <div class="cmd-item" data-navigate="/app/clients" data-id="${c.id}" data-type="client">
          <i data-lucide="user"></i>
          <div class="cmd-item-meta">
            <span class="cmd-item-title">${escapeHtml(c.name)}</span>
            <span class="cmd-item-sub">${escapeHtml(c.company || 'Personal')} &bull; ${escapeHtml(c.email)}</span>
          </div>
        </div>
      `;
    });
  }

  if (matchedInvoices.length > 0) {
    html += `<div class="cmd-group-title">Invoices</div>`;
    matchedInvoices.slice(0, 4).forEach(i => {
      html += `
        <div class="cmd-item" data-navigate="/app/invoices" data-id="${i.id}" data-type="invoice">
          <i data-lucide="receipt"></i>
          <div class="cmd-item-meta">
            <span class="cmd-item-title">${escapeHtml(i.invoiceNumber)} - ${escapeHtml(i.title)}</span>
            <span class="cmd-item-sub">Status: ${escapeHtml(i.status)}</span>
          </div>
        </div>
      `;
    });
  }

  if (matchedProposals.length > 0) {
    html += `<div class="cmd-group-title">Proposals</div>`;
    matchedProposals.slice(0, 4).forEach(p => {
      html += `
        <div class="cmd-item" data-navigate="/app/proposals" data-id="${p.id}" data-type="proposal">
          <i data-lucide="file-text"></i>
          <div class="cmd-item-meta">
            <span class="cmd-item-title">${escapeHtml(p.title)}</span>
            <span class="cmd-item-sub">Status: ${escapeHtml(p.status)}</span>
          </div>
        </div>
      `;
    });
  }

  if (!html) {
    html = `
      <div class="cmd-empty-state">
        <i data-lucide="search-code"></i>
        <p>No results found for "${escapeHtml(query)}"</p>
      </div>
    `;
  }

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
  highlightIndex(container, 0);
  attachItemClicks(container, appInstance);
}

function highlightIndex(container, idx) {
  const items = container.querySelectorAll('.cmd-item');
  items.forEach(item => item.classList.remove('active'));
  if (items[idx]) {
    items[idx].classList.add('active');
    items[idx].scrollIntoView({ block: 'nearest' });
  }
}

function attachItemClicks(container, appInstance) {
  const items = container.querySelectorAll('.cmd-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      executeItem(item, appInstance);
    });
  });
}

async function executeItem(item, appInstance) {
  window.closeModal();

  const action = item.dataset.action;
  const navigate = item.dataset.navigate;
  const id = item.dataset.id;
  const type = item.dataset.type;

  if (navigate) {
    appInstance.router.navigate(navigate);
    // If it is a specific item, we can open the details view after routing
    if (id) {
      setTimeout(async () => {
        // Open details
        if (type === 'invoice') {
          const invoices = await ApiService.getInvoices();
          const inv = invoices.find(i => String(i.id) === String(id));
          if (inv && window.appInstance) {
            const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
            window.openModal(await getInvoicePreviewModalHTML(inv, formatIDR));
          }
        } else if (type === 'proposal') {
          const proposals = await ApiService.getProposals();
          const prop = proposals.find(p => String(p.id) === String(id));
          if (prop) {
            const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
            window.openModal(await getProposalPreviewModalHTML(prop, formatIDR));
          }
        } else if (type === 'client') {
          const clients = await ApiService.getClients();
          const client = clients.find(c => String(c.id) === String(id));
          if (client) {
            window.openModal(getClientModalHTML(client));
            appInstance.attachClientFormEvents();
          }
        }
      }, 300);
    }
    return;
  }

  if (action) {
    switch (action) {
      case 'dashboard':
        appInstance.router.navigate('/app/dashboard');
        break;
      case 'invoices':
        appInstance.router.navigate('/app/invoices');
        break;
      case 'proposals':
        appInstance.router.navigate('/app/proposals');
        break;
      case 'clients':
        appInstance.router.navigate('/app/clients');
        break;
      case 'theme':
        const nextTheme = ApiService.getTheme() === 'dark' ? 'light' : 'dark';
        ApiService.setTheme(nextTheme);
        appInstance.updateThemeIcon(nextTheme);
        showToast(`Switched to ${nextTheme} theme`, 'info');
        break;
      case 'create-invoice':
        window.openModal(await getInvoiceFormModalHTML());
        appInstance.attachInvoiceFormEvents();
        break;
      case 'create-proposal':
        window.openModal(await getProposalFormModalHTML());
        appInstance.attachProposalFormEvents();
        break;
      case 'add-client':
        window.openModal(getClientModalHTML());
        appInstance.attachClientFormEvents();
        break;
    }
  }
}

function attachKeyboardNav(container, appInstance) {
  let focusedIdx = 0;
  
  const handleKeyDown = (e) => {
    const items = container.querySelectorAll('.cmd-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIdx = (focusedIdx + 1) % items.length;
      highlightIndex(container, focusedIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIdx = (focusedIdx - 1 + items.length) % items.length;
      highlightIndex(container, focusedIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[focusedIdx]) {
        executeItem(items[focusedIdx], appInstance);
        cleanup();
      }
    } else if (e.key === 'Escape') {
      cleanup();
    }
  };

  const cleanup = () => {
    window.removeEventListener('keydown', handleKeyDown);
  };

  window.addEventListener('keydown', handleKeyDown);
  
  // Clean up when modal backdrop is clicked or closed
  const backdrop = document.getElementById('modal-backdrop');
  backdrop?.addEventListener('click', cleanup, { once: true });
}
