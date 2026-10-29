/* Taste Lab — storefront interactions. */
(function () {
  const { esc, money, get, toast, visual, cart } = window.TL;
  const { illo } = window.TLIllo;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATEGORY = { yogurt: 'მაწონი / იოგურტი', fruit: 'ხილი', sweets: 'ტკბილეული', mix: 'მიქსი' };
  const FILTER_ICON = { yogurt: '🥛', fruit: '🍓', sweets: '🍬', mix: '🧪' };

  let site;
  let filter = 'all';

  init().catch((err) => {
    console.error(err);
    toast('საიტის ჩატვირთვა ვერ მოხერხდა. განაახლეთ გვერდი.');
  });

  async function init() {
    site = await window.TL.loadSite();
    cart.reconcile();
    bindContent();
    renderStats();
    renderFilters();
    renderProducts();
    renderSteps();
    renderMixer();
    renderBenefits();
    renderReviews();
    renderFaq();
    renderFooter();
    renderCart();
    cart.onChange(renderCart);
    setupHeader();
    setupHero();
    setupReveal();
    setupCompare();
    setupCart();
    setupNewsletter();
    if (location.hash === '#cart') openCart();
  }

  /* ------------------------------------------------------------ content */

  function bindContent() {
    $$('[data-bind]').forEach((el) => {
      const v = get(site.content, el.dataset.bind);
      if (v != null) el.textContent = v;
    });
    $$('[data-bind-setting]').forEach((el) => (el.textContent = site.settings[el.dataset.bindSetting] || ''));
    const a = site.content.announcement || '';
    $('.announce__track').innerHTML = Array(6).fill(`<span>${esc(a)}</span>`).join('');

    // Split highlight word into letters for the "crunch" wobble.
    const hl = $('[data-crunch]');
    hl.innerHTML = [...hl.textContent].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join('');
    hl.addEventListener('mouseenter', () => crunch(hl));
    hl.addEventListener('click', () => crunch(hl));
  }

  function crunch(el) {
    el.classList.remove('is-crunching');
    void el.offsetWidth;
    el.classList.add('is-crunching');
  }

  function renderStats() {
    $('[data-stats]').innerHTML = site.content.stats.map((s) => `
      <div class="stat reveal">
        <strong><span data-count="${esc(s.value)}">${esc(s.value)}</span><small>${esc(s.suffix)}</small></strong>
        <span>${esc(s.label)}</span>
      </div>`).join('');
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    if (!Number.isFinite(target) || reduced) return;
    const start = performance.now();
    const dur = 1400;
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------- products */

  // Only show category chips that have products on sale.
  function renderFilters() {
    const cats = Object.keys(CATEGORY).filter((c) => site.products.some((p) => p.category === c));
    $('[data-filters]').hidden = cats.length < 2;
    $('[data-filters]').innerHTML = [['all', 'ყველა'], ...cats.map((c) => [c, `${FILTER_ICON[c]} ${CATEGORY[c]}`])]
      .map(([k, l]) => `<button class="chip ${k === filter ? 'is-active' : ''}" role="tab" aria-selected="${k === filter}" data-filter="${k}">${esc(l)}</button>`).join('');
  }

  function renderProducts() {
    const list = site.products.filter((p) => filter === 'all' || p.category === filter);
    const wrap = $('[data-products]');
    if (!list.length) {
      wrap.innerHTML = '<p class="empty">ამ კატეგორიაში პროდუქტი ჯერ არ არის — ექსპერიმენტი მიმდინარეობს 🧪</p>';
      return;
    }
    wrap.innerHTML = list.map((p) => {
      const idx = site.products.indexOf(p) + 1;
      const out = p.stock <= 0;
      return `
      <article class="card reveal" style="--c:${esc(p.color)}" data-id="${esc(p.id)}">
        <button class="card__visual" type="button" data-open="${esc(p.id)}" aria-label="${esc(p.name)} — დეტალურად">
          <span class="card__blob"></span>
          ${visual(p, 'card__img')}
          <span class="card__spec mono">SPECIMEN №${String(idx).padStart(3, '0')}</span>
          ${p.badge ? `<span class="card__badge">${esc(p.badge)}</span>` : ''}
        </button>
        <div class="card__body">
          <div class="card__meta mono"><span>${esc(CATEGORY[p.category] || '')}</span><span>${esc(p.weight)}</span></div>
          <h3 class="card__title"><button type="button" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
          <p class="card__tag">${esc(p.tagline)}</p>
          <div class="card__foot">
            <div class="price">
              <strong>${money(p.price)}</strong>
              ${p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : ''}
            </div>
            <button class="add-btn" type="button" data-add="${esc(p.id)}" ${out ? 'disabled' : ''} aria-label="კალათაში დამატება — ${esc(p.name)}">
              ${out ? 'ამოიწურა' : '<span>+</span>'}
            </button>
          </div>
        </div>
      </article>`;
    }).join('');
    observeReveal($$('.reveal', wrap));
    setupTilt($$('.card', wrap));
  }

  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (chip) {
      filter = chip.dataset.filter;
      $$('[data-filter]').forEach((c) => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-selected', String(c === chip));
      });
      renderProducts();
      return;
    }
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      addToCart(addBtn.dataset.add, 1, addBtn);
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) openProduct(open.dataset.open);
  });

  function addToCart(id, qty, sourceEl) {
    const p = site.products.find((x) => x.id === id);
    if (!cart.add(id, qty)) {
      toast('მარაგში მეტი აღარ არის 😔');
      return;
    }
    flyToCart(sourceEl, p);
    toast(`„${p.name}“ დაემატა კალათაში`);
  }

  function flyToCart(sourceEl, p) {
    const target = $('[data-open-cart]');
    if (!sourceEl || reduced) return bump(target);
    const a = sourceEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly';
    fly.innerHTML = visual(p);
    fly.style.left = a.left + a.width / 2 - 30 + 'px';
    fly.style.top = a.top + a.height / 2 - 30 + 'px';
    document.body.appendChild(fly);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    fly.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy - 120}px) scale(.9) rotate(180deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(360deg)`, opacity: 0.4 },
      ],
      { duration: 800, easing: 'cubic-bezier(.5,0,.3,1)' }
    ).onfinish = () => {
      fly.remove();
      bump(target);
    };
  }

  function bump(el) {
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  }

  function setupTilt(cards) {
    if (reduced || !window.matchMedia('(hover: hover)').matches) return;
    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 18).toFixed(1) + 'px');
        card.style.setProperty('--my', (y * 18).toFixed(1) + 'px');
      });
      card.addEventListener('pointerleave', () => {
        ['--rx', '--ry', '--mx', '--my'].forEach((v) => card.style.removeProperty(v));
      });
    });
  }

  /* -------------------------------------------------------------- modal */

  let lastFocus;
  function openProduct(id) {
    const p = site.products.find((x) => x.id === id);
    if (!p) return;
    lastFocus = document.activeElement;
    const n = p.nutrition || {};
    const out = p.stock <= 0;
    $('[data-modal-card]').innerHTML = `
      <button class="icon-btn modal__close" type="button" data-close-modal aria-label="დახურვა">✕</button>
      <div class="modal__visual" style="--c:${esc(p.color)}">
        <span class="card__blob"></span>
        ${visual(p, 'modal__img')}
        <span class="card__spec mono">${esc(p.nameEn)}</span>
      </div>
      <div class="modal__body">
        <p class="eyebrow mono">${esc(CATEGORY[p.category] || '')} · ${esc(p.weight)}</p>
        <h2 id="modal-title">${esc(p.name)}</h2>
        <p class="modal__tag">${esc(p.tagline)}</p>
        <p>${esc(p.description)}</p>
        ${p.ingredients ? `<p class="modal__ing"><b>შემადგენლობა:</b> ${esc(p.ingredients)}</p>` : ''}
        <div class="nutri mono">
          ${[['kcal', 'კკალ'], ['protein', 'ცილა'], ['carbs', 'ნახშირწყ.'], ['fat', 'ცხიმი']]
            .filter(([k]) => n[k]).map(([k, l]) => `<div><strong>${esc(n[k])}</strong><span>${l}</span></div>`).join('')}
        </div>
        <p class="nutri__note mono">${n.kcal ? 'კვებითი ღირებულება 100 გ-ზე' : ''}</p>
        <div class="modal__buy">
          <div class="price price--lg"><strong>${money(p.price)}</strong>${p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
          <div class="qty" data-qty>
            <button type="button" data-q="-1" aria-label="შემცირება">−</button>
            <span data-q-val>1</span>
            <button type="button" data-q="1" aria-label="გაზრდა">+</button>
          </div>
          <button class="btn btn--primary btn--lg" type="button" data-modal-add ${out ? 'disabled' : ''}>${out ? 'ამოიწურა' : 'კალათაში'}</button>
        </div>
        <p class="stock mono">${out ? '● მარაგში არ არის' : p.stock < 15 ? `● დარჩა მხოლოდ ${p.stock} ცალი` : '● მარაგშია'}</p>
      </div>`;
    const modal = $('[data-modal]');
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    $('[data-close-modal]').focus();

    let q = 1;
    const val = $('[data-q-val]');
    $$('[data-q]').forEach((b) => b.addEventListener('click', () => {
      q = Math.max(1, Math.min(p.stock || 1, q + Number(b.dataset.q)));
      val.textContent = q;
    }));
    $('[data-modal-add]').addEventListener('click', (e) => {
      addToCart(p.id, q, e.currentTarget);
      closeModal();
    });
  }

  function closeModal() {
    const modal = $('[data-modal]');
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => (modal.hidden = true), 250);
    lastFocus?.focus?.();
  }

  $('[data-modal]').addEventListener('click', (e) => {
    if (e.target.matches('[data-modal]') || e.target.closest('[data-close-modal]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('[data-modal]').hidden) closeModal();
    else closeCart();
  });

  /* ------------------------------------------------------------ process */

  function renderSteps() {
    const steps = site.content.process.steps;
    $('[data-steps]').innerHTML = steps.map((s, i) => `
      <li class="step" data-step="${i}">
        <span class="step__num mono">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <span class="step__temp mono">${esc(s.temp)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
        </div>
      </li>`).join('');

    const fill = $('[data-thermo-fill]');
    const read = $('[data-thermo-read]');
    const els = $$('.step');
    const levels = [70, 8, 4, 100];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const i = Number(en.target.dataset.step);
        els.forEach((el, j) => el.classList.toggle('is-active', j === i));
        els.forEach((el, j) => el.classList.toggle('is-done', j < i));
        fill.style.height = (levels[i] ?? 50) + '%';
        fill.classList.toggle('is-cold', i === 1 || i === 2);
        read.textContent = steps[i].temp;
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------------- mixer */

  function symbolFor(p) {
    const base = (p.nameEn || p.slug || 'X').replace(/^(bite|frutz|popz|yogurt bites|freeze-dried)\s*[—-]?\s*/i, '');
    const word = base.replace(/[^A-Za-z]/g, '') || 'Xx';
    return word[0].toUpperCase() + (word[1] || '').toLowerCase();
  }

  const mix = [];
  function renderMixer() {
    const pool = site.products.filter((p) => p.category !== 'mix');
    const els = $('[data-elements]');
    els.innerHTML = pool.map((p, i) => `
      <button type="button" class="element" style="--c:${esc(p.color)}" data-el="${esc(p.id)}" aria-pressed="false">
        <span class="element__n mono">${i + 1}</span>
        <span class="element__sym">${esc(symbolFor(p))}</span>
        <span class="element__name">${esc(p.name.replace(/^.*— /, '').replace('სუბლიმირებული ', ''))}</span>
      </button>`).join('');
    $('[data-mix-price]').textContent = money(site.settings.mixPrice);

    els.addEventListener('click', (e) => {
      const b = e.target.closest('[data-el]');
      if (!b) return;
      const id = b.dataset.el;
      const i = mix.indexOf(id);
      if (i >= 0) mix.splice(i, 1);
      else if (mix.length >= 4) return toast('მაქსიმუმ 4 ელემენტი ერთ კოლბაში 🧪');
      else mix.push(id);
      updateFlask(id, i < 0);
    });

    $('[data-add-mix]').addEventListener('click', (e) => {
      if (mix.length < 2) return;
      cart.addMix(mix);
      flyToCart(e.currentTarget, { illustration: 'mix', color: '#F58220', name: 'Lab Mix' });
      toast('შენი Lab Mix დაემატა კალათაში 🧪');
      mix.splice(0);
      updateFlask();
    });
    updateFlask();
  }

  function updateFlask(changedId, added) {
    $$('[data-el]').forEach((b) => {
      const on = mix.includes(b.dataset.el);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const parts = mix.map((id) => site.products.find((p) => p.id === id));
    // Layers stack from the bottom of the flask (y=292) up.
    const layerH = 52;
    $('[data-layers]').innerHTML = parts.map((p, i) => {
      const y = 292 - (i + 1) * layerH;
      return `<g class="layer" style="--d:${i * 0.05}s">
        <rect x="0" y="${y + 10}" width="260" height="${layerH + 4}" fill="${esc(p.color)}"/>
        <path class="layer__wave" d="M-260 ${y + 12}q32.5-12 65 0t65 0 65 0 65 0 65 0 65 0 65 0 65 0 65 0v20h-520z" fill="${esc(p.color)}"/>
      </g>`;
    }).join('');

    const note = $('[data-mixer-note]');
    const btn = $('[data-add-mix]');
    btn.disabled = parts.length < 2;
    note.textContent = parts.length < 2 ? `აირჩიე კიდევ ${2 - parts.length} ელემენტი` : parts.length < 4 ? `შეგიძლია დაამატო კიდევ ${4 - parts.length}` : 'კოლბა სავსეა! ✨';
    $('[data-formula]').textContent = parts.length
      ? 'TL-' + parts.map(symbolFor).join('·')
      : '— — —';

    if (added && !reduced) {
      const flask = $('[data-flask]');
      bump(flask);
      const bubbles = $('[data-flask-bubbles]');
      for (let i = 0; i < 8; i++) {
        const b = document.createElement('span');
        b.style.left = 35 + Math.random() * 30 + '%';
        b.style.setProperty('--s', 6 + Math.random() * 10 + 'px');
        b.style.animationDelay = Math.random() * 0.4 + 's';
        bubbles.appendChild(b);
        setTimeout(() => b.remove(), 1800);
      }
    }
  }

  /* ----------------------------------------------------------- benefits */

  function renderBenefits() {
    $('[data-benefits]').innerHTML = site.content.benefits.map((b, i) => `
      <div class="benefit reveal" style="--d:${i * 80}ms">
        <span class="benefit__icon">${esc(b.icon)}</span>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.text)}</p>
      </div>`).join('');
  }

  function setupCompare() {
    const range = $('[data-compare]');
    const fruit = $('[data-compare-fruit]');
    fruit.innerHTML = illo('strawberry', '#E63946', 'compare__svg');
    const crystals = Array.from({ length: 14 }, () => {
      const s = document.createElement('span');
      s.className = 'crystal';
      s.style.left = Math.random() * 90 + 5 + '%';
      s.style.top = Math.random() * 80 + 5 + '%';
      s.textContent = '❄';
      fruit.appendChild(s);
      return s;
    });
    const update = () => {
      const k = range.value / 100;
      fruit.style.setProperty('--k', k);
      $('[data-cmp-weight]').textContent = Math.round(300 - 280 * k) + ' გ';
      $('[data-cmp-water]').textContent = Math.round(90 - 87 * k) + '%';
      $('[data-cmp-vit]').textContent = Math.round(100 - 3 * k) + '%';
      crystals.forEach((c, i) => (c.style.opacity = k > 0.1 && k < 0.9 ? String(Math.sin(k * Math.PI) * (0.4 + (i % 3) * 0.2)) : '0'));
      range.style.setProperty('--p', range.value + '%');
    };
    range.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------ reviews */

  function renderReviews() {
    const items = site.content.testimonials.map((t) => `
      <figure class="review">
        <div class="review__stars" aria-label="${Number(t.rating) || 5} ვარსკვლავი">${'★'.repeat(Math.max(1, Math.min(5, Number(t.rating) || 5)))}</div>
        <blockquote>„${esc(t.text)}“</blockquote>
        <figcaption class="mono">— ${esc(t.name)}</figcaption>
      </figure>`).join('');
    $('[data-reviews]').innerHTML = items + items.replace(/<figure class="review">/g, '<figure class="review" aria-hidden="true">');
  }

  function renderFaq() {
    $('[data-faq]').innerHTML = site.content.faq.map((f) => `
      <details class="faq__item">
        <summary>${esc(f.q)}<span class="faq__icon" aria-hidden="true"></span></summary>
        <div class="faq__a"><p>${esc(f.a)}</p></div>
      </details>`).join('');
  }

  function renderFooter() {
    const s = site.settings;
    const phone = $('[data-contact="phone"]');
    phone.textContent = s.phone;
    phone.href = 'tel:' + s.phone.replace(/[^+\d]/g, '');
    const email = $('[data-contact="email"]');
    email.textContent = s.email;
    email.href = 'mailto:' + s.email;
    const socials = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok']].filter(([k]) => /^https?:\/\//.test(s[k] || ''));
    $('[data-socials]').innerHTML = socials.map(([k, l]) => `<a href="${esc(s[k])}" target="_blank" rel="noopener">${l} ↗</a>`).join('');
    $('[data-year]').textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------- hero */

  const FLOATERS = [
    { k: 'strawberry', c: '#E63946', x: 6, y: 10, s: 92, d: 0 },
    { k: 'yogurt-strawberry', c: '', x: 72, y: 4, s: 86, d: 1.2 },
    { k: 'banana', c: '#F6C945', x: 80, y: 58, s: 96, d: 0.6 },
    { k: 'blueberry', c: '#6C5CE7', x: 2, y: 62, s: 78, d: 1.8 },
    { k: 'mango', c: '#FFB020', x: 40, y: -6, s: 70, d: 2.4 },
    { k: 'apple', c: '#7BC043', x: 58, y: 80, s: 64, d: 0.9 },
  ];

  function setupHero() {
    const wrap = $('[data-floaters]');
    wrap.innerHTML = FLOATERS.map((f, i) => `
      <button type="button" class="floater" tabindex="-1" style="--x:${f.x}%;--y:${f.y}%;--s:${f.s}px;--d:${f.d}s;--depth:${(i % 3) + 1}" data-floater>
        ${illo(f.k, f.c)}
      </button>`).join('');

    wrap.addEventListener('click', (e) => {
      const f = e.target.closest('[data-floater]');
      if (!f || f.classList.contains('is-popped')) return;
      burst(f);
      f.classList.add('is-popped');
      setTimeout(() => f.classList.remove('is-popped'), 2200);
    });

    const stage = $('[data-stage]');
    if (reduced || !window.matchMedia('(hover: hover)').matches) return;
    let raf;
    window.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        stage.style.setProperty('--px', x.toFixed(3));
        stage.style.setProperty('--py', y.toFixed(3));
      });
    });
  }

  function burst(el) {
    const r = el.getBoundingClientRect();
    const colors = ['#F58220', '#151515', '#FF9A3D', '#FDF3E8', '#E63946'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('span');
      p.className = 'crumb';
      p.style.left = r.left + r.width / 2 + 'px';
      p.style.top = r.top + r.height / 2 + 'px';
      p.style.background = colors[i % colors.length];
      document.body.appendChild(p);
      const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const dist = 50 + Math.random() * 70;
      p.animate(
        [
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist + 40}px)) scale(.3) rotate(${Math.random() * 360}deg)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' }
      ).onfinish = () => p.remove();
    }
    const word = document.createElement('span');
    word.className = 'crunch-word';
    word.textContent = ['ხრაშ!', 'CRUNCH!', 'ხრუშ!', 'POP!'][Math.floor(Math.random() * 4)];
    word.style.left = r.left + r.width / 2 + 'px';
    word.style.top = r.top + 'px';
    document.body.appendChild(word);
    setTimeout(() => word.remove(), 900);
  }

  /* ------------------------------------------------------------- header */

  function setupHeader() {
    const header = $('.header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = $('[data-burger]');
    burger.addEventListener('click', () => {
      const open = header.classList.toggle('is-menu');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav a').forEach((a) => a.addEventListener('click', () => {
      header.classList.remove('is-menu');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ------------------------------------------------------------- reveal */

  let revealIO;
  function setupReveal() {
    observeReveal($$('.reveal'));
    const statsIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        $$('[data-count]', en.target).forEach(countUp);
        statsIO.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    statsIO.observe($('[data-stats]'));
  }

  function observeReveal(els) {
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    revealIO = revealIO || new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => revealIO.observe(el));
  }

  /* --------------------------------------------------------------- cart */

  function setupCart() {
    $$('[data-open-cart]').forEach((b) => b.addEventListener('click', openCart));
    $('[data-close-cart]').addEventListener('click', closeCart);
    $('[data-overlay]').addEventListener('click', closeCart);
    $('[data-cart-items]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-line]');
      if (!b) return;
      const line = cart.raw().find((l) => l.key === b.dataset.line);
      if (line) cart.setQty(line.key, line.qty + Number(b.dataset.delta));
    });
  }

  function openCart() {
    $('[data-overlay]').hidden = false;
    document.body.classList.add('no-scroll');
    const d = $('[data-drawer]');
    requestAnimationFrame(() => {
      $('[data-overlay]').classList.add('is-on');
      d.classList.add('is-open');
      d.setAttribute('aria-hidden', 'false');
    });
    $('[data-close-cart]').focus();
  }

  function closeCart() {
    const d = $('[data-drawer]');
    if (!d.classList.contains('is-open')) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden', 'true');
    $('[data-overlay]').classList.remove('is-on');
    document.body.classList.remove('no-scroll');
    setTimeout(() => ($('[data-overlay]').hidden = true), 300);
  }

  function renderCart() {
    const t = cart.totals();
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = t.count;
      el.classList.toggle('is-on', t.count > 0);
    });
    $('[data-cart-subtotal]').textContent = money(t.subtotal);
    $('[data-checkout-link]').classList.toggle('is-disabled', !t.count);

    const left = Math.max(0, t.free - t.subtotal);
    $('[data-ship-progress]').hidden = !t.free;
    $('[data-ship-text]').innerHTML = !t.count
      ? `დაამატე ${money(t.free)}-ის პროდუქტი და მიწოდება <b>უფასოა</b>`
      : left > 0 ? `კიდევ <b>${money(left)}</b> და მიწოდება უფასოა 🚚` : '🎉 შენ მიიღე <b>უფასო მიწოდება!</b>';
    $('[data-ship-bar]').style.width = Math.min(100, (t.subtotal / (t.free || 1)) * 100) + '%';

    $('[data-cart-items]').innerHTML = t.items.length
      ? t.items.map((i) => `
        <div class="line">
          <div class="line__img" style="--c:${esc(i.color)}">${visual(i)}</div>
          <div class="line__info">
            <strong>${esc(i.name)}</strong>
            <span class="mono">${money(i.price)}${i.weight ? ' · ' + esc(i.weight) : ''}</span>
            <div class="qty qty--sm">
              <button type="button" data-line="${esc(i.key)}" data-delta="-1" aria-label="შემცირება">−</button>
              <span>${i.qty}</span>
              <button type="button" data-line="${esc(i.key)}" data-delta="1" aria-label="გაზრდა">+</button>
            </div>
          </div>
          <strong class="line__total">${money(i.price * i.qty)}</strong>
        </div>`).join('')
      : `<div class="cart-empty">${illo('yogurt-plain', '')}<p>კოლბა ცარიელია.<br>დაიწყე ექსპერიმენტი!</p><a href="#shop" class="btn btn--ghost" data-close-cart-link>მაღაზიაში →</a></div>`;
    const link = $('[data-close-cart-link]');
    if (link) link.addEventListener('click', closeCart);
  }

  /* --------------------------------------------------------- newsletter */

  function setupNewsletter() {
    $('[data-newsletter]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const email = form.email.value.trim();
      try {
        const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (!res.ok) throw new Error();
        form.reset();
        toast('მადლობა! შენ ახლა ლაბორატორიის წევრი ხარ 🧪');
      } catch {
        toast('ვერ მოხერხდა. შეამოწმე ელ-ფოსტა და სცადე თავიდან.');
      }
    });
  }
})();
