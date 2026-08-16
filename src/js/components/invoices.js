import { ApiService, escapeHtml } from '../api.js';
import { renderCustomDropdown } from './dropdown.js';

export async function renderInvoicesView(formatIDR) {
  const invoices = await ApiService.getInvoices();
  const clients = await ApiService.getClients();

  // Calculate invoice summaries
  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'viewed'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);

  return `
    <!-- Top KPI Row -->
    <div class="grid-4" style="margin-bottom: 24px;">
      <div class="card metric-block" style="min-height: 100px; padding: 16px;">
        <div class="metric-label">Total Billed</div>
        <div class="metric-value font-mono" style="font-size: 20px; margin-top: 8px;">${formatIDR(totalBilled)}</div>
      </div>
      <div class="card metric-block" style="min-height: 100px; padding: 16px;">
        <div class="metric-label" style="color: var(--success);">Total Paid</div>
        <div class="metric-value font-mono" style="color: var(--success); font-size: 20px; margin-top: 8px;">${formatIDR(totalPaid)}</div>
      </div>
      <div class="card metric-block" style="min-height: 100px; padding: 16px;">
        <div class="metric-label" style="color: var(--info);">Outstanding</div>
        <div class="metric-value font-mono" style="color: var(--info); font-size: 20px; margin-top: 8px;">${formatIDR(totalOutstanding)}</div>
      </div>
      <div class="card metric-block" style="min-height: 100px; padding: 16px; display: flex; align-items: center; justify-content: center; background: var(--bg-card);">
        <button class="btn btn-primary" id="btn-add-invoice" type="button" style="width: 100%; height: 100%; justify-content: center; font-size: 14px;">
          <i data-lucide="plus"></i>
          <span>Buat Invoice Baru</span>
        </button>
      </div>
    </div>

    <!-- Search & Filter Tab Toolbar -->
    <div class="invoice-toolbar-card card" style="padding: 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <div class="search-input-wrapper" style="flex: 1; min-width: 260px; position: relative;">
          <i data-lucide="search" style="position: absolute; left: 12px; top: 11px; width: 18px; height: 18px; color: var(--text-dim);"></i>
          <input type="text" id="invoice-search" class="form-control" placeholder="Cari nomor invoice, deskripsi, pic..." style="padding-left: 38px; min-height: 40px;">
        </div>
        <div style="display: flex; gap: 8px;">
          <select id="invoice-sort" class="form-control" style="min-height: 40px; width: 160px; cursor: pointer;">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Nominal Tertinggi</option>
            <option value="lowest">Nominal Terendah</option>
          </select>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="invoice-tabs-row" style="display: flex; gap: 6px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; overflow-x: auto;">
        <button class="tab-btn active" data-status="all">Semua</button>
        <button class="tab-btn" data-status="draft">Draft</button>
        <button class="tab-btn" data-status="sent">Sent</button>
        <button class="tab-btn" data-status="paid">Paid</button>
        <button class="tab-btn" data-status="overdue">Overdue</button>
        <button class="tab-btn" data-status="cancelled">Cancelled</button>
      </div>
    </div>

    <!-- Data List Panel -->
    <div class="card data-table-card">
      <div class="table-responsive table-container">
        <table class="data-table" id="invoices-list-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Klien</th>
              <th>Deskripsi Pekerjaan</th>
              <th>Jatuh Tempo</th>
              <th>Nominal</th>
              <th>Status</th>
              <th style="text-align:right;">Tindakan</th>
            </tr>
          </thead>
          <tbody id="invoices-table-body">
            ${invoices.map(inv => {
              const client = clients.find(c => c.id === inv.clientId) || { name: 'Direct Client' };
              const createdDate = inv.created_at ? new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
              return `
                <tr class="invoice-row-item" data-status="${escapeHtml(inv.status)}" data-number="${escapeHtml(inv.invoiceNumber)}" data-client="${escapeHtml(client.name)}" data-desc="${escapeHtml(inv.title)}" data-amount="${inv.total}">
                  <td><span class="table-primary font-mono">${escapeHtml(inv.invoiceNumber)}</span></td>
                  <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(client.name)}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Created: ${createdDate}</div>
                  </td>
                  <td>${escapeHtml(inv.title)}</td>
                  <td style="color:var(--text-dim);" class="font-mono">${escapeHtml(inv.dueDate)}</td>
                  <td><span class="table-primary font-mono">${formatIDR(inv.total)}</span></td>
                  <td><span class="badge-status ${escapeHtml(inv.status)}">${escapeHtml(inv.status)}</span></td>
                  <td class="table-actions">
                    <button type="button" class="table-action table-action-whatsapp btn-send-whatsapp-invoice" data-id="${escapeHtml(inv.id)}" title="Kirim via WhatsApp"><i data-lucide="message-square"></i><span>Kirim WA</span></button>
                    <button type="button" class="table-action btn-copy-invoice-link" data-id="${escapeHtml(inv.id)}" data-number="${escapeHtml(inv.invoiceNumber)}" title="Salin Tautan"><i data-lucide="link"></i></button>
                    <button type="button" class="table-action btn-view-invoice" data-id="${escapeHtml(inv.id)}" title="Lihat Preview"><i data-lucide="eye"></i></button>
                    <button type="button" class="table-action table-action-edit btn-edit-invoice" data-id="${escapeHtml(inv.id)}" title="Edit"><i data-lucide="pencil"></i></button>
                    <button type="button" class="table-action btn-duplicate-invoice" data-id="${escapeHtml(inv.id)}" title="Duplikasi"><i data-lucide="copy"></i></button>
                    <button type="button" class="table-action table-action-danger btn-delete-invoice" data-id="${escapeHtml(inv.id)}" title="Hapus"><i data-lucide="trash-2"></i></button>
                  </td>
                </tr>
              `;
            }).join('') || `
              <tr id="invoices-empty-row">
                <td colspan="7">
                  <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="receipt"></i></div>
                    <h4>Belum ada invoice dibuat</h4>
                    <p>Buat invoice pertama Anda dan bagikan tautan pembayaran profesional ke klien Anda.</p>
                    <button class="btn btn-primary btn-sm" id="btn-add-invoice-empty">+ Buat Invoice</button>
                  </div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export async function getInvoiceFormModalHTML(invoice = {}) {
  const clients = await ApiService.getClients();
  const items = invoice.items || [{ desc: '', qty: 1, price: 0 }];
  const user = ApiService.getUser();

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.name,
    subtext: c.company || 'Personal'
  }));

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return `
    <div class="modal-header">
      <h2>${invoice.id ? 'Edit Invoice' : 'Buat Invoice Baru'}</h2>
      <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
    </div>
    
    <!-- Split Pane Layout -->
    <div class="invoice-split-modal" style="display: grid; grid-template-columns: 520px 1fr; width: 100%; height: 76vh; min-height: 540px; overflow: hidden;">
      
      <!-- Left side Form -->
      <form id="form-invoice" style="display: flex; flex-direction: column; height: 100%; border-right: 1px solid var(--border-color); overflow: hidden;">
        <input type="hidden" name="id" value="${escapeHtml(invoice.id || '')}">
        
        <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 18px;">
          <!-- Section 1: Client Selection -->
          <div class="form-section">
            <div class="cmd-group-title" style="padding-left: 0; margin-bottom: 8px;">1. Pilih Klien</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div class="form-group">
                <label class="form-label">Klien *</label>
                ${renderCustomDropdown({
                  name: 'clientId',
                  value: invoice.clientId || '',
                  options: clientOptions,
                  placeholder: 'Pilih klien...',
                  searchable: true,
                  required: true
                })}
              </div>
              <div class="form-group">
                <label class="form-label">Nomor Invoice</label>
                <input type="text" name="invoiceNumber" id="field-inv-number" class="form-control" value="${escapeHtml(invoice.invoiceNumber || '')}" placeholder="Otomatis (e.g. INV-2026-004)">
              </div>
            </div>
          </div>

          <!-- Section 2: Details -->
          <div class="form-section">
            <div class="cmd-group-title" style="padding-left: 0; margin-bottom: 8px;">2. Deskripsi Pekerjaan</div>
            <div class="form-group">
              <label class="form-label">Judul Pekerjaan / Project *</label>
              <input type="text" name="title" id="field-inv-title" class="form-control" value="${escapeHtml(invoice.title || '')}" required placeholder="e.g., UI Redesign & Backend Development Retainer">
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div class="form-group">
                <label class="form-label">Tanggal Jatuh Tempo *</label>
                <input type="date" name="dueDate" id="field-inv-due" class="form-control" value="${escapeHtml(invoice.dueDate || new Date(Date.now() + 14*24*3600*1000).toISOString().split('T')[0])}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                ${renderCustomDropdown({
                  name: 'status',
                  value: invoice.status || 'draft',
                  options: statusOptions
                })}
              </div>
            </div>
          </div>

          <!-- Section 3: Dynamic Items -->
          <div class="form-section">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
              <div class="cmd-group-title" style="padding-left: 0; margin-bottom: 0;">3. Rincian Pekerjaan (Line Items)</div>
              <button type="button" class="btn btn-ghost btn-sm" id="btn-add-item-row" style="padding: 0 8px;">+ Tambah Item</button>
            </div>
            
            <div id="invoice-items-container">
              ${items.map((item, idx) => `
                <div class="item-row" style="display:grid; grid-template-columns: 3fr 1fr 2fr 34px; gap:8px; margin-bottom:8px; align-items:center;">
                  <input type="text" class="form-control item-desc" name="item_desc[]" placeholder="Deskripsi pekerjaan" value="${escapeHtml(item.desc || item.description || '')}" required>
                  <input type="number" class="form-control item-qty" name="item_qty[]" placeholder="Qty" value="${item.qty || item.quantity || 1}" min="1" required>
                  <input type="number" class="form-control item-price" name="item_price[]" placeholder="Harga" value="${item.price || 0}" min="0" required>
                  <button type="button" class="btn-icon btn-remove-item-row" style="color:var(--danger); border:none;" aria-label="Hapus"><i data-lucide="trash-2"></i></button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 4: Taxes, Discounts & Notes -->
          <div class="form-section">
            <div class="cmd-group-title" style="padding-left: 0; margin-bottom: 8px;">4. Pajak, Diskon & Rekening</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div class="form-group">
                <label class="form-label">Pajak (%)</label>
                <input type="number" name="taxPercent" id="field-inv-tax" class="form-control" value="${invoice.taxPercent || 0}" min="0" max="100">
              </div>
              <div class="form-group">
                <label class="form-label">Diskon (%)</label>
                <input type="number" name="discountPercent" id="field-inv-discount" class="form-control" value="${invoice.discountPercent || 0}" min="0" max="100">
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px;">
              <div class="form-group">
                <label class="form-label">Catatan Tambahan (Optional)</label>
                <input type="text" name="paymentNotes" id="field-inv-notes" class="form-control" value="${escapeHtml(invoice.paymentNotes || '')}" placeholder="e.g. Sertakan no invoice di transfer">
              </div>
              <div class="form-group">
                <label class="form-label">Catatan Pajak (Optional)</label>
                <input type="text" name="taxNotes" id="field-inv-taxnotes" class="form-control" value="${escapeHtml(invoice.taxNotes || '')}" placeholder="e.g. Harga Nett">
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding: 16px 24px;">
          <button type="button" class="btn btn-secondary modal-close">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Invoice</button>
        </div>
      </form>

      <!-- Right side Preview Panel (SaaS-like Paper Document View) -->
      <div class="invoice-realtime-preview-panel" style="background: var(--bg-app); padding: 24px; overflow-y: auto; display: flex; flex-direction: column; align-items: center; border-left: 1px solid var(--border-subtle);">
        <div style="width: 100%; max-width: 480px; font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="eye" style="width: 14px; height: 14px;"></i> Real-Time Invoice Preview
        </div>
        
        <div class="document-preview" id="form-realtime-printable-area" style="box-shadow: 0 4px 20px rgba(0,0,0,0.5); border-radius: 4px; padding: 28px; background: white; color: #0f172a; font-family: sans-serif; font-size: 11px; line-height: 1.4; width: 100%; max-width: 480px; box-sizing: border-box;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
            <div>
              <div style="font-size:14px; font-weight:800; color:#0f172a;" id="prev-issuer">${escapeHtml(user.company || user.name || 'Penyedia Jasa')}</div>
              <div style="font-size:9px; color:#64748b; margin-top:2px;" id="prev-issuer-sub">${escapeHtml(user.email || '')}</div>
              <div style="font-size:9px; color:#64748b;" id="prev-issuer-phone">${escapeHtml(user.phone || '')}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px; font-weight:900; color:#0f172a; letter-spacing:0.02em;">INVOICE</div>
              <div style="font-weight:700; color:#475569;" id="prev-number">#—</div>
              <div style="margin-top:4px; font-size:9px; color:#64748b;" id="prev-due">Due: —</div>
            </div>
          </div>

          <div style="margin-bottom:16px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px;">
            <div style="font-weight:700; color:#64748b; font-size:9px;">DITAGIHKAN KEPADA:</div>
            <div style="font-weight:800; font-size:12px; color:#0f172a; margin-top:2px;" id="prev-client-name">—</div>
            <div style="font-size:9px; color:#475569; margin-top:2px;" id="prev-client-info">—</div>
          </div>

          <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:10px;">
            <thead>
              <tr style="background:#f8fafc; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; font-weight:700; color:#64748b;">
                <th style="text-align:left; padding:8px;">DESKRIPSI PEKERJAAN</th>
                <th style="text-align:center; padding:8px; width:10%;">QTY</th>
                <th style="text-align:right; padding:8px; width:20%;">HARGA</th>
                <th style="text-align:right; padding:8px; width:20%;">TOTAL</th>
              </tr>
            </thead>
            <tbody id="prev-items-body">
              <tr>
                <td colspan="4" style="text-align:center; padding:12px; color:#94a3b8;">Belum ada item ditambahkan.</td>
              </tr>
            </tbody>
          </table>

          <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
            <div style="width:180px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; font-size:10px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;" id="prev-subtotal-row">
                <span>Subtotal:</span>
                <strong id="prev-subtotal">Rp 0</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#dc2626; display:none;" id="prev-discount-row">
                <span>Diskon:</span>
                <span id="prev-discount">-Rp 0</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; display:none;" id="prev-tax-row">
                <span>Pajak:</span>
                <span id="prev-tax">+Rp 0</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:6px; font-size:12px; font-weight:800; color:#0f172a;">
                <span>TOTAL:</span>
                <span id="prev-total">Rp 0</span>
              </div>
            </div>
          </div>

          <div style="font-size:9px; color:#64748b; line-height:1.4;" id="prev-payment-box">
            <div style="font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:2px;">Petunjuk Transfer</div>
            <div id="prev-rekening">Bank: ${escapeHtml(user.bankName || '—')} | No: ${escapeHtml(user.bankAccountNumber || '—')} | a.n: ${escapeHtml(user.bankAccountName || user.name || '—')}</div>
            <div id="prev-notes" style="margin-top:2px; font-style:italic;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function getInvoicePreviewModalHTML(invoice, formatIDR) {
  const clients = await ApiService.getClients();
  const client = clients.find(c => String(c.id) === String(invoice.clientId)) || { name: invoice.clientName || 'Client' };
  const user = ApiService.getUser();

  const issuerTitle = user.company || user.name || 'Penyedia Jasa';
  const issuerSub = user.company ? user.name : '';
  const issuerEmail = user.email || '';
  const issuerPhone = user.phone || '';
  const issuerAddress = user.address || '';
  const issuerNpwp = user.npwp || '';

  const bankName = user.bankName || invoice.bankName || '';
  const bankAccNum = user.bankAccountNumber || invoice.bankAccountNumber || '';
  const bankAccName = user.bankAccountName || user.bankAccountHolder || user.name || '';
  const hasBank = !!(bankName || bankAccNum);

  const paymentNotes = invoice.paymentNotes || '';
  const taxNotes = invoice.taxNotes || '';

  const issueDateStr = invoice.createdAt ? invoice.createdAt.split('T')[0] : (invoice.issueDate || new Date().toISOString().split('T')[0]);

  const items = invoice.items || [{ desc: invoice.title || 'Work Services', qty: 1, price: invoice.total || 0 }];
  const subtotal = invoice.subtotal || items.reduce((sum, item) => sum + ((item.qty || item.quantity || 1) * item.price), 0);
  const discountAmount = invoice.discountPercent ? (subtotal * invoice.discountPercent / 100) : 0;
  const taxAmount = invoice.taxPercent ? (subtotal * invoice.taxPercent / 100) : 0;
  const total = invoice.total || (subtotal - discountAmount + taxAmount);

  return `
    <div class="modal-header">
      <h2>Invoice #${escapeHtml(invoice.invoiceNumber)}</h2>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary btn-sm btn-send-whatsapp-invoice" data-id="${escapeHtml(invoice.id)}">
          <i data-lucide="message-square" style="color:#30D158;"></i> Kirim WA
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-copy-link-preview" data-id="${escapeHtml(invoice.id)}" data-number="${escapeHtml(invoice.invoiceNumber)}">
          <i data-lucide="link"></i> Copy Link
        </button>
        <button class="btn btn-primary btn-sm" id="btn-export-pdf">
          <i data-lucide="download"></i> Download PDF
        </button>
        <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
    </div>
    <div class="modal-body" style="background:#0a0a0c; padding:28px 24px; max-height:80vh; overflow-y:auto;">
      <div class="document-preview" id="invoice-printable-area" style="background:#ffffff; color:#0f172a; padding:40px; font-family:sans-serif;">
        <!-- Header -->
        <div class="doc-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #e2e8f0;">
          <div>
            <h2 style="font-size:18px; font-weight:800; color:#0f172a; margin:0 0 4px 0; letter-spacing:-0.02em;">
              ${escapeHtml(issuerTitle)}
            </h2>
            ${issuerSub ? `<div style="font-size:12px; color:#475569; font-weight:600; margin-bottom:6px;">${escapeHtml(issuerSub)}</div>` : ''}
            <div style="font-size:11px; color:#64748b; line-height:1.5;">
              ${issuerEmail ? `<div>Email: ${escapeHtml(issuerEmail)}</div>` : ''}
              ${issuerPhone ? `<div>Telp / WA: ${escapeHtml(issuerPhone)}</div>` : ''}
              ${issuerAddress ? `<div>Alamat: ${escapeHtml(issuerAddress)}</div>` : ''}
              ${issuerNpwp ? `<div>NPWP: ${escapeHtml(issuerNpwp)}</div>` : ''}
            </div>
          </div>

          <div style="text-align:right;">
            <div style="font-size:22px; font-weight:900; color:#0f172a; margin:0 0 2px 0; letter-spacing:0.04em;">INVOICE</div>
            <div style="font-size:12px; color:#475569; font-weight:700;">No. Invoice: #${escapeHtml(invoice.invoiceNumber)}</div>
            <div style="font-size:11px; color:#64748b; margin-top:6px; line-height:1.5;">
              <div>Tanggal Terbit: ${escapeHtml(issueDateStr)}</div>
              <div>Jatuh Tempo: <strong style="color:#0f172a;">${escapeHtml(invoice.dueDate)}</strong></div>
            </div>
            ${invoice.status ? `
              <div style="margin-top:8px;">
                <span class="badge-status-pdf ${escapeHtml(invoice.status)}">
                  ${escapeHtml(invoice.status.toUpperCase())}
                </span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Meta Info -->
        <div style="margin-bottom:24px; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
          <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.06em;">DITAGIHKAN KEPADA:</span>
          <strong style="display:block; font-size:14px; font-weight:800; color:#0f172a; margin-top:4px;">${escapeHtml(client.company || client.name)}</strong>
          <div style="font-size:12px; color:#475569; margin-top:4px; line-height:1.6;">
            ${(client.company && client.name) ? `<div><strong>Attn:</strong> ${escapeHtml(client.name)}</div>` : ''}
            ${client.address ? `<div><strong>Alamat:</strong> ${escapeHtml(client.address)}</div>` : ''}
            ${client.email ? `<div><strong>Email:</strong> ${escapeHtml(client.email)}</div>` : ''}
            ${client.phone ? `<div><strong>Telp:</strong> ${escapeHtml(client.phone)}</div>` : ''}
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
          <thead>
            <tr style="background:#f8fafc; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;">
              <th style="text-align:left; padding:10px 12px; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">DESKRIPSI PEKERJAAN</th>
              <th style="text-align:center; padding:10px 12px; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; width:10%;">QTY</th>
              <th style="text-align:right; padding:10px 12px; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; width:20%;">HARGA SATUAN</th>
              <th style="text-align:right; padding:10px 12px; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; width:20%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:12px; font-size:13px; color:#0f172a; white-space:pre-line;">${escapeHtml(item.desc || item.description)}</td>
                <td style="padding:12px; font-size:13px; color:#475569; text-align:center;">${item.qty || item.quantity || 1}</td>
                <td style="padding:12px; font-size:13px; color:#475569; text-align:right;">${formatIDR(item.price)}</td>
                <td style="padding:12px; font-size:13px; font-weight:700; color:#0f172a; text-align:right;">${formatIDR((item.qty || item.quantity || 1) * item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:28px;">
          <div style="width:280px; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
            ${(invoice.taxPercent > 0 || invoice.discountPercent > 0) ? `
              <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:6px;">
                <span>Subtotal:</span>
                <strong>${formatIDR(subtotal)}</strong>
              </div>
            ` : ''}
            ${invoice.discountPercent > 0 ? `
              <div style="display:flex; justify-content:space-between; font-size:12px; color:#dc2626; margin-bottom:6px;">
                <span>Diskon (${invoice.discountPercent}%):</span>
                <span>-${formatIDR(discountAmount)}</span>
              </div>
            ` : ''}
            ${invoice.taxPercent > 0 ? `
              <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:6px;">
                <span>Pajak (${invoice.taxPercent}%):</span>
                <span>+${formatIDR(taxAmount)}</span>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid #e2e8f0; font-size:15px; font-weight:800; color:#0f172a;">
              <span>TOTAL TAGIHAN:</span>
              <span>${formatIDR(total)}</span>
            </div>
          </div>
        </div>

        <!-- Transfer Instruction -->
        <div style="display:grid; grid-template-columns: 1fr 200px; gap:24px; align-items:start; padding-top:20px; border-top:1px solid #e2e8f0;">
          <div>
            ${hasBank ? `
              <div style="margin-bottom:16px; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">METODE PEMBAYARAN</div>
                <div style="font-size:12px; color:#0f172a; line-height:1.6;">
                  ${bankName ? `<div>Bank: <strong>${escapeHtml(bankName)}</strong></div>` : ''}
                  ${bankAccNum ? `<div>No. Rekening: <strong>${escapeHtml(bankAccNum)}</strong></div>` : ''}
                  ${bankAccName ? `<div>Atas Nama: <strong>${escapeHtml(bankAccName)}</strong></div>` : ''}
                </div>
              </div>
            ` : ''}

            ${(paymentNotes || taxNotes) ? `
              <div style="padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
                <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">CATATAN</div>
                ${paymentNotes ? `<div style="font-size:11px; color:#475569; line-height:1.5;">${escapeHtml(paymentNotes)}</div>` : ''}
                ${taxNotes ? `<div style="font-size:11px; color:#475569; line-height:1.5; margin-top:2px;">${escapeHtml(taxNotes)}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <div style="text-align:center; margin-top:4px;">
            <div style="font-size:12px; color:#64748b; margin-bottom:48px;">Hormat kami,</div>
            <div style="font-size:13px; font-weight:800; color:#0f172a; border-top:1px solid #cbd5e1; padding-top:6px;">
              ${escapeHtml(issuerTitle)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
