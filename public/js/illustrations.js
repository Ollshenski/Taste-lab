/* Taste Lab — hand-drawn style SVG illustrations, shared by the shop and admin.
   Every illustration uses a 200×200 viewBox, thick ink outlines and brand colours. */
(function () {
  const INK = '#151515';
  const CREAM = '#FFF6EC';
  const S = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
    const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  const parts = {
    strawberry: (c) => `
      <path d="M100 172C62 146 36 110 40 78c4-26 30-36 60-24 30-12 56-2 60 24 4 32-22 68-60 94z" fill="${c}" ${S}/>
      <path d="M58 82c4-12 14-18 24-18" fill="none" stroke="${shade(c, 0.45)}" stroke-width="7" stroke-linecap="round"/>
      ${[[72, 96], [100, 88], [128, 96], [86, 118], [114, 118], [100, 142], [70, 124], [130, 124]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="5.5" fill="${CREAM}"/>`).join('')}
      <path d="M100 58c-10-14-28-18-40-12 10 4 18 10 22 18-12-2-24 2-30 10 14 0 28-2 48-10 20 8 34 10 48 10-6-8-18-12-30-10 4-8 12-14 22-18-12-6-30-2-40 12z" fill="#43A047" ${S}/>
      <path d="M100 56V36" ${S} fill="none"/>`,

    raspberry: (c) => {
      const dots = [];
      for (let row = 0; row < 5; row++) {
        const count = [4, 5, 4, 3, 2][row];
        for (let i = 0; i < count; i++) {
          const x = 100 + (i - (count - 1) / 2) * 24;
          const y = 78 + row * 20;
          dots.push(`<circle cx="${x}" cy="${y}" r="13" fill="${c}" ${S}/><circle cx="${x - 4}" cy="${y - 4}" r="3.5" fill="${shade(c, 0.55)}"/>`);
        }
      }
      return dots.join('') + `<path d="M100 66c-14-10-30-8-38-2 12 2 20 6 24 12-10 0-18 4-22 10 14-2 26-6 36-12 10 6 22 10 36 12-4-6-12-10-22-10 4-6 12-10 24-12-8-6-24-8-38 2z" fill="#43A047" ${S}/>`;
    },

    banana: (c) => {
      const coin = (x, y, r) => `
        <circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${S}/>
        <circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="${shade(c, 0.6)}"/>
        ${[0, 60, 120, 180, 240, 300].map((a) => {
          const rad = (a * Math.PI) / 180;
          return `<circle cx="${x + Math.cos(rad) * r * 0.28}" cy="${y + Math.sin(rad) * r * 0.28}" r="2.6" fill="${INK}" opacity=".55"/>`;
        }).join('')}`;
      return coin(70, 120, 38) + coin(130, 92, 40) + coin(118, 150, 28);
    },

    apple: (c) => `
      <circle cx="100" cy="104" r="66" fill="${c}" ${S}/>
      <circle cx="100" cy="104" r="54" fill="${CREAM}"/>
      <path d="M100 74c10 12 22 18 22 30s-12 18-22 30c-10-12-22-18-22-30s12-18 22-30z" fill="none" stroke="${shade(c, -0.15)}" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>
      ${[[100, 92], [112, 104], [100, 116], [88, 104]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="6" fill="#5D3A1A" transform="rotate(${(Math.atan2(y - 104, x - 100) * 180) / Math.PI + 90} ${x} ${y})"/>`).join('')}
      <circle cx="100" cy="104" r="12" fill="#FFFFFF" opacity=".6"/>
      <path d="M100 38c0-8 4-14 10-18" ${S} fill="none"/>`,

    mango: (c) => {
      const cube = (x, y, s) => `
        <g transform="translate(${x} ${y})">
          <path d="M0 ${-s}L${s} ${-s / 2}L0 0L${-s} ${-s / 2}z" fill="${shade(c, 0.35)}" ${S}/>
          <path d="M${-s} ${-s / 2}L0 0V${s}L${-s} ${s / 2}z" fill="${c}" ${S}/>
          <path d="M${s} ${-s / 2}L0 0V${s}L${s} ${s / 2}z" fill="${shade(c, -0.12)}" ${S}/>
        </g>`;
      return cube(72, 112, 30) + cube(130, 96, 34) + cube(108, 150, 24);
    },

    blueberry: (c) => {
      const berry = (x, y, r) => `
        <circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${S}/>
        <path d="M${x - r * 0.3} ${y - r * 0.55}l${r * 0.3} ${r * 0.22} ${r * 0.3} ${-r * 0.22}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="${x - r * 0.42}" cy="${y + r * 0.1}" r="${r * 0.14}" fill="${shade(c, 0.6)}"/>`;
      return berry(74, 116, 34) + berry(130, 100, 38) + berry(112, 152, 26);
    },

    drop: (c, x = 100, y = 100, k = 1) => `
      <g transform="translate(${x} ${y}) scale(${k}) translate(-100 -100)">
        <path d="M100 34c10 30 54 50 54 90 0 30-24 46-54 46s-54-16-54-46c0-40 44-60 54-90z" fill="${c}" ${S}/>
        <path d="M70 120c0-14 8-26 18-34" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".7"/>
        <path d="M60 140c20 10 60 10 80 0" fill="none" stroke="${shade(c, -0.15)}" stroke-width="4" stroke-linecap="round" opacity=".6"/>
      </g>`,
  };

  function yogurt(tint) {
    const light = shade(tint, 0.55);
    return parts.drop(light, 72, 118, 0.6) + parts.drop(shade(tint, 0.3), 132, 96, 0.68) + parts.drop(light, 112, 156, 0.42);
  }

  const library = {
    strawberry: (c) => parts.strawberry(c),
    raspberry: (c) => parts.raspberry(c),
    banana: (c) => parts.banana(c),
    apple: (c) => parts.apple(c),
    mango: (c) => parts.mango(c),
    blueberry: (c) => parts.blueberry(c),
    'yogurt-strawberry': () => yogurt('#F25C78'),
    'yogurt-blueberry': () => yogurt('#6C5CE7'),
    'yogurt-mango': () => yogurt('#FFB020'),
    'yogurt-plain': () => yogurt('#E8DCCB'),
    mix: () => `
      <g transform="translate(-28 -18) scale(.62)">${parts.strawberry('#E63946')}</g>
      <g transform="translate(70 -4) scale(.6)">${parts.mango('#FFB020')}</g>
      <g transform="translate(6 70) scale(.58)">${parts.banana('#F6C945')}</g>
      ${parts.drop(shade('#F25C78', 0.5), 140, 140, 0.42)}`,
  };

  const NAMES = {
    strawberry: 'მარწყვი', raspberry: 'ჟოლო', banana: 'ბანანი', apple: 'ვაშლი', mango: 'მანგო', blueberry: 'მოცვი',
    'yogurt-strawberry': 'იოგურტი + მარწყვი', 'yogurt-blueberry': 'იოგურტი + მოცვი', 'yogurt-mango': 'იოგურტი + მანგო',
    'yogurt-plain': 'იოგურტი', mix: 'მიქსი',
  };

  function illo(key, color, className = '') {
    const draw = library[key] || library.strawberry;
    return `<svg class="${className}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${draw(color || '#F58220')}</svg>`;
  }

  window.TLIllo = { illo, keys: Object.keys(library), names: NAMES, shade };
})();
