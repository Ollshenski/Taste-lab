/* Taste Lab — legal/info pages (terms, privacy, contact) and the shared page footer. */
(function () {
  const { esc } = window.TL;
  const $ = (s, r = document) => r.querySelector(s);

  // Fills {{placeholders}} from settings; anything not filled in yet is flagged visibly.
  function fill(text, s) {
    const values = {
      company: s.companyName, companyId: s.companyId, legalAddress: s.legalAddress,
      phone: s.phone, email: s.email, address: s.address, currency: s.currency || '₾',
      deliveryFee: s.deliveryFee, freeDeliveryFrom: s.freeDeliveryFrom,
    };
    return esc(text).replace(/\{\{(\w+)\}\}/g, (m, k) => {
      const v = values[k];
      return v === '' || v == null ? '<mark class="todo">[შეავსეთ ადმინში]</mark>' : esc(v);
    });
  }

  // "## " heading, "- " list item, blank line = new paragraph.
  function render(body, s) {
    return body.split(/\n\s*\n/).map((block) => {
      const lines = block.split('\n').filter((l) => l.trim());
      if (!lines.length) return '';
      if (lines[0].startsWith('## ')) {
        const rest = lines.slice(1);
        return `<h2>${fill(lines[0].slice(3), s)}</h2>` + (rest.length ? render(rest.join('\n'), s) : '');
      }
      if (lines.every((l) => l.startsWith('- '))) {
        return `<ul>${lines.map((l) => `<li>${fill(l.slice(2), s)}</li>`).join('')}</ul>`;
      }
      return `<p>${lines.map((l) => fill(l, s)).join('<br>')}</p>`;
    }).join('');
  }

  function contact(s) {
    const row = (label, value, href) => value
      ? `<div class="kv-row"><span class="mono">${label}</span>${href ? `<a href="${esc(href)}">${esc(value)}</a>` : `<b>${esc(value)}</b>`}</div>`
      : '';
    const socials = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']]
      .filter(([k]) => /^https?:\/\//.test(s[k] || ''))
      .map(([k, l]) => `<a href="${esc(s[k])}" target="_blank" rel="noopener">${l} ↗</a>`).join(' · ');
    return `
      <div class="contact-grid">
        <section class="panel">
          <h2>დაგვიკავშირდით</h2>
          ${row('ტელეფონი', s.phone, 'tel:' + String(s.phone || '').replace(/[^+\d]/g, ''))}
          ${row('ელ-ფოსტა', s.email, 'mailto:' + (s.email || ''))}
          ${row('მისამართი', s.address)}
          ${row('სამუშაო საათები', s.hours)}
          ${socials ? `<div class="kv-row"><span class="mono">სოციალური ქსელები</span><span>${socials}</span></div>` : ''}
        </section>
        <section class="panel">
          <h2>რეკვიზიტები</h2>
          <div class="kv-row"><span class="mono">კომპანია</span><b>${fill('{{company}}', s)}</b></div>
          <div class="kv-row"><span class="mono">საიდენთიფიკაციო კოდი</span><b>${fill('{{companyId}}', s)}</b></div>
          <div class="kv-row"><span class="mono">იურიდიული მისამართი</span><b>${fill('{{legalAddress}}', s)}</b></div>
          <p class="muted-note">იხილეთ ასევე: <a href="/terms">მომსახურების პირობები</a> · <a href="/privacy">კონფიდენციალურობის პოლიტიკა</a></p>
        </section>
      </div>`;
  }

  window.TLFooter = function footer(s) {
    const company = [s.companyName, s.companyId && 'ს/კ ' + s.companyId].filter(Boolean).join(', ');
    return `
      <div class="legal-bar container">
        <nav class="legal-links" aria-label="ინფორმაცია">
          <a href="/terms">მომსახურების პირობები</a>
          <a href="/privacy">კონფიდენციალურობის პოლიტიკა</a>
          <a href="/contact">კონტაქტი</a>
        </nav>
        <div class="pay-logos" aria-label="მიღებული გადახდის მეთოდები">
          <img src="/assets/pay/visa.svg" alt="Visa" width="50" height="32">
          <img src="/assets/pay/mastercard.svg" alt="Mastercard" width="50" height="32">
          <img src="/assets/pay/googlepay.svg" alt="Google Pay" width="50" height="32">
          <img src="/assets/pay/applepay.svg" alt="Apple Pay" width="50" height="32">
        </div>
      </div>
      <div class="container legal-company mono">© ${new Date().getFullYear()} ${esc(company || 'Taste Lab')}</div>`;
  };

  const root = $('[data-page]');
  if (!root) return;
  window.TL.loadSite().then((site) => {
    const s = site.settings;
    const key = root.dataset.page;
    if (key === 'contact') {
      root.innerHTML = `<p class="eyebrow mono">// contact</p><h1>კონტაქტი</h1>${contact(s)}`;
    } else {
      const page = site.content.pages?.[key];
      if (!page) return;
      document.title = page.title + ' — Taste Lab';
      root.innerHTML = `<p class="eyebrow mono">// ${esc(key)}</p><h1>${esc(page.title)}</h1><article class="panel legal">${render(page.body, s)}</article>`;
    }
    const f = $('[data-site-footer]');
    if (f) f.innerHTML = window.TLFooter(s);
  }).catch(() => window.TL.toast('ჩატვირთვა ვერ მოხერხდა. განაახლეთ გვერდი.'));
})();
