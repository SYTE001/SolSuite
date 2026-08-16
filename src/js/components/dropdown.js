import { escapeHtml } from '../api.js';

/**
 * Generates HTML for a custom reusable dropdown component.
 * @param {Object} config
 * @param {string} config.name - Name for the hidden form input
 * @param {string} [config.value] - Currently selected value
 * @param {Array<Object|string>} config.options - Array of {value, label, subtext} or strings
 * @param {string} [config.placeholder] - Placeholder text when nothing selected
 * @param {boolean} [config.searchable] - Whether to show search box
 * @param {boolean} [config.required] - Required field
 * @returns {string} HTML string
 */
export function renderCustomDropdown({
  name,
  value = '',
  options = [],
  placeholder = 'Select option...',
  searchable = false,
  required = false
}) {
  // Normalize options to { value, label, subtext }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: String(opt.value),
        label: String(opt.label || opt.value),
        subtext: opt.subtext ? String(opt.subtext) : ''
      };
    }
    return { value: String(opt), label: String(opt), subtext: '' };
  });

  const selectedOpt = normalizedOptions.find(o => o.value === String(value));
  const displayLabel = selectedOpt ? selectedOpt.label : placeholder;
  const isPlaceholder = !selectedOpt;

  return `
    <div class="custom-dropdown" data-name="${escapeHtml(name)}" data-searchable="${searchable ? 'true' : 'false'}">
      <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${required ? 'required' : ''}>
      <button type="button" class="custom-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="custom-dropdown-label ${isPlaceholder ? 'placeholder' : ''}">${escapeHtml(displayLabel)}</span>
        <i data-lucide="chevron-down" class="custom-dropdown-chevron"></i>
      </button>
      <div class="custom-dropdown-popover" role="listbox">
        ${searchable ? `
          <div class="custom-dropdown-search-box">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="custom-dropdown-search" placeholder="Search..." autocomplete="off">
          </div>
        ` : ''}
        <div class="custom-dropdown-list">
          ${normalizedOptions.map(opt => {
            const isSelected = opt.value === String(value);
            return `
              <div class="custom-dropdown-option ${isSelected ? 'selected' : ''}" data-value="${escapeHtml(opt.value)}" role="option" aria-selected="${isSelected}">
                <div class="option-text">
                  <div class="option-label">${escapeHtml(opt.label)}</div>
                  ${opt.subtext ? `<div class="option-subtext">${escapeHtml(opt.subtext)}</div>` : ''}
                </div>
                ${isSelected ? '<i data-lucide="check" class="option-check"></i>' : ''}
              </div>
            `;
          }).join('')}
          <div class="custom-dropdown-no-results" style="display:none;">No results found</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attaches event handlers to custom dropdowns inside a parent container.
 * @param {HTMLElement} parentElement
 */
export function initCustomDropdowns(parentElement = document) {
  const dropdowns = parentElement.querySelectorAll('.custom-dropdown');

  dropdowns.forEach(dropdown => {
    if (dropdown.dataset.initialized === 'true') return;
    dropdown.dataset.initialized = 'true';

    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    const popover = dropdown.querySelector('.custom-dropdown-popover');
    const labelSpan = dropdown.querySelector('.custom-dropdown-label');
    const searchInput = dropdown.querySelector('.custom-dropdown-search');
    const options = dropdown.querySelectorAll('.custom-dropdown-option');
    const noResults = dropdown.querySelector('.custom-dropdown-no-results');

    let focusedIdx = -1;

    const open = () => {
      // Close any other open dropdowns first
      document.querySelectorAll('.custom-dropdown.open').forEach(d => {
        if (d !== dropdown) closeDropdown(d);
      });

      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      if (searchInput) {
        searchInput.value = '';
        filterOptions('');
        setTimeout(() => searchInput.focus(), 30);
      }
      if (window.lucide) window.lucide.createIcons();
    };

    const close = () => {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      focusedIdx = -1;
      options.forEach(opt => opt.classList.remove('highlighted'));
    };

    const closeDropdown = (d) => {
      d.classList.remove('open');
      const trg = d.querySelector('.custom-dropdown-trigger');
      if (trg) trg.setAttribute('aria-expanded', 'false');
    };

    const selectOption = (optEl) => {
      const val = optEl.dataset.value;
      const labelEl = optEl.querySelector('.option-label');
      const labelText = labelEl ? labelEl.textContent : val;

      hiddenInput.value = val;
      labelSpan.textContent = labelText;
      labelSpan.classList.remove('placeholder');

      // Dispatch change event on hidden input
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Update selected state UI
      options.forEach(o => {
        o.classList.remove('selected');
        o.setAttribute('aria-selected', 'false');
        const chk = o.querySelector('.option-check');
        if (chk) chk.remove();
      });

      optEl.classList.add('selected');
      optEl.setAttribute('aria-selected', 'true');

      const checkIcon = document.createElement('i');
      checkIcon.setAttribute('data-lucide', 'check');
      checkIcon.className = 'option-check';
      optEl.appendChild(checkIcon);

      if (window.lucide) window.lucide.createIcons();
      close();
      trigger.focus();
    };

    const filterOptions = (query) => {
      const q = query.toLowerCase().trim();
      let count = 0;

      options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        if (text.includes(q)) {
          opt.style.display = 'flex';
          count++;
        } else {
          opt.style.display = 'none';
        }
      });

      if (noResults) {
        noResults.style.display = count === 0 ? 'block' : 'none';
      }
    };

    // Trigger Click
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('open')) {
        close();
      } else {
        open();
      }
    });

    // Search Input Typing
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterOptions(e.target.value);
      });
      searchInput.addEventListener('click', (e) => e.stopPropagation());
    }

    // Option Clicks
    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(opt);
      });
    });

    // Keyboard Navigation
    dropdown.addEventListener('keydown', (e) => {
      if (!dropdown.classList.contains('open')) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
        return;
      }

      const visibleOptions = Array.from(options).filter(o => o.style.display !== 'none');

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        trigger.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIdx = Math.min(focusedIdx + 1, visibleOptions.length - 1);
        highlightOption(visibleOptions, focusedIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIdx = Math.max(focusedIdx - 1, 0);
        highlightOption(visibleOptions, focusedIdx);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIdx >= 0 && visibleOptions[focusedIdx]) {
          selectOption(visibleOptions[focusedIdx]);
        }
      }
    });

    function highlightOption(visibleOptions, idx) {
      options.forEach(o => o.classList.remove('highlighted'));
      if (visibleOptions[idx]) {
        visibleOptions[idx].classList.add('highlighted');
        visibleOptions[idx].scrollIntoView({ block: 'nearest' });
      }
    }
  });

  // Global Outside Click to Close
  if (!window._dropdownGlobalClickListener) {
    window._dropdownGlobalClickListener = true;
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
          d.classList.remove('open');
          const trg = d.querySelector('.custom-dropdown-trigger');
          if (trg) trg.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }
}
