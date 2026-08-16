// Apple-style Skeleton Loader Component for SolSuite

export function renderSkeletonLoader() {
  return `
    <div class="skeleton-container fade-in-view" style="display:flex; flex-direction:column; gap:20px;">
      <!-- Skeleton Metric Cards -->
      <div class="grid-4" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
        ${[1, 2, 3, 4].map(() => `
          <div class="skeleton-shimmer skeleton-card"></div>
        `).join('')}
      </div>

      <!-- Skeleton Rows Table Container -->
      <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:24px;">
        <div class="skeleton-shimmer" style="height:24px; width:200px; margin-bottom:24px;"></div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${[1, 2, 3, 4, 5].map(() => `
            <div class="skeleton-shimmer skeleton-row"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
