export function getLogoIconSVG(size = 30, className = '') {
  return `
    <svg class="solosuite-logo-icon ${className}" style="width:${size}px; height:${size}px; display:inline-block; vertical-align:middle; flex-shrink:0;" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="12" width="76" height="76" rx="22" ry="22" stroke="currentColor" stroke-width="7" fill="none"/>
      <path d="M 38 40 C 38 28 50 24 60 28 C 70 32 74 44 68 54 C 64 60 56 62 56 60" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 62 60 C 62 72 50 76 40 72 C 30 68 26 56 32 46 C 36 40 44 38 44 40" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="38" cy="40" r="4.5" fill="currentColor"/>
      <circle cx="62" cy="60" r="4.5" fill="currentColor"/>
      <circle cx="56" cy="60" r="4.5" fill="currentColor"/>
      <circle cx="44" cy="40" r="4.5" fill="currentColor"/>
    </svg>
  `;
}
