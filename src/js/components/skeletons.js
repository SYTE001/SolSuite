/**
 * Lightweight placeholders for data-bound list views. Keeping this markup free
 * of icons and controls makes route changes paint before any async work starts.
 */
export function getSkeletonHTML(view) {
  const labels = {
    invoices: ['Invoice', 'Title', 'Client', 'Due date', 'Amount', 'Status'],
    proposals: ['Proposal', 'Client', 'Timeline', 'Budget', 'Status', 'Actions'],
    reminders: ['Task', 'Notes', 'Schedule', 'Category', 'Status', 'Actions'],
    clients: ['Client', 'Company', 'Email', 'Phone / WA', 'Status', 'Actions']
  };

  const columns = labels[view] || labels.invoices;
  return `
    <div class="card view-skeleton" aria-busy="true" aria-label="Loading ${view}">
      <div class="table-responsive table-container">
        <table>
          <thead><tr>${columns.map(label => `<th>${label}</th>`).join('')}</tr></thead>
          <tbody>
            ${Array.from({ length: 6 }, () => `
              <tr>${columns.map((_, index) => `
                <td><span class="skeleton skeleton-table-cell skeleton-table-cell-${index % 3}"></span></td>
              `).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
