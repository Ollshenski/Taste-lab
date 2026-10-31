/* Taste Lab — checkout page. */
(function () {
  const { esc, money, toast, visual, cart } = window.TL;
  const { illo } = window.TLIllo;
  const $ = (s, r = document) => r.querySelector(s);

  let site;

  const params = new URLSearchParams(location.search);
  const returned = params.get('payment');

  window.TL.loadSite().then((data) => {
    site = data;
    cart.reconcile();
    if (returned && handleReturn(returned, params.get('order'))) return;
    if (!cart.totals().count) return renderEmpty();
    renderPayments();
    renderSummary();
    cart.onChange(renderSummary);
    $('[data-co-form]').addEventListener('submit', submit);
  }).catch(() => toast('ჩატვირთვა ვერ მოხერხდა. განაახლეთ გვერდი.'));

  function renderEmpty() {
    $('[data-co-root]').innerHTML = `
      <div class="success">
        ${illo('yogurt-plain', '')}
        <h1>კალათა ცარიელია</h1>
        <p>ჯერ აირჩიე შენი საყვარელი სნექები.</p>
        <a href="/#shop" class="btn btn--primary btn--lg">მაღაზიაში →</a>
      </div>`;
  }

  function renderPayments() {
    const s = site.settings;
    const opts = [
      { id: 'card', title: 'ბარათით ონლაინ', sub: s.onlinePayments ? 'Visa / Mastercard / Apple Pay' : 'მალე დაემატება', enabled: s.onlinePayments },
      { id: 'cash', title: 'გადახდა მიტანისას', sub: 'ნაღდი ან ბარათით კურიერთან', enabled: s.cashOnDelivery !== false },
    ];
    const first = opts.find((o) => o.enabled);
    $('[data-pay-opts]').innerHTML = opts.map((o) => `
      <label class="pay-opt ${o.enabled ? '' : 'is-disabled'}">
        <input type="radio" name="payment" value="${o.id}" ${o.enabled ? '' : 'disabled'} ${o === first ? 'checked' : ''}>
        <span><b>${o.title}</b><small>${o.sub}</small></span>
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
    $('[data-co-delivery]').textContent = t.delivery ? money(t.delivery) : 'უფასო';
    $('[data-co-total]').textContent = money(t.total);
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const err = $('[data-co-error]');
    err.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim() || !data.address.trim()) return (err.textContent = 'გთხოვთ შეავსოთ სახელი და მისამართი.');
    if (!/^[+\d\s()-]{7,20}$/.test(data.phone.trim())) return (err.textContent = 'გთხოვთ მიუთითოთ სწორი ტელეფონის ნომერი.');

    const btn = $('[data-co-submit]');
    btn.disabled = true;
    btn.textContent = 'მუშავდება…';
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: data.name, phone: data.phone, email: data.email, city: data.city, address: data.address, note: data.note },
          paymentMethod: data.payment,
          items: cart.raw().map((l) => (l.type === 'mix' ? { type: 'mix', parts: l.parts, qty: l.qty } : { id: l.id, qty: l.qty })),
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'შეცდომა');
      if (out.payment?.redirectUrl) {
        // Keep the cart until the payment is confirmed; Flitt sends the customer back here.
        btn.textContent = 'გადამისამართება გადახდაზე…';
        location.href = out.payment.redirectUrl;
        return;
      }
      cart.clear();
      success(out.order);
    } catch (ex) {
      err.textContent = ex.message || 'შეკვეთა ვერ გაიგზავნა. სცადეთ თავიდან.';
      btn.disabled = false;
      btn.textContent = 'შეკვეთის დადასტურება';
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
      ? 'გადახდა არ შედგა. შეკვეთა გაუქმდა — შეგიძლიათ სცადოთ თავიდან.'
      : 'გადახდის სტატუსი ვერ დადასტურდა. თუ თანხა ჩამოგეჭრათ, დაგვიკავშირდით.');
    return false;
  }

  function success(order, payment) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('[data-co-root]').innerHTML = `
      <div class="success">
        ${illo('mix', '')}
        <p class="eyebrow mono">EXPERIMENT SUCCESSFUL ✓</p>
        <h1>მადლობა! შეკვეთა მიღებულია</h1>
        <div class="order-no">${esc(order.number)}</div>
        <p>${payment === 'paid' ? '✅ გადახდა წარმატებით შესრულდა.' : payment === 'pending' ? '⏳ გადახდა მუშავდება — დადასტურებისთანავე დაგიკავშირდებით.' : `სულ გადასახდელი: <b>${money(order.total)}</b>.`}<br>ჩვენი გუნდი მალე დაგიკავშირდება ტელეფონით მიწოდების დასაზუსტებლად.</p>
        <a href="/" class="btn btn--primary btn--lg">მთავარზე დაბრუნება</a>
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
