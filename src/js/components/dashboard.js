import { ApiService, escapeHtml } from '../api.js';

export function getDashboardSkeletonHTML() {
  return `
    <section class="dashboard-view dashboard-skeleton-fade">
      <div class="grid-4" style="margin-bottom: 24px;">
        ${[1, 2, 3, 4].map(() => `
          <div class="card metric-block">
            <div class="skeleton skeleton-metric-label" style="height: 12px; width: 60px; margin-bottom: 12px;"></div>
            <div class="skeleton skeleton-metric-value" style="height: 32px; width: 140px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-metric-subtext" style="height: 10px; width: 90px;"></div>
          </div>
        `).join('')}
      </div>

      <div class="card chart-card" style="margin-bottom: 24px; padding: 24px;">
        <div class="skeleton" style="height: 20px; width: 150px; margin-bottom: 16px;"></div>
        <div class="skeleton" style="height: 120px; width: 100%;"></div>
      </div>

      <div class="grid-2">
        <div class="card" style="padding: 24px;">
          <div class="skeleton" style="height: 18px; width: 120px; margin-bottom: 16px;"></div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${[1, 2, 3, 4].map(() => `
              <div class="skeleton" style="height: 38px; width: 100%; border-radius: 6px;"></div>
            `).join('')}
          </div>
        </div>

        <div class="card" style="padding: 24px;">
          <div class="skeleton" style="height: 18px; width: 100px; margin-bottom: 16px;"></div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${[1, 2, 3].map(() => `
              <div class="skeleton" style="height: 52px; width: 100%; border-radius: 6px;"></div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

export async function renderDashboard(formatIDR) {
  const invoices = await ApiService.getInvoices();
  const proposals = await ApiService.getProposals();
  const reminders = await ApiService.getReminders();
  const clients = await ApiService.getClients();

  const now = new Date();

  // Primary Metrics
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'viewed'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
  
  const paidThisMonth = invoices.filter(i => {
    if (i.status !== 'paid') return false;
    const paidDate = new Date(i.paidAt || i.created_at || i.createdAt);
    return !Number.isNaN(paidDate.getTime())
      && paidDate.getFullYear() === now.getFullYear()
      && paidDate.getMonth() === now.getMonth();
  }).reduce((sum, i) => sum + i.total, 0);

  // Action Center Calculations
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const pendingProposalsCount = proposals.filter(p => p.status === 'sent').length;
  const pendingReminders = reminders.filter(r => r.status === 'pending');

  // Revenue Trend last 6 months
  const months = [];
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      amount: 0
    });
    monthLabels.push(d.toLocaleDateString('id-ID', { month: 'short' }));
  }

  invoices.forEach(inv => {
    if (inv.status === 'paid') {
      const date = new Date(inv.paidAt || inv.created_at || inv.createdAt);
      if (!Number.isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = date.getMonth();
        const bucket = months.find(b => b.year === y && b.month === m);
        if (bucket) {
          bucket.amount += inv.total;
        }
      }
    }
  });

  const trendData = months.map(m => m.amount);
  const maxVal = Math.max(...trendData, 1000000);
  
  // Render SVG points
  const points = trendData.map((val, idx) => {
    const x = (idx / (trendData.length - 1)) * 88 + 6; // percentage margins
    const y = 80 - (val / maxVal) * 60; // 20px bottom/top padding
    return `${x}%,${y}%`;
  });

  // Action Items List
  let actionCenterHTML = '';
  if (overdueCount > 0) {
    actionCenterHTML += `
      <div class="action-alert alert-danger" onclick="window.appInstance.router.navigate('/app/invoices')">
        <i data-lucide="alert-triangle"></i>
        <span><strong>${overdueCount} tagihan overdue</strong> memerlukan tindak lanjut penagihan hari ini.</span>
        <i data-lucide="chevron-right" class="action-alert-chevron"></i>
      </div>
    `;
  }
  if (pendingProposalsCount > 0) {
    actionCenterHTML += `
      <div class="action-alert alert-warning" onclick="window.appInstance.router.navigate('/app/proposals')">
        <i data-lucide="clock"></i>
        <span><strong>${pendingProposalsCount} proposal menunggu respon</strong> klien. Hubungi PIC untuk follow-up.</span>
        <i data-lucide="chevron-right" class="action-alert-chevron"></i>
      </div>
    `;
  }
  if (pendingReminders.length > 0) {
    actionCenterHTML += `
      <div class="action-alert alert-info" onclick="window.appInstance.router.navigate('/app/reminders')">
        <i data-lucide="bell"></i>
        <span><strong>${pendingReminders.length} pengingat aktif</strong> untuk agenda operasional bisnis Anda.</span>
        <i data-lucide="chevron-right" class="action-alert-chevron"></i>
      </div>
    `;
  }

  // Top Clients Info Calculation
  const topClients = clients.map(client => {
    const clientInvoices = invoices.filter(i => String(i.clientId) === String(client.id));
    const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const outstanding = clientInvoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0);
    return {
      id: client.id,
      name: client.name,
      company: client.company || 'Personal',
      totalBilled,
      totalPaid,
      outstanding
    };
  }).sort((a, b) => b.totalBilled - a.totalBilled).slice(0, 3);

  return `
    <section class="dashboard-view">
      <!-- Welcome Heading -->
      <div class="dashboard-welcome-banner" style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">Selamat datang kembali</div>
        <h2 style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0; color: var(--text-primary);">
          Berikut ringkasan performa bisnis Anda hari ini.
        </h2>
      </div>

      <!-- Financial Metrics Grid -->
      <div class="grid-4" style="margin-bottom: 24px;">
        <div class="card metric-block">
          <div class="metric-label">Total Received</div>
          <div class="metric-value font-mono">${formatIDR(totalPaid)}</div>
          <div class="metric-subtext">Akumulasi pendapatan bersih</div>
        </div>

        <div class="card metric-block">
          <div class="metric-label" style="color:var(--info);">Outstanding</div>
          <div class="metric-value font-mono" style="color:var(--info);">${formatIDR(totalOutstanding)}</div>
          <div class="metric-subtext">Menunggu pelunasan klien</div>
        </div>

        <div class="card metric-block">
          <div class="metric-label" style="color:var(--danger);">Overdue</div>
          <div class="metric-value font-mono" style="color:var(--danger);">${formatIDR(totalOverdue)}</div>
          <div class="metric-subtext">${invoices.filter(i => i.status === 'overdue').length} invoice lewat jatuh tempo</div>
        </div>

        <div class="card metric-block">
          <div class="metric-label">Koleksi Bulan Ini</div>
          <div class="metric-value font-mono">${formatIDR(paidThisMonth)}</div>
          <div class="metric-subtext">Pendapatan dibayar bulan ini</div>
        </div>
      </div>

      <!-- Action Center Section -->
      ${actionCenterHTML ? `
        <div class="dashboard-action-center" style="margin-bottom: 24px;">
          <div class="cmd-group-title" style="padding-left: 0;">Butuh Perhatian Hari Ini</div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${actionCenterHTML}
          </div>
        </div>
      ` : ''}

      <!-- Revenue Trend Chart -->
      <div class="card chart-card" style="margin-bottom: 28px; padding: 24px;">
        <div class="card-title-bar" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-subtle); margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 700;">Tren Pendapatan</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Visualisasi total koleksi 6 bulan terakhir</p>
          </div>
          <div class="chart-legend" style="font-size: 12px; font-weight: 600; color: var(--text-muted);">
            Total Maks: <span style="color: var(--text-primary);">${formatIDR(maxVal)}</span>
          </div>
        </div>
        
        <div class="dashboard-chart-wrapper" style="position: relative; height: 140px; margin-top: 10px;">
          <svg style="width: 100%; height: 100%; overflow: visible;" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.00"/>
              </linearGradient>
            </defs>
            <!-- Grid Lines -->
            <line x1="0%" y1="10" x2="100%" y2="10" stroke="var(--border-subtle)" stroke-width="0.75" stroke-dasharray="4"/>
            <line x1="0%" y1="70" x2="100%" y2="70" stroke="var(--border-subtle)" stroke-width="0.75" stroke-dasharray="4"/>
            <line x1="0%" y1="130" x2="100%" y2="130" stroke="var(--border-color)" stroke-width="1"/>
            
            <!-- Shaded Area -->
            <polygon points="${points.map((p, i) => `${p.split(',')[0]} ${p.split(',')[1]}`).join(' ')} 94%,130 6%,130" fill="url(#chart-grad)"></polygon>
            
            <!-- Chart Line -->
            <polyline points="${points.join(' ')}" fill="none" stroke="var(--text-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            
            <!-- Interactive Nodes -->
            ${points.map((p, idx) => `
              <circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="var(--bg-card)" stroke="var(--text-primary)" stroke-width="2.2"/>
            `).join('')}
          </svg>
        </div>
        <div class="chart-labels-row" style="display:flex; justify-content:space-between; margin-top:12px; padding: 0 10px; font-size: 11px; font-weight:600; color:var(--text-dim);">
          ${monthLabels.map(lbl => `<span>${lbl}</span>`).join('')}
        </div>
      </div>

      <!-- Split Layout: Recent Invoices & Top Clients -->
      <div class="grid-2">
        <!-- Recent Invoices List -->
        <div class="card recent-invoices-card" style="padding: 24px;">
          <div class="card-title-bar" style="padding: 0 0 14px 0; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 15px; font-weight: 700;">Invoices Terbaru</h3>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Daftar invoice terkini yang Anda terbitkan</p>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-goto-invoices" style="padding: 0 8px;">Lihat Semua</button>
          </div>

          <div class="table-responsive table-container recent-invoices-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Nominal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.slice(0, 5).map(inv => {
                  const client = clients.find(c => c.id === inv.clientId) || { name: 'Direct Client' };
                  return `
                    <tr style="cursor: pointer;" onclick="window.appInstance.router.navigate('/app/invoices')">
                      <td><span class="table-primary font-mono">${escapeHtml(inv.invoiceNumber)}</span></td>
                      <td style="color:var(--text-muted); font-weight: 500;">${escapeHtml(client.name)}</td>
                      <td class="font-mono"><strong>${formatIDR(inv.total)}</strong></td>
                      <td><span class="badge-status ${escapeHtml(inv.status)}">${escapeHtml(inv.status)}</span></td>
                    </tr>
                  `;
                }).join('') || `
                  <tr>
                    <td colspan="4">
                      <div class="dashboard-empty-state">
                        <i data-lucide="receipt" style="width:32px; height:32px; color:var(--text-dim); margin-bottom:12px;"></i>
                        <h4 style="font-size:14px; font-weight:700;">Belum ada tagihan</h4>
                        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">Mulai dengan menerbitkan invoice pertama Anda.</p>
                        <button class="btn btn-primary btn-sm" id="btn-create-first-invoice-dashboard">Create Invoice</button>
                      </div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Clients Performance Card -->
        <div class="card" style="padding: 24px;">
          <div class="card-title-bar" style="padding: 0 0 14px 0; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 15px; font-weight: 700;">Klien Teratas</h3>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Klien dengan akumulasi billing terbesar</p>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${topClients.map(c => `
              <div style="padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; background: var(--bg-input);">
                <div>
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">${escapeHtml(c.name)}</div>
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(c.company)}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);" class="font-mono">${formatIDR(c.totalBilled)}</div>
                  ${c.outstanding > 0 ? `
                    <div style="font-size: 10.5px; font-weight: 600; color: var(--danger); margin-top: 2px;" class="font-mono">Outstanding: ${formatIDR(c.outstanding)}</div>
                  ` : `
                    <div style="font-size: 10.5px; font-weight: 600; color: var(--success); margin-top: 2px;">Fully Paid</div>
                  `}
                </div>
              </div>
            `).join('') || `
              <div class="dashboard-empty-state" style="padding: 30px 10px;">
                <i data-lucide="users" style="width:32px; height:32px; color:var(--text-dim); margin-bottom:12px;"></i>
                <p style="font-size:12px; color:var(--text-muted);">Belum ada daftar klien terdaftar.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    </section>
  `;
}
