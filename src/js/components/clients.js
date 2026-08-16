import { ApiService, escapeHtml } from '../api.js';

export async function renderClientsView() {
  const clients = await ApiService.getClients();
  const invoices = await ApiService.getInvoices();
  const proposals = await ApiService.getProposals();

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return `
    <div class="view-toolbar" style="margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">Manajemen Klien (CRM)</h2>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Kelola hubungan bisnis dan lihat riwayat keuangan per klien</p>
      </div>
      <button class="btn btn-primary" id="btn-add-client" type="button">
        <i data-lucide="user-plus"></i>
        <span>Tambah Klien Baru</span>
      </button>
    </div>

    <!-- Client CRM Cards Grid -->
    <div class="grid-3" id="clients-grid-container">
      ${clients.map(c => {
        const clientInvoices = invoices.filter(i => String(i.clientId) === String(c.id));
        const clientProposals = proposals.filter(p => String(p.clientId) === String(c.id));
        
        const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
        const outstanding = clientInvoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
        const invCount = clientInvoices.length;
        const propCount = clientProposals.length;

        return `
          <div class="card client-crm-card" style="padding: 20px; display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--border-color); position: relative;">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <h3 style="font-size: 15px; font-weight: 750; color: var(--text-primary); margin: 0;">${escapeHtml(c.name)}</h3>
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: block; margin-top: 2px;">
                  ${escapeHtml(c.company || 'Personal')}
                </span>
              </div>
              <span class="badge-status ${c.status === 'inactive' ? 'overdue' : 'paid'}">
                ${c.status === 'inactive' ? 'Inactive' : 'Active'}
              </span>
            </div>

            <!-- Financial Metrics Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div>
                <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700; letter-spacing: 0.02em;">Billed</span>
                <div style="font-size: 13px; font-weight: 750; color: var(--text-primary); margin-top: 2px;" class="font-mono">${formatIDR(totalBilled)}</div>
              </div>
              <div>
                <span style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700; letter-spacing: 0.02em;">Outstanding</span>
                <div style="font-size: 13px; font-weight: 750; color: ${outstanding > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top: 2px;" class="font-mono">${formatIDR(outstanding)}</div>
              </div>
            </div>

            <!-- Contacts Info -->
            <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.5; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <i data-lucide="mail" style="width:13px; height:13px; color:var(--text-dim);"></i>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(c.email || 'No email')}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                <i data-lucide="phone" style="width:13px; height:13px; color:var(--text-dim);"></i>
                <span>${escapeHtml(c.phone || 'No phone')}</span>
              </div>
            </div>

            <!-- Card actions -->
            <div style="display:flex; gap:8px; margin-top:auto;">
              <button type="button" class="btn btn-ghost btn-sm btn-crm-details" data-id="${c.id}" style="flex:1; justify-content:center;">
                <i data-lucide="folder-open"></i> CRM Sheet
              </button>
              <button type="button" class="btn btn-ghost btn-sm btn-edit-client" data-id="${c.id}" style="padding: 0 8px; justify-content:center;" title="Edit Profile">
                <i data-lucide="pencil"></i>
              </button>
              <button type="button" class="btn btn-ghost btn-sm btn-delete-client" data-id="${c.id}" style="padding: 0 8px; justify-content:center; color:var(--danger);" title="Hapus Klien">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      }).join('') || `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="users"></i></div>
            <h4>Belum ada klien terdaftar</h4>
            <p>Tambah klien untuk mulai menautkan ke invoice dan proposal Anda.</p>
            <button class="btn btn-primary btn-sm" id="btn-add-client-empty">+ Tambah Klien</button>
          </div>
        </div>
      `}
    </div>
  `;
}

export function getClientModalHTML(client = {}) {
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return `
    <div class="modal-header">
      <h2>${client.id ? 'Edit Profil Klien' : 'Tambah Klien Baru'}</h2>
      <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
    </div>
    <form id="form-client">
      <input type="hidden" name="id" value="${escapeHtml(client.id || '')}">
      
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Nama Lengkap / PIC *</label>
          <input type="text" name="name" class="form-control" value="${escapeHtml(client.name || '')}" required placeholder="e.g. Budi Santoso">
        </div>
        
        <div class="form-group">
          <label class="form-label">Nama Perusahaan / Institusi</label>
          <input type="text" name="company" class="form-control" value="${escapeHtml(client.company || '')}" placeholder="e.g. PT Karsa Digital (Optional)">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Email Klien *</label>
            <input type="email" name="email" class="form-control" value="${escapeHtml(client.email || '')}" required placeholder="client@company.com">
          </div>
          <div class="form-group">
            <label class="form-label">No. Telepon / WhatsApp</label>
            <input type="tel" name="phone" class="form-control" value="${escapeHtml(client.phone || '')}" placeholder="08123456789">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Alamat Lengkap</label>
          <input type="text" name="address" class="form-control" value="${escapeHtml(client.address || '')}" placeholder="e.g. Jalan Sudirman No. 42, Jakarta">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">NPWP Klien</label>
            <input type="text" name="npwp" class="form-control" value="${escapeHtml(client.npwp || '')}" placeholder="e.g. 01.234.567.8-901.000">
          </div>
          <div class="form-group">
            <label class="form-label">Status Hubungan</label>
            <select name="status" class="form-control" style="cursor:pointer;">
              <option value="active" ${client.status !== 'inactive' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${client.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan Profil Klien</button>
      </div>
    </form>
  `;
}

export function getClientDetailModalHTML(client, invoices, proposals, formatIDR) {
  const clientInvoices = invoices.filter(i => String(i.clientId) === String(client.id));
  const clientProposals = proposals.filter(p => String(p.clientId) === String(client.id));

  const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const outstanding = clientInvoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);

  const initials = (client.name || 'Client').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="modal-header" style="border-bottom: 1px solid var(--border-subtle); padding: 18px 24px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size: 11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em; background:var(--bg-muted); padding:3px 8px; border-radius:var(--radius-sm);">CLIENT SHEET</span>
        <h2 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin:0;">${escapeHtml(client.name)}</h2>
      </div>
      <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
    </div>
    
    <div class="client-crm-sheet-layout" style="display: grid; grid-template-columns: 290px 1fr; width: 100%; height: 74vh; min-height: 520px; overflow:hidden;">
      <!-- Left Profile Panel -->
      <div style="padding: 24px; border-right: 1px solid var(--border-subtle); display:flex; flex-direction:column; gap:20px; overflow-y:auto; background: var(--bg-card);">
        
        <!-- Avatar & Header -->
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="width:46px; height:46px; border-radius:50%; background:var(--bg-muted); border:1px solid var(--border-color); display:grid; place-items:center; font-size:15px; font-weight:800; color:var(--text-primary); flex-shrink:0;">
            ${initials}
          </div>
          <div style="min-width:0;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(client.name)}</h3>
            <div style="font-size: 12px; color: var(--text-muted); font-weight:500; margin-top:2px;">${escapeHtml(client.company || 'Personal Client')}</div>
          </div>
        </div>

        <!-- Contact Information Grid -->
        <div style="display:flex; flex-direction:column; gap:12px; font-size:12.5px;">
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="font-size:10.5px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">EMAIL</span>
            <span style="color:var(--text-primary); font-family:var(--font-mono); word-break:break-all;">${escapeHtml(client.email || '—')}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="font-size:10.5px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">TELEPON / WA</span>
            <span style="color:var(--text-primary);">${escapeHtml(client.phone || '—')}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="font-size:10.5px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">ALAMAT TAGIHAN</span>
            <span style="color:var(--text-secondary); line-height:1.4;">${escapeHtml(client.address || '—')}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <span style="font-size:10.5px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.04em;">NPWP KLIEN</span>
            <span style="color:var(--text-primary); font-family:var(--font-mono);">${escapeHtml(client.npwp || '—')}</span>
          </div>
        </div>

        <hr style="border:0; border-top:1px solid var(--border-subtle); margin: 0;">

        <!-- Financial Summary Card -->
        <div style="background:var(--bg-input); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <span style="font-size: 10.5px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; display:block; margin-bottom:10px;">AKTIVITAS KEUANGAN</span>
          
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
              <span style="color:var(--text-muted);">Total Billed:</span>
              <strong class="font-mono" style="color:var(--text-primary); font-weight:700;">${formatIDR(totalBilled)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
              <span style="color:var(--text-muted);">Total Paid:</span>
              <strong class="font-mono" style="color:var(--success); font-weight:700;">${formatIDR(totalPaid)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
              <span style="color:var(--text-muted);">Outstanding:</span>
              <strong class="font-mono" style="color:var(--danger); font-weight:700;">${formatIDR(outstanding)}</strong>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div style="margin-top:auto; display:flex; flex-direction:column; gap:8px;">
          <button type="button" class="btn btn-primary btn-sm btn-crm-quick-invoice" data-id="${client.id}" style="width:100%; justify-content:center;">
            <i data-lucide="plus" style="width:14px; height:14px;"></i> Buat Invoice
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-crm-quick-proposal" data-id="${client.id}" style="width:100%; justify-content:center;">
            <i data-lucide="plus" style="width:14px; height:14px;"></i> Buat Proposal
          </button>
        </div>
      </div>

      <!-- Right Tab Panel -->
      <div style="display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--bg-app);">
        <!-- Tabs Header -->
        <div class="client-crm-tabs">
          <button type="button" class="crm-tab-btn active" data-tab="invoices">
            Invoices (${clientInvoices.length})
          </button>
          <button type="button" class="crm-tab-btn" data-tab="proposals">
            Proposals (${clientProposals.length})
          </button>
        </div>

        <!-- Tabs Content Area -->
        <div style="flex:1; overflow-y:auto; padding:24px;">
          <!-- Invoices Tab -->
          <div id="crm-tab-content-invoices" class="crm-tab-content-pane">
            <div class="table-responsive">
              <table style="width:100%; font-size:12.5px;">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Project</th>
                    <th>Jatuh Tempo</th>
                    <th style="text-align:right;">Nominal</th>
                    <th style="text-align:center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientInvoices.map(inv => `
                    <tr style="cursor:pointer;" class="crm-row-click" data-type="invoice" data-id="${inv.id}">
                      <td class="font-mono"><strong>${escapeHtml(inv.invoiceNumber)}</strong></td>
                      <td>${escapeHtml(inv.title)}</td>
                      <td style="color:var(--text-muted);">${escapeHtml(inv.dueDate)}</td>
                      <td style="text-align:right;" class="font-mono"><strong>${formatIDR(inv.total)}</strong></td>
                      <td style="text-align:center;"><span class="badge-status ${inv.status}">${inv.status}</span></td>
                    </tr>
                  `).join('') || `
                    <tr>
                      <td colspan="5" style="padding:0; border:none;">
                        <div style="text-align:center; padding:48px 24px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; justify-content:center;">
                          <div style="width:44px; height:44px; margin-bottom:12px; border-radius:50%; background:var(--bg-muted); display:grid; place-items:center; color:var(--text-dim);">
                            <i data-lucide="receipt" style="width:20px; height:20px;"></i>
                          </div>
                          <div style="font-size:14px; font-weight:700; color:var(--text-primary);">Belum Ada Invoice Terkait</div>
                          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; max-width:320px;">
                            Belum ada dokumen invoice yang dikirim atau dibuat untuk ${escapeHtml(client.name)}.
                          </div>
                        </div>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Proposals Tab -->
          <div id="crm-tab-content-proposals" class="crm-tab-content-pane" style="display:none;">
            <div class="table-responsive">
              <table style="width:100%; font-size:12.5px;">
                <thead>
                  <tr>
                    <th>Proposal Project</th>
                    <th>Masa Berlaku</th>
                    <th style="text-align:right;">Nominal Project</th>
                    <th style="text-align:center;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientProposals.map(prop => `
                    <tr style="cursor:pointer;" class="crm-row-click" data-type="proposal" data-id="${prop.id}">
                      <td><strong>${escapeHtml(prop.title)}</strong></td>
                      <td style="color:var(--text-muted);">Valid: ${escapeHtml(prop.validUntil || '—')}</td>
                      <td style="text-align:right;" class="font-mono"><strong>${formatIDR(prop.total || prop.budget || 0)}</strong></td>
                      <td style="text-align:center;"><span class="badge-status ${prop.status}">${prop.status}</span></td>
                    </tr>
                  `).join('') || `
                    <tr>
                      <td colspan="4" style="padding:0; border:none;">
                        <div style="text-align:center; padding:48px 24px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; justify-content:center;">
                          <div style="width:44px; height:44px; margin-bottom:12px; border-radius:50%; background:var(--bg-muted); display:grid; place-items:center; color:var(--text-dim);">
                            <i data-lucide="file-text" style="width:20px; height:20px;"></i>
                          </div>
                          <div style="font-size:14px; font-weight:700; color:var(--text-primary);">Belum Ada Proposal Terkait</div>
                          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; max-width:320px;">
                            Belum ada dokumen penawaran proyek yang dibuat untuk ${escapeHtml(client.name)}.
                          </div>
                        </div>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
