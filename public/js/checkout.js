/* Taste Lab — checkout page. */
(function () {
  const { esc, money, toast, visual, cart } = window.TL;
  const { illo } = window.TLIllo;
  const { t: tr, lang } = window.TLi18n;
  const $ = (s, r = document) => r.querySelector(s);

  let site;

  // Cities are shown in the visitor's language but saved in Georgian for the admin panel.
  const KA_CITIES = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'თელავი', 'სხვა'];
  const cityLabels = tr('cities').split('|');
  $('[data-cities]').innerHTML = KA_CITIES.map((c, i) => `<option value="${c}">${esc(cityLabels[i] || c)}</option>`).join('');

  const params = new URLSearchParams(location.search);
  const returned = params.get('payment');

  window.TL.loadSite().then((data) => {
    site = data;
    cart.reconcile();
    $('[data-site-footer]').innerHTML = window.TLFooter(site.settings);
    if (returned && handleReturn(returned, params.get('order'))) return;
    if (!cart.totals().count) return renderEmpty();
    renderPayments();
    renderSummary();
    cart.onChange(renderSummary);
    $('[data-co-form]').addEventListener('submit', submit);
  }).catch(() => toast(tr('load.fail')));

  function renderEmpty() {
    $('[data-co-root]').innerHTML = `
      <div class="success">
        ${illo('yogurt-plain', '')}
        <h1>${tr('co.empty')}</h1>
        <p>${tr('co.empty.text')}</p>
        <a href="/#shop" class="btn btn--primary btn--lg">${tr('to.shop')}</a>
      </div>`;
  }

  function renderPayments() {
    const s = site.settings;
    const opts = [
      { id: 'card', title: tr('co.card'), sub: s.onlinePayments ? 'Visa / Mastercard / Google Pay / Apple Pay' : tr('co.card.soon'), enabled: s.onlinePayments, logos: true },
      { id: 'cash', title: tr('co.cash'), sub: tr('co.cash.sub'), enabled: s.cashOnDelivery !== false },
    ];
    const first = opts.find((o) => o.enabled);
    $('[data-pay-opts]').innerHTML = opts.map((o) => `
      <label class="pay-opt ${o.enabled ? '' : 'is-disabled'}">
        <input type="radio" name="payment" value="${o.id}" ${o.enabled ? '' : 'disabled'} ${o === first ? 'checked' : ''}>
        <span><b>${o.title}</b><small>${o.sub}</small></span>
        ${o.logos ? `<span class="pay-opt__logos">${['/assets/pay/visa.svg', '/assets/pay/mastercard.svg', '/assets/pay/googlepay.svg', '/assets/pay/applepay.svg'].map((src) => `<img src="${src}" alt="" width="38" height="24">`).join('')}</span>` : ''}
      </label>`).join('');
  }

  function renderSummary() {
    const t = cart.totals();
    $('[data-co-items]').innerHTML = t.items.map((i) => `
      <div class="line">
        <div class="line__img" style="--c:${esc(i.color)}">${visual(i)}</div>
        <div class="line__info"><strong>${esc(i.name)}</strong><span class="mono">${i.qty} × ${money(i.price)}</span></div>
        <strong class="line__total">${money(i.price * i.qty)}</strong>
      </div>`).join('');
    $('[data-co-subtotal]').textContent = money(t.subtotal);
    $('[data-co-delivery]').textContent = t.delivery ? money(t.delivery) : tr('co.free');
    $('[data-co-total]').textContent = money(t.total);
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const err = $('[data-co-error]');
    err.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim() || !data.address.trim()) return (err.textContent = tr('co.err.fields'));
    if (!/^[+\d\s()-]{7,20}$/.test(data.phone.trim())) return (err.textContent = tr('co.err.phone'));
    if (!form.agree.checked) return (err.textContent = tr('co.err.agree'));

    const btn = $('[data-co-submit]');
    btn.disabled = true;
    btn.textContent = tr('co.processing');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: data.name, phone: data.phone, email: data.email, city: data.city, address: data.address, note: data.note },
          paymentMethod: data.payment,
          agree: true,
          lang,
          items: cart.raw().map((l) => (l.type === 'mix' ? { type: 'mix', parts: l.parts, qty: l.qty } : { id: l.id, qty: l.qty })),
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || tr('error'));
      if (out.payment?.redirectUrl) {
        // Keep the cart until the payment is confirmed; Flitt sends the customer back here.
        btn.textContent = tr('co.redirect');
        location.href = out.payment.redirectUrl;
        return;
      }
      cart.clear();
      success(out.order);
    } catch (ex) {
      err.textContent = ex.message || tr('co.err.send');
      btn.disabled = false;
      btn.textContent = tr('co.submit');
    }
  }

  // Customer is back from the Flitt payment page. Returns true when the page is fully handled.
  function handleReturn(status, number) {
    history.replaceState(null, '', location.pathname);
    if (status === 'paid' || status === 'pending') {
      cart.clear();
      success({ number }, status);
      return true;
    }
    toast(status === 'failed'
      ? tr('co.failed')
      : tr('co.unknown'));
    return false;
  }

  function success(order, payment) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('[data-co-root]').innerHTML = `
      <div class="success">
        ${illo('mix', '')}
        <p class="eyebrow mono">EXPERIMENT SUCCESSFUL ✓</p>
        <h1>${tr('co.thanks')}</h1>
        <div class="order-no">${esc(order.number)}</div>
        <p>${payment === 'paid' ? tr('co.paid') : payment === 'pending' ? tr('co.pending') : tr('co.topay', { amount: money(order.total) })}<br>${tr('co.call')}</p>
        <a href="/" class="btn btn--primary btn--lg">${tr('co.home')}</a>
      </div>`;
    confetti();
  }

  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#F58220', '#151515', '#FF9A3D', '#E63946', '#F6C945', '#6C5CE7'];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      document.body.appendChild(c);
      c.animate(
        [{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${window.innerHeight + 40}px) translateX(${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 720}deg)` }],
        { duration: 2200 + Math.random() * 1800, delay: Math.random() * 600, easing: 'cubic-bezier(.3,.6,.5,1)' }
      ).onfinish = () => c.remove();
    }
  }
})();
