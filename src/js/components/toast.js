import { escapeHTML } from '../utils/sanitize.js';

export function showToast(message, type = 'error', title = null) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100% - 48px);
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Prevent duplicate consecutive toasts with identical message
  const existingToasts = Array.from(container.children);
  const isDuplicate = existingToasts.some(t => t.dataset.msg === message);
  if (isDuplicate) return;

  // Limit visible toasts
  if (container.children.length >= 3) {
    container.children[0].remove();
  }

  const isError = type === 'error' || type === 'danger';
  const isSuccess = type === 'success';

  const accentColor = isError ? '#ff453a' : isSuccess ? '#30d158' : '#0071e3';
  const bgGlow = isError ? 'rgba(255, 69, 58, 0.15)' : isSuccess ? 'rgba(48, 209, 88, 0.15)' : 'rgba(0, 113, 227, 0.15)';
  
  const iconSvg = isError ? `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ` : isSuccess ? `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ` : `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  `;

  const defaultTitle = isError ? 'Pemberitahuan' : isSuccess ? 'Sukses' : 'Informasi';
  const displayTitle = title || defaultTitle;

  const toast = document.createElement('div');
  toast.dataset.msg = message;
  toast.style.pointerEvents = 'auto';
  toast.style.cssText = `
    background: rgba(10, 10, 14, 0.94);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-left: 3px solid ${accentColor};
    color: #f4f4f5;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13.5px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transform: translateY(20px) scale(0.96);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", Helvetica, Arial, sans-serif;
    line-height: 1.4;
  `;

  toast.innerHTML = `
    <div style="padding: 4px; border-radius: 8px; background: ${bgGlow}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
      ${iconSvg}
    </div>
    <div style="flex-grow: 1; word-break: break-word;">
      ${title ? `<div style="font-weight: 600; color: #ffffff; margin-bottom: 2px; font-size: 12.5px;">${escapeHTML(displayTitle)}</div>` : ''}
      <div style="color: rgba(255, 255, 255, 0.92); font-size: 13px; font-weight: 450;">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close-btn" aria-label="Close" style="background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 2px; font-size: 14px; line-height: 1; border-radius: 4px; transition: color 0.15s ease;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='rgba(255, 255, 255, 0.4)'">
      ✕
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn?.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px) scale(0.96)';
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  // Trigger smooth entrance
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0) scale(1)';
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px) scale(0.96)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
}
