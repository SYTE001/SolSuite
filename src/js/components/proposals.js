import { ApiService, escapeHtml } from '../api.js';
import { renderCustomDropdown } from './dropdown.js';

export async function renderProposalsView(formatIDR) {
  const proposals = await ApiService.getProposals();
  const clients = await ApiService.getClients();

  // Calculate stats
  const activeProposals = proposals.filter(p => p.status !== 'draft');
  const totalPipelineValue = activeProposals.filter(p => p.status === 'sent' || p.status === 'approved').reduce((sum, p) => sum + (p.budget || 0), 0);
  
  const approvedCount = proposals.filter(p => p.status === 'approved' || p.status === 'invoiced').length;
  const nonDraftCount = proposals.filter(p => p.status !== 'draft').length;
  const winRate = nonDraftCount > 0 ? Math.round((approvedCount / nonDraftCount) * 100) : 0;
  
  const avgDealSize = nonDraftCount > 0 ? Math.round(activeProposals.reduce((sum, p) => sum + (p.budget || 0), 0) / nonDraftCount) : 0;

  // Lane buckets
  const lanes = {
    draft: { title: 'Draft', color: 'var(--text-muted)', items: [] },
    sent: { title: 'Sent / Reviewing', color: 'var(--info)', items: [] },
    approved: { title: 'Approved / Accepted', color: 'var(--success)', items: [] },
    rejected: { title: 'Rejected', color: 'var(--danger)', items: [] }
  };

  proposals.forEach(p => {
    const status = p.status || 'draft';
    if (lanes[status]) {
      lanes[status].items.push(p);
    } else {
      lanes.draft.items.push(p);
    }
  });

  return `
    <div class="view-toolbar" style="margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">Pipeline Penawaran (Proposals)</h2>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Kelola penawaran proyek Anda dan lacak tingkat konversi</p>
      </div>
      <button class="btn btn-primary" id="btn-add-proposal" type="button">
        <i data-lucide="plus"></i>
        <span>Buat Proposal Baru</span>
      </button>
    </div>

    <!-- Pipeline Stats Header -->
    <div class="grid-3" style="margin-bottom: 28px;">
      <div class="card metric-block" style="padding:16px; min-height:90px;">
        <div class="metric-label">Pipeline Value</div>
        <div class="metric-value font-mono" style="font-size: 20px; margin-top:6px;">${formatIDR(totalPipelineValue)}</div>
        <div class="metric-subtext">Akumulasi estimasi deal aktif</div>
      </div>
      <div class="card metric-block" style="padding:16px; min-height:90px;">
        <div class="metric-label" style="color:var(--success);">Win / Conversion Rate</div>
        <div class="metric-value font-mono" style="color:var(--success); font-size: 20px; margin-top:6px;">${winRate}%</div>
        <div class="metric-subtext">Persentase deal yang disetujui</div>
      </div>
      <div class="card metric-block" style="padding:16px; min-height:90px;">
        <div class="metric-label">Avg. Deal Size</div>
        <div class="metric-value font-mono" style="font-size: 20px; margin-top:6px;">${formatIDR(avgDealSize)}</div>
        <div class="metric-subtext">Rata-rata anggaran per proposal</div>
      </div>
    </div>

    <!-- Kanban Pipeline Board -->
    <div class="proposals-kanban-board" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
      ${Object.entries(lanes).map(([statusKey, lane]) => {
        const laneTotal = lane.items.reduce((sum, item) => sum + (item.budget || 0), 0);
        return `
          <div class="kanban-lane" data-status="${statusKey}" style="display:flex; flex-direction:column; background:var(--bg-input); border-radius:var(--radius-lg); border:1px solid var(--border-color); padding:14px; min-height:480px;">
            <!-- Lane Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="kanban-dot" style="width:8px; height:8px; border-radius:50%; background:${lane.color}; display:inline-block;"></span>
                <span style="font-size:13px; font-weight:750; color:var(--text-primary);">${lane.title}</span>
              </div>
              <span style="font-size:11px; font-weight:600; color:var(--text-dim); background:var(--bg-card); padding:2px 6px; border-radius:4px; border:1px solid var(--border-subtle);">${lane.items.length}</span>
            </div>
            
            <div style="font-size:10px; font-weight:700; color:var(--text-dim); margin-bottom:12px; font-family:var(--font-mono);">
              Total: ${formatIDR(laneTotal)}
            </div>

            <!-- Cards Stack -->
            <div class="kanban-cards-stack" style="display:flex; flex-direction:column; gap:10px; flex:1;">
              ${lane.items.map(p => {
                const client = clients.find(c => c.id === p.clientId) || { name: 'Direct Client' };
                const validStr = p.validUntil ? `Valid: ${p.validUntil}` : '';
                return `
                  <div class="card kanban-proposal-card" style="padding:14px; cursor:pointer; border:1px solid var(--border-color); display:flex; flex-direction:column; gap:8px;" onclick="window.appInstance.handleProposalCardClick('${p.id}')">
                    <div style="font-size:13px; font-weight:750; color:var(--text-primary); line-height:1.4;">${escapeHtml(p.title)}</div>
                    <div style="font-size:11px; color:var(--text-muted); font-weight:600;">${escapeHtml(client.name)}</div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; border-top:1px solid var(--border-subtle); padding-top:8px;">
                      <span class="font-mono" style="font-size:11.5px; font-weight:750; color:var(--text-primary);">${formatIDR(p.budget || 0)}</span>
                      <span style="font-size:9.5px; color:var(--text-dim); font-weight:600;">${validStr}</span>
                    </div>

                    <!-- Lane Actions footer -->
                    <div style="display:flex; gap:6px; margin-top:4px;" class="kanban-card-actions" onclick="event.stopPropagation();">
                      ${statusKey === 'approved' ? `
                        <button type="button" class="btn btn-ghost btn-sm btn-convert-proposal" data-id="${p.id}" style="padding:2px 8px; font-size:10px; color:var(--success); background:var(--success-bg); border-color:transparent; flex:1; justify-content:center;">
                          <i data-lucide="zap"></i> Convert to Invoice
                        </button>
                      ` : ''}
                      <button type="button" class="btn btn-ghost btn-sm btn-edit-proposal" data-id="${p.id}" style="padding:4px; justify-content:center;" title="Edit Penawaran">
                        <i data-lucide="pencil" style="width:12px; height:12px;"></i>
                      </button>
                      <button type="button" class="btn btn-ghost btn-sm btn-delete-proposal" data-id="${p.id}" style="padding:4px; justify-content:center; color:var(--danger);" title="Hapus Penawaran">
                        <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('') || `
                <div style="flex:1; display:flex; align-items:center; justify-content:center; border: 1px dashed var(--border-color); border-radius:var(--radius-md); padding:20px; color:var(--text-dim); font-size:11.5px; text-align:center;">
                  No proposals here
                </div>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export async function getProposalFormModalHTML(proposal = {}) {
  const clients = await ApiService.getClients();
  
  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.name,
    subtext: c.company || 'Personal'
  }));

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent (Waiting Feedback)' },
    { value: 'approved', label: 'Approved (Accepted)' },
    { value: 'rejected', label: 'Rejected (Declined)' }
  ];

  return `
    <div class="modal-header">
      <h2>${proposal.id ? 'Edit Proposal Penawaran' : 'Buat Proposal Baru'}</h2>
      <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
    </div>
    <form id="form-proposal">
      <input type="hidden" name="id" value="${escapeHtml(proposal.id || '')}">
      
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Klien Sasaran *</label>
            ${renderCustomDropdown({
              name: 'clientId',
              value: proposal.clientId || '',
              options: clientOptions,
              placeholder: 'Pilih klien...',
              searchable: true,
              required: true
            })}
          </div>
          <div class="form-group">
            <label class="form-label">Status Proposal</label>
            ${renderCustomDropdown({
              name: 'status',
              value: proposal.status || 'draft',
              options: statusOptions
            })}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Judul Proposal Proyek *</label>
          <input type="text" name="title" class="form-control" value="${escapeHtml(proposal.title || '')}" required placeholder="e.g. Pembuatan Web E-Commerce PT Harapan">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Estimasi Anggaran Proyek *</label>
            <input type="number" name="budget" class="form-control" value="${proposal.budget || 0}" required min="0" placeholder="e.g. 15000000">
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Valid Hingga</label>
            <input type="date" name="validUntil" class="form-control" value="${escapeHtml(proposal.validUntil || '')}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Rincian & Cakupan Pekerjaan (Scope of Work)</label>
          <textarea name="description" class="form-control" style="min-height: 120px; resize: vertical;" placeholder="Tulis rincian penawaran, cakupan milestone, dan ketentuan penawaran proyek disini...">${escapeHtml(proposal.description || '')}</textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan Proposal</button>
      </div>
    </form>
  `;
}

export async function getProposalPreviewModalHTML(proposal, formatIDR) {
  const clients = await ApiService.getClients();
  const client = clients.find(c => String(c.id) === String(proposal.clientId)) || { name: 'Klien' };
  const user = ApiService.getUser();

  return `
    <div class="modal-header">
      <h2>Proposal: ${escapeHtml(proposal.title)}</h2>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary btn-sm" id="btn-copy-proposal-link" data-id="${proposal.id}">
          <i data-lucide="link"></i> Copy Link
        </button>
        <button class="btn btn-primary btn-sm" id="btn-export-proposal-pdf">
          <i data-lucide="download"></i> Download PDF
        </button>
        <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
    </div>
    <div class="modal-body" style="background:#0a0a0c; padding:28px 24px; max-height:80vh; overflow-y:auto;">
      <div class="document-preview" id="proposal-printable-area" style="background:#ffffff; color:#0f172a; padding:44px; font-family:sans-serif; max-width:800px; margin:0 auto;">
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:18px; margin-bottom:24px;">
          <div>
            <h2 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">${escapeHtml(user.company || user.name || 'SoloSuite Provider')}</h2>
            <div style="font-size:11px; color:#64748b;">${escapeHtml(user.email || '')}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px; font-weight:900; color:#0f172a; letter-spacing:0.02em;">PENAWARAN PROYEK</div>
            <div style="font-size:10px; color:#64748b; margin-top:4px;">Valid S.d: ${escapeHtml(proposal.validUntil || '—')}</div>
          </div>
        </div>

        <!-- Target client details -->
        <div style="margin-bottom:24px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
          <span style="font-size:9px; font-weight:700; color:#64748b;">DISIAPKAN UNTUK:</span>
          <strong style="display:block; font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">${escapeHtml(client.company || client.name)}</strong>
          <div style="font-size:11px; color:#475569; margin-top:2px;">
            PIC: ${escapeHtml(client.name)} &bull; Email: ${escapeHtml(client.email || '—')}
          </div>
        </div>

        <!-- Details SoW Section -->
        <div style="margin-bottom:28px;">
          <h3 style="font-size:13px; font-weight:800; border-bottom:2px solid #0f172a; padding-bottom:6px; margin-bottom:12px; color:#0f172a;">CAKUPAN PEKERJAAN (SCOPE OF WORK)</h3>
          <div style="font-size:12px; color:#334155; line-height:1.7; white-space:pre-line;">
            ${escapeHtml(proposal.description || 'Tidak ada cakupan pekerjaan tambahan ditulis.')}
          </div>
        </div>

        <!-- Budget Summary -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:16px 20px;">
          <div>
            <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">Estimasi Anggaran Investasi Proyek</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">Sudah termasuk seluruh milestone tertulis</div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:18px; font-weight:900; color:#0f172a;" class="font-mono">${formatIDR(proposal.budget || 0)}</span>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px; margin-top:48px; padding-top:32px; border-top:1px solid #e2e8f0;">
          <div>
            <div style="font-size:11px; color:#64748b; margin-bottom:48px;">Disiapkan Oleh,</div>
            <div style="font-size:12px; font-weight:800; color:#0f172a; border-top:1px solid #cbd5e1; padding-top:6px; width:180px;">
              ${escapeHtml(user.name)}
            </div>
          </div>
          <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end;">
            <div style="font-size:11px; color:#64748b; margin-bottom:48px;">Menyetujui Klien,</div>
            <div style="font-size:12px; font-weight:800; color:#0f172a; border-top:1px solid #cbd5e1; padding-top:6px; width:180px; text-align:center;">
              ${escapeHtml(client.name)}
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
