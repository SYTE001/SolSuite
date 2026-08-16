import { ApiService, escapeHtml } from '../api.js';
import { renderCustomDropdown } from './dropdown.js';

export async function renderRemindersView() {
  const reminders = await ApiService.getReminders();
  const nowStr = new Date().toISOString().split('T')[0];

  const urgent = [];
  const upcoming = [];
  const completed = [];

  reminders.forEach(r => {
    if (r.status === 'completed') {
      completed.push(r);
    } else {
      const isOverdue = r.dueDate && r.dueDate < nowStr;
      const isToday = r.dueDate === nowStr;
      if (isOverdue || isToday) {
        urgent.push(r);
      } else {
        upcoming.push(r);
      }
    }
  });

  // Sort lists by date
  const sortByDate = (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '');
  urgent.sort(sortByDate);
  upcoming.sort(sortByDate);
  completed.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || '')); // completed newest first

  const priorityBadge = (prio) => {
    const p = String(prio || 'medium').toLowerCase();
    if (p === 'high') return `<span class="badge-status overdue" style="font-size:9.5px; font-weight:700;">HIGH PRIORITY</span>`;
    if (p === 'low') return `<span class="badge-status draft" style="font-size:9.5px; font-weight:700;">LOW PRIORITY</span>`;
    return `<span class="badge-status sent" style="font-size:9.5px; font-weight:700;">MEDIUM PRIORITY</span>`;
  };

  return `
    <div class="view-toolbar" style="margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary);">Agenda & Pengingat</h2>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Atur tenggat waktu penagihan dan agenda operasional harian Anda</p>
      </div>
      <button class="btn btn-primary" id="btn-add-reminder" type="button">
        <i data-lucide="bell"></i>
        <span>Tambah Pengingat</span>
      </button>
    </div>

    <div class="reminders-layout-container" style="display:flex; flex-direction:column; gap:28px;">
      
      <!-- Section 1: Urgent (Overdue / Due Today) -->
      <div>
        <div class="cmd-group-title" style="padding-left:0; margin-bottom:12px; display:flex; align-items:center; gap:6px; color:var(--danger);">
          <i data-lucide="alert-circle" style="width:14px; height:14px;"></i> URGENT (MELEWATI TENGGAT / HARI INI)
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${urgent.map(r => `
            <div class="card reminder-urgent-card" style="padding:14px 18px; display:flex; align-items:center; justify-content:space-between; border-left: 4px solid var(--danger); background:var(--danger-bg); border-color:var(--danger); border-top-left-radius:0; border-bottom-left-radius:0;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:14px; font-weight:750; color:var(--text-primary);">${escapeHtml(r.title || r.task)}</div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:11px; font-weight:600; color:var(--danger);" class="font-mono">Due: ${escapeHtml(r.dueDate)} (Jatuh Tempo!)</span>
                  &bull;
                  ${priorityBadge(r.priority)}
                </div>
                ${r.description ? `<p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">${escapeHtml(r.description)}</p>` : ''}
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-ghost btn-sm btn-complete-reminder" data-id="${r.id}" style="color:var(--success); border-color:transparent; background:rgba(74,222,128,0.12);" title="Selesaikan">
                  <i data-lucide="check"></i> Selesai
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-reminder" data-id="${r.id}" style="color:var(--danger); border-color:transparent; padding:0 8px;" title="Hapus">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `).join('') || `
            <div style="padding:16px; border: 1px dashed var(--border-color); border-radius:var(--radius-md); text-align:center; color:var(--text-dim); font-size:12.5px;">
              Bagus! Tidak ada agenda mendesak yang melewati tenggat waktu.
            </div>
          `}
        </div>
      </div>

      <!-- Section 2: Upcoming (Due Later) -->
      <div>
        <div class="cmd-group-title" style="padding-left:0; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="calendar" style="width:14px; height:14px;"></i> MENDATANG (AKAN DATANG)
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${upcoming.map(r => `
            <div class="card reminder-upcoming-card" style="padding:14px 18px; display:flex; align-items:center; justify-content:space-between; border: 1px solid var(--border-color);">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:14px; font-weight:750; color:var(--text-primary);">${escapeHtml(r.title || r.task)}</div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:11px; font-weight:600; color:var(--text-muted);" class="font-mono">Due: ${escapeHtml(r.dueDate)}</span>
                  &bull;
                  ${priorityBadge(r.priority)}
                </div>
                ${r.description ? `<p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">${escapeHtml(r.description)}</p>` : ''}
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-ghost btn-sm btn-complete-reminder" data-id="${r.id}" style="color:var(--success); border-color:transparent;" title="Selesaikan">
                  <i data-lucide="check"></i> Selesai
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-reminder" data-id="${r.id}" style="color:var(--text-dim); border-color:transparent; padding:0 8px;" title="Hapus">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `).join('') || `
            <div style="padding:16px; border: 1px dashed var(--border-color); border-radius:var(--radius-md); text-align:center; color:var(--text-dim); font-size:12.5px;">
              Belum ada agenda mendatang dijadwalkan.
            </div>
          `}
        </div>
      </div>

      <!-- Section 3: Completed (Muted) -->
      <div>
        <div class="cmd-group-title" style="padding-left:0; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="check-circle" style="width:14px; height:14px;"></i> RIWAYAT SELESAI
        </div>
        
        <div style="display:flex; flex-direction:column; gap:8px; opacity:0.65;">
          ${completed.slice(0, 10).map(r => `
            <div class="card" style="padding:10px 16px; display:flex; align-items:center; justify-content:space-between; background:var(--bg-input); border:1px solid var(--border-subtle);">
              <div style="text-decoration:line-through; font-size:13px; color:var(--text-muted); font-weight:500;">
                ${escapeHtml(r.title || r.task)} 
                <span style="font-size:10px; font-family:var(--font-mono); margin-left:8px; text-decoration:none; display:inline-block; color:var(--text-dim);">[Done: ${escapeHtml(r.dueDate)}]</span>
              </div>
              <button class="btn btn-ghost btn-sm btn-delete-reminder" data-id="${r.id}" style="color:var(--danger); border-color:transparent; padding:4px;" title="Hapus Permanen">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          `).join('') || `
            <div style="padding:12px; text-align:center; color:var(--text-dim); font-size:12.0px;">
              Belum ada riwayat agenda selesai.
            </div>
          `}
        </div>
      </div>

    </div>
  `;
}

export function getReminderFormModalHTML(reminder = {}) {
  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  return `
    <div class="modal-header">
      <h2>${reminder.id ? 'Edit Pengingat' : 'Buat Pengingat Baru'}</h2>
      <button class="btn-icon modal-close" aria-label="Close"><i data-lucide="x"></i></button>
    </div>
    <form id="form-reminder">
      <input type="hidden" name="id" value="${escapeHtml(reminder.id || '')}">
      
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label">Nama Agenda / Aktivitas *</label>
          <input type="text" name="title" class="form-control" value="${escapeHtml(reminder.title || reminder.task || '')}" required placeholder="e.g. Follow-up invoice klien PT Harapan">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Tanggal Jatuh Tempo *</label>
            <input type="date" name="dueDate" class="form-control" value="${escapeHtml(reminder.dueDate || new Date().toISOString().split('T')[0])}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Prioritas</label>
            ${renderCustomDropdown({
              name: 'priority',
              value: reminder.priority || 'medium',
              options: priorityOptions
            })}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Catatan Agenda (Optional)</label>
          <textarea name="description" class="form-control" style="min-height: 80px; resize: vertical;" placeholder="Tulis catatan detil agenda disini...">${escapeHtml(reminder.description || '')}</textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Batal</button>
        <button type="submit" class="btn btn-primary">Simpan Pengingat</button>
      </div>
    </form>
  `;
}
