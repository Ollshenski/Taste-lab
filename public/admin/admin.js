/* Taste Lab — admin panel (single page, no build step). */
(function () {
  const { illo, keys: ILLOS, names: ILLO_NAMES } = window.TLIllo;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('[data-view-root]');

  const STATUS = { new: 'ახალი', paid: 'გადახდილი', processing: 'მუშავდება', shipped: 'გზაშია', delivered: 'მიწოდებული', cancelled: 'გაუქმებული' };
  const PAY_STATUS = { pending: 'მოლოდინში', paid: 'გადახდილი', failed: 'წარუმატებელი', refunded: 'დაბრუნებული' };
  const PAY_METHOD = { cash: 'მიტანისას', card: 'ბარათით' };
  const CATEGORY = { yogurt: 'მაწონი / იოგურტი', fruit: 'ხილი', sweets: 'ტკბილეული', mix: 'მიქსი' };

  let db = null;
  let view = 'dashboard';
  let orderFilter = { q: '', status: '' };

  /* ------------------------------------------------------------ utils */

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const money = (n) => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + (db?.settings.currency || '₾');
  const date = (iso) => new Date(iso).toLocaleString('ka-GE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  async function api(path, opts = {}) {
    const res = await fetch('/api' + path, {
      ...opts,
      headers: opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401 && !path.endsWith('/login')) {
      showLogin();
      throw new Error('unauthorized');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'შეცდომა');
    return data;
  }

  let toastT;
  function toast(msg) {
    const el = $('[data-toast]');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('is-on'), 2400);
  }

  function visual(p, cls = '') {
    return p.image ? `<img src="${esc(p.image)}" alt="" class="${cls}">` : illo(p.illustration, p.color, cls);
  }

  /* ------------------------------------------------------------- auth */

  function showLogin() {
    $('[data-app]').hidden = true;
    $('[data-login]').hidden = false;
    $('[data-login-form] input').focus();
  }

  $('[data-login-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const err = $('[data-login-error]');
    err.textContent = '';
    try {
      await api('/admin/login', { method: 'POST', body: { password: form.password.value } });
      form.reset();
      await boot();
    } catch (ex) {
      err.textContent = ex.message;
    }
  });

  $('[data-logout]').addEventListener('click', async () => {
    await api('/admin/logout', { method: 'POST' }).catch(() => {});
    showLogin();
  });

  async function boot() {
    try {
      const me = await api('/admin/me');
      $('[data-default-pw]').hidden = !me.defaultPassword;
      await reload();
      $('[data-login]').hidden = true;
      $('[data-app]').hidden = false;
      route();
    } catch {
      showLogin();
    }
  }

  async function reload() {
    db = await api('/admin/data');
    const n = db.orders.filter((o) => o.status === 'new').length;
    const pill = $('[data-new-orders]');
    pill.hidden = !n;
    pill.textContent = n;
  }

  /* ----------------------------------------------------------- router */

  function route() {
    view = (location.hash.slice(1) || 'dashboard').split('/')[0];
    if (!VIEWS[view]) view = 'dashboard';
    $$('[data-view]').forEach((a) => a.classList.toggle('is-active', a.dataset.view === view));
    VIEWS[view]();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => db && route());

  const VIEWS = { dashboard, orders, products, content, params: settings, subscribers, security };

  /* -------------------------------------------------------- dashboard */

  function dashboard() {
    const valid = db.orders.filter((o) => o.status !== 'cancelled');
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const perDay = days.map((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return valid.filter((o) => { const t = new Date(o.createdAt); return t >= d && t < next; }).reduce((s, o) => s + o.total, 0);
    });
    const max = Math.max(1, ...perDay);
    const low = db.products.filter((p) => p.stock < 15);

    root.innerHTML = `
      <div class="page-head"><div><h1>გამარჯობა 👋</h1><p>აი, რა ხდება ლაბორატორიაში.</p></div></div>
      <div class="grid grid--4">
        <div class="card kpi kpi--accent"><span>შემოსავალი</span><strong>${money(revenue)}</strong><small>გაუქმებულების გარეშე</small></div>
        <div class="card kpi"><span>შეკვეთები</span><strong>${db.orders.length}</strong><small>სულ</small></div>
        <div class="card kpi"><span>ახალი</span><strong>${db.orders.filter((o) => o.status === 'new').length}</strong><small>დასამუშავებელი</small></div>
        <div class="card kpi"><span>საშუალო ჩეკი</span><strong>${money(valid.length ? revenue / valid.length : 0)}</strong><small>${db.subscribers.length} გამომწერი</small></div>
      </div>
      <div class="grid grid--2" style="margin-top:20px">
        <div class="card">
          <h2>შემოსავალი — ბოლო 14 დღე</h2>
          <div class="chart">${perDay.map((v, i) => `
            <div class="chart__bar" title="${money(v)}"><div style="height:${(v / max) * 100}%"></div><span>${days[i].getDate()}</span></div>`).join('')}
          </div>
        </div>
        <div class="card">
          <h2>მარაგი იწურება</h2>
          ${low.length ? `<table>${low.map((p) => `<tr><td><div class="thumb" style="background:${esc(p.color)}22">${visual(p)}</div></td><td class="prod-name">${esc(p.name)}</td><td class="low">${p.stock} ც.</td></tr>`).join('')}</table>` : '<p class="muted">ყველა პროდუქტი საკმარისადაა ✓</p>'}
        </div>
      </div>
      <div class="card" style="margin-top:20px">
        <div class="page-head" style="margin-bottom:8px"><h2 style="margin:0">ბოლო შეკვეთები</h2><a href="#orders" class="btn btn--sm">ყველა →</a></div>
        ${ordersTable(db.orders.slice(0, 6))}
      </div>`;
    bindOrderRows();
  }

  /* ----------------------------------------------------------- orders */

  function ordersTable(list) {
    if (!list.length) return '<p class="empty">შეკვეთები ჯერ არ არის. 🧪</p>';
    return `<div class="table-wrap"><table>
      <thead><tr><th>№</th><th>თარიღი</th><th>მომხმარებელი</th><th>ტელეფონი</th><th>ჯამი</th><th>გადახდა</th><th>სტატუსი</th></tr></thead>
      <tbody>${list.map((o) => `
        <tr class="clickable" data-order="${esc(o.id)}">
          <td class="mono"><b>${esc(o.number)}</b></td>
          <td>${date(o.createdAt)}</td>
          <td>${esc(o.customer.name)}<br><small class="muted">${esc(o.customer.city)}</small></td>
          <td>${esc(o.customer.phone)}</td>
          <td><b>${money(o.total)}</b></td>
          <td>${PAY_METHOD[o.paymentMethod] || ''}<br><small class="muted">${PAY_STATUS[o.paymentStatus] || ''}</small></td>
          <td><span class="status status--${esc(o.status)}">${STATUS[o.status]}</span></td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  function bindOrderRows() {
    $$('[data-order]').forEach((tr) => tr.addEventListener('click', () => openOrder(tr.dataset.order)));
  }

  function orders() {
    root.innerHTML = `
      <div class="page-head"><div><h1>შეკვეთები</h1><p>დააჭირეთ შეკვეთას დეტალების სანახავად და სტატუსის შესაცვლელად.</p></div>
        <button class="btn btn--sm" type="button" data-export-orders>CSV ექსპორტი ⤓</button></div>
      <div class="card">
        <div class="toolbar">
          <input type="search" placeholder="ძებნა: ნომერი, სახელი, ტელეფონი…" value="${esc(orderFilter.q)}" data-oq>
          <select data-os><option value="">ყველა სტატუსი</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${orderFilter.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div>
        <div data-orders-list></div>
      </div>`;
    const draw = () => {
      const q = orderFilter.q.toLowerCase();
      const list = db.orders.filter((o) =>
        (!orderFilter.status || o.status === orderFilter.status) &&
        (!q || [o.number, o.customer.name, o.customer.phone, o.customer.address].join(' ').toLowerCase().includes(q)));
      $('[data-orders-list]').innerHTML = ordersTable(list);
      bindOrderRows();
    };
    $('[data-oq]').addEventListener('input', (e) => { orderFilter.q = e.target.value; draw(); });
    $('[data-os]').addEventListener('change', (e) => { orderFilter.status = e.target.value; draw(); });
    $('[data-export-orders]').addEventListener('click', exportOrders);
    draw();
  }

  function exportOrders() {
    const rows = [['ნომერი', 'თარიღი', 'სახელი', 'ტელეფონი', 'ელ-ფოსტა', 'ქალაქი', 'მისამართი', 'პროდუქტები', 'ჯამი', 'მიწოდება', 'სულ', 'გადახდა', 'სტატუსი']];
    db.orders.forEach((o) => rows.push([o.number, o.createdAt, o.customer.name, o.customer.phone, o.customer.email, o.customer.city, o.customer.address,
      o.items.map((i) => `${i.name} ×${i.qty}`).join('; '), o.subtotal, o.delivery, o.total, PAY_METHOD[o.paymentMethod], STATUS[o.status]]));
    downloadCsv('taste-lab-orders.csv', rows);
  }

  function downloadCsv(name, rows) {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openOrder(id) {
    const o = db.orders.find((x) => x.id === id);
    if (!o) return;
    openDrawer(`
      <div class="drawer__head"><h2>შეკვეთა <span class="mono">${esc(o.number)}</span></h2><button class="icon" type="button" data-drawer-close>✕</button></div>
      <p class="muted">${date(o.createdAt)}</p>
      <div class="card">
        <h2>მომხმარებელი</h2>
        <dl class="kv">
          <dt>სახელი</dt><dd>${esc(o.customer.name)}</dd>
          <dt>ტელეფონი</dt><dd><a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></dd>
          ${o.customer.email ? `<dt>ელ-ფოსტა</dt><dd><a href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a></dd>` : ''}
          <dt>მისამართი</dt><dd>${esc(o.customer.city)}, ${esc(o.customer.address)}</dd>
          ${o.paymentRef ? `<dt>Flitt</dt><dd class="mono">${esc(o.paymentRef)}${o.paymentId ? ' · ID ' + esc(o.paymentId) : ''}${o.flittStatus ? ' · ' + esc(o.flittStatus) : ''}</dd>` : ''}
          ${o.customer.note ? `<dt>კომენტარი</dt><dd>${esc(o.customer.note)}</dd>` : ''}
        </dl>
      </div>
      <div class="card">
        <h2>პროდუქტები</h2>
        <table class="order-items">${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty} × ${money(i.price)}</td><td style="text-align:right"><b>${money(i.qty * i.price)}</b></td></tr>`).join('')}
          <tr><td colspan="2" class="muted">მიწოდება</td><td style="text-align:right">${money(o.delivery)}</td></tr>
          <tr><td colspan="2"><b>სულ</b></td><td style="text-align:right;font-size:18px"><b>${money(o.total)}</b></td></tr>
        </table>
      </div>
      <form class="card" data-order-form>
        <h2>მართვა</h2>
        <div class="form-grid">
          <label class="field"><span>შეკვეთის სტატუსი</span><select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field"><span>გადახდის სტატუსი (${PAY_METHOD[o.paymentMethod]})</span><select name="paymentStatus">${Object.entries(PAY_STATUS).map(([k, v]) => `<option value="${k}" ${o.paymentStatus === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field full"><span>შიდა შენიშვნა</span><textarea name="adminNote" rows="3">${esc(o.adminNote || '')}</textarea></label>
        </div>
        <div class="save-bar" style="position:static">
          <button class="btn btn--danger" type="button" data-del-order>წაშლა</button>
          ${o.paymentRef ? '<button class="btn" type="button" data-check-payment>გადახდის შემოწმება Flitt-ში</button>' : ''}
          <button class="btn btn--primary" type="submit">შენახვა</button>
        </div>
      </form>`);
    $('[data-order-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      await api('/admin/orders/' + o.id, { method: 'PUT', body: Object.fromEntries(new FormData(e.currentTarget)) });
      await reload();
      closeDrawer();
      route();
      toast('შეკვეთა განახლდა ✓');
    });
    $('[data-check-payment]')?.addEventListener('click', async () => {
      try {
        const updated = await api('/admin/orders/' + o.id + '/check-payment', { method: 'POST' });
        await reload();
        openOrder(o.id);
        toast(`Flitt: ${updated.flittStatus || '—'} · ${PAY_STATUS[updated.paymentStatus]}`);
      } catch (ex) {
        toast(ex.message);
      }
    });
    $('[data-del-order]').addEventListener('click', async () => {
      if (!confirm(`წავშალო შეკვეთა ${o.number}? ეს მოქმედება შეუქცევადია.`)) return;
      await api('/admin/orders/' + o.id, { method: 'DELETE' });
      await reload();
      closeDrawer();
      route();
      toast('შეკვეთა წაიშალა');
    });
  }

  /* --------------------------------------------------------- products */

  function products() {
    root.innerHTML = `
      <div class="page-head"><div><h1>პროდუქტები</h1><p>${db.products.length} პროდუქტი · თანმიმდევრობა საიტზეც ასეთივეა.</p></div>
        <button class="btn btn--primary" type="button" data-new-product>+ ახალი პროდუქტი</button></div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th></th><th>პროდუქტი</th><th>კატეგორია</th><th>ფასი</th><th>მარაგი</th><th>საიტზე</th><th></th></tr></thead>
        <tbody>${db.products.map((p, i) => `
          <tr>
            <td><div class="thumb" style="background:${esc(p.color)}22">${visual(p)}</div></td>
            <td><span class="prod-name">${esc(p.name)}</span>${p.badge ? ` <span class="status status--new">${esc(p.badge)}</span>` : ''}<br><small class="muted">${esc(p.weight)}</small></td>
            <td>${CATEGORY[p.category]}</td>
            <td><b>${money(p.price)}</b>${p.oldPrice ? `<br><small class="muted"><s>${money(p.oldPrice)}</s></small>` : ''}</td>
            <td class="${p.stock < 15 ? 'low' : ''}">${p.stock}</td>
            <td><label class="switch"><input type="checkbox" data-toggle="${esc(p.id)}" ${p.active ? 'checked' : ''}><span></span></label></td>
            <td style="white-space:nowrap">
              <button class="icon" type="button" title="ზემოთ" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button class="icon" type="button" title="ქვემოთ" data-move="${i}" data-dir="1" ${i === db.products.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="btn btn--sm" type="button" data-edit="${esc(p.id)}">რედაქტირება</button>
            </td>
          </tr>`).join('')}</tbody></table></div></div>`;

    $('[data-new-product]').addEventListener('click', () => editProduct(null));
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => editProduct(b.dataset.edit)));
    $$('[data-toggle]').forEach((c) => c.addEventListener('change', async () => {
      const p = db.products.find((x) => x.id === c.dataset.toggle);
      await api('/admin/products/' + p.id, { method: 'PUT', body: { ...p, active: c.checked } });
      await reload();
      toast(c.checked ? 'პროდუქტი გამოჩნდა საიტზე' : 'პროდუქტი დაიმალა');
    }));
    $$('[data-move]').forEach((b) => b.addEventListener('click', async () => {
      const i = Number(b.dataset.move);
      const j = i + Number(b.dataset.dir);
      const ids = db.products.map((p) => p.id);
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await api('/admin/products/reorder', { method: 'POST', body: { ids } });
      await reload();
      products();
    }));
  }

  function editProduct(id) {
    const p = id ? { ...db.products.find((x) => x.id === id) } : {
      name: '', nameEn: '', slug: '', category: 'fruit', tagline: '', description: '', ingredients: '', price: 10, oldPrice: null,
      weight: '25 გ', stock: 50, color: '#F58220', illustration: 'strawberry', image: '', badge: '', featured: false, active: true,
      nutrition: { kcal: '', protein: '', carbs: '', fat: '' },
    };
    const n = p.nutrition || {};
    openDrawer(`
      <div class="drawer__head"><h2>${id ? 'რედაქტირება' : 'ახალი პროდუქტი'}</h2><button class="icon" type="button" data-drawer-close>✕</button></div>
      <div class="preview-card" data-preview></div>
      <form data-product-form>
        <fieldset><legend>ძირითადი</legend><div class="form-grid">
          <label class="field full"><span>დასახელება *</span><input name="name" required value="${esc(p.name)}"></label>
          <label class="field"><span>დასახელება (EN)</span><input name="nameEn" value="${esc(p.nameEn)}"><small>Lab Mix-ში ელემენტის სიმბოლოსთვის</small></label>
          <label class="field"><span>კატეგორია</span><select name="category">${Object.entries(CATEGORY).map(([k, v]) => `<option value="${k}" ${p.category === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field full"><span>მოკლე აღწერა</span><input name="tagline" value="${esc(p.tagline)}"></label>
          <label class="field full"><span>სრული აღწერა</span><textarea name="description" rows="4">${esc(p.description)}</textarea></label>
          <label class="field full"><span>შემადგენლობა</span><input name="ingredients" value="${esc(p.ingredients)}"></label>
        </div></fieldset>
        <fieldset><legend>ფასი და მარაგი</legend><div class="form-grid">
          <label class="field"><span>ფასი (${esc(db.settings.currency)}) *</span><input name="price" type="number" step="0.01" min="0" required value="${p.price}"></label>
          <label class="field"><span>ძველი ფასი (ფასდაკლებისთვის)</span><input name="oldPrice" type="number" step="0.01" min="0" value="${p.oldPrice ?? ''}"></label>
          <label class="field"><span>მარაგი (ცალი)</span><input name="stock" type="number" min="0" step="1" value="${p.stock}"></label>
          <label class="field"><span>წონა</span><input name="weight" value="${esc(p.weight)}"></label>
          <label class="field"><span>ბეჯი (მაგ. „ახალი“, „-20%“)</span><input name="badge" value="${esc(p.badge)}"></label>
          <label class="field"><span>URL (slug)</span><input name="slug" value="${esc(p.slug)}" placeholder="ავტომატური"></label>
        </div></fieldset>
        <fieldset><legend>ვიზუალი</legend>
          <div class="form-grid">
            <div class="field full"><span>ფოტო</span>
              <div class="upload">
                <div class="upload__preview" data-img-preview></div>
                <div>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-file hidden>
                  <button class="btn btn--sm" type="button" data-pick-file>ფოტოს ატვირთვა</button>
                  <button class="btn btn--sm btn--ghost" type="button" data-clear-img>ფოტოს წაშლა</button>
                  <p class="muted" style="margin:6px 0 0;font-size:12px">თუ ფოტო არ არის, გამოჩნდება ილუსტრაცია. რეკომენდებულია კვადრატული, 1000×1000.</p>
                </div>
              </div>
            </div>
            <label class="field"><span>ფერი</span><input type="color" name="color" value="${esc(p.color)}"></label>
            <div class="field full"><span>ილუსტრაცია</span>
              <div class="illo-pick" data-illos>${ILLOS.map((k) => `<button type="button" title="${esc(ILLO_NAMES[k] || k)}" data-illo="${k}" class="${p.illustration === k ? 'is-on' : ''}">${illo(k, p.color)}</button>`).join('')}</div>
            </div>
          </div>
        </fieldset>
        <fieldset><legend>კვებითი ღირებულება (100 გ)</legend><div class="form-grid">
          <label class="field"><span>კალორია</span><input name="kcal" value="${esc(n.kcal)}"></label>
          <label class="field"><span>ცილა</span><input name="protein" value="${esc(n.protein)}"></label>
          <label class="field"><span>ნახშირწყლები</span><input name="carbs" value="${esc(n.carbs)}"></label>
          <label class="field"><span>ცხიმი</span><input name="fat" value="${esc(n.fat)}"></label>
        </div></fieldset>
        <fieldset><legend>ხილვადობა</legend>
          <label class="check"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}> ჩანს საიტზე</label>
        </fieldset>
        <div class="save-bar">
          ${id ? '<button class="btn btn--danger" type="button" data-del-product>წაშლა</button>' : ''}
          <button class="btn btn--primary" type="submit">შენახვა</button>
        </div>
      </form>`);

    const form = $('[data-product-form]');
    const preview = () => {
      const f = new FormData(form);
      p.color = f.get('color');
      $('[data-preview]').innerHTML = `
        <div class="thumb" style="background:${esc(p.color)}22">${visual(p)}</div>
        <div><b class="prod-name">${esc(f.get('name') || 'დასახელება')}</b><br><span class="muted">${esc(f.get('tagline'))}</span><br><b>${money(f.get('price'))}</b></div>`;
      $('[data-img-preview]').innerHTML = visual(p);
    };
    form.addEventListener('input', (e) => {
      if (e.target.name === 'color') $$('[data-illo]').forEach((b) => (b.innerHTML = illo(b.dataset.illo, e.target.value)));
      preview();
    });
    $$('[data-illo]').forEach((b) => b.addEventListener('click', () => {
      p.illustration = b.dataset.illo;
      $$('[data-illo]').forEach((x) => x.classList.toggle('is-on', x === b));
      preview();
    }));
    $('[data-pick-file]').addEventListener('click', () => $('[data-file]').click());
    $('[data-file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('image', file);
      try {
        const { url } = await api('/admin/upload', { method: 'POST', body: fd });
        p.image = url;
        preview();
        toast('ფოტო აიტვირთა ✓');
      } catch (ex) {
        toast(ex.message);
      }
    });
    $('[data-clear-img]').addEventListener('click', () => { p.image = ''; preview(); });
    preview();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const body = {
        ...f,
        active: form.active.checked,
        featured: p.featured,
        illustration: p.illustration,
        image: p.image || '',
        nutrition: { kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat },
      };
      try {
        await api(id ? '/admin/products/' + id : '/admin/products', { method: id ? 'PUT' : 'POST', body });
        await reload();
        closeDrawer();
        products();
        toast('პროდუქტი შენახულია ✓');
      } catch (ex) {
        toast(ex.message);
      }
    });
    $('[data-del-product]')?.addEventListener('click', async () => {
      if (!confirm(`წავშალო „${p.name}“?`)) return;
      await api('/admin/products/' + id, { method: 'DELETE' });
      await reload();
      closeDrawer();
      products();
      toast('პროდუქტი წაიშალა');
    });
  }

  /* ---------------------------------------------------------- content */

  const LABELS = {
    announcement: 'განცხადების ზოლი (ზედა)',
    hero: 'მთავარი ბლოკი (Hero)', eyebrow: 'ზედა წარწერა', title: 'სათაური', highlight: 'გამოკვეთილი სიტყვა', subtitle: 'ქვესათაური',
    ctaPrimary: 'მთავარი ღილაკი', ctaSecondary: 'მეორე ღილაკი',
    stats: 'ციფრები', value: 'მნიშვნელობა', suffix: 'სუფიქსი (%, გ…)', label: 'წარწერა',
    process: 'პროცესი (ლაბორატორია)', steps: 'ეტაპები', temp: 'ტემპერატურა/ნიშნული', text: 'ტექსტი',
    benefits: 'უპირატესობები', icon: 'აიკონი (emoji)',
    mixer: 'Lab Mix ბლოკი', about: 'ჩვენ შესახებ',
    testimonials: 'შეფასებები', name: 'სახელი', rating: 'რეიტინგი (1–5)',
    faq: 'ხშირად დასმული კითხვები', q: 'კითხვა', a: 'პასუხი',
    newsletter: 'გამოწერის ბლოკი',
  };
  const LONG = new Set(['subtitle', 'text', 'a', 'announcement']);

  function content() {
    const draft = JSON.parse(JSON.stringify(db.content));
    root.innerHTML = `
      <div class="page-head"><div><h1>საიტის კონტენტი</h1><p>შეცვალეთ ტექსტები და დააჭირეთ „შენახვას“ — ცვლილება მაშინვე გამოჩნდება საიტზე.</p></div>
        <a href="/" target="_blank" rel="noopener" class="btn btn--sm">საიტის ნახვა ↗</a></div>
      <form data-content-form>
        <div data-content-fields></div>
        <div class="save-bar"><button class="btn btn--primary" type="submit">ცვლილებების შენახვა</button></div>
      </form>`;

    const draw = () => {
      $('[data-content-fields]').innerHTML = Object.keys(draft).map((k) => `<div class="card">${fieldFor(draft[k], [k], k)}</div>`).join('');
    };

    function fieldFor(value, path, key) {
      const label = LABELS[key] || key;
      const p = esc(JSON.stringify(path));
      if (typeof value === 'string' || typeof value === 'number') {
        const long = LONG.has(key) || String(value).length > 80;
        return `<label class="field" style="margin-bottom:12px"><span>${esc(label)}</span>${long
          ? `<textarea data-path="${p}" rows="3">${esc(value)}</textarea>`
          : `<input data-path="${p}" ${typeof value === 'number' ? 'type="number"' : ''} value="${esc(value)}">`}</label>`;
      }
      if (Array.isArray(value)) {
        return `<h2>${esc(label)}</h2>
          ${value.map((item, i) => `
            <div class="arr-item">
              <div class="arr-item__tools"><span class="mono">#${i + 1}</span>
                <button class="icon" type="button" data-arr="${p}" data-act="up" data-i="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
                <button class="icon" type="button" data-arr="${p}" data-act="down" data-i="${i}" ${i === value.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="icon" type="button" data-arr="${p}" data-act="del" data-i="${i}" title="წაშლა">✕</button>
              </div>
              <div class="form-grid">${Object.keys(item).map((k) => `<div class="${LONG.has(k) ? 'full' : ''}">${fieldFor(item[k], [...path, i, k], k)}</div>`).join('')}</div>
            </div>`).join('')}
          <button class="btn btn--sm" type="button" data-arr="${p}" data-act="add">+ დამატება</button>`;
      }
      return `<h2>${esc(label)}</h2>${Object.keys(value).map((k) => fieldFor(value[k], [...path, k], k)).join('')}`;
    }

    const getAt = (path) => path.reduce((o, k) => o[k], draft);
    const setAt = (path, v) => { const last = path[path.length - 1]; getAt(path.slice(0, -1))[last] = v; };

    const form = $('[data-content-form]');
    form.addEventListener('input', (e) => {
      if (!e.target.dataset.path) return;
      const path = JSON.parse(e.target.dataset.path);
      setAt(path, e.target.type === 'number' ? Number(e.target.value) : e.target.value);
    });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-arr]');
      if (!b) return;
      const arr = getAt(JSON.parse(b.dataset.arr));
      const i = Number(b.dataset.i);
      if (b.dataset.act === 'add') {
        const tpl = arr[0] ? Object.fromEntries(Object.entries(arr[0]).map(([k, v]) => [k, typeof v === 'number' ? 5 : ''])) : { text: '' };
        arr.push(tpl);
      } else if (b.dataset.act === 'del') {
        if (!confirm('წავშალო ეს ელემენტი?')) return;
        arr.splice(i, 1);
      } else {
        const j = b.dataset.act === 'up' ? i - 1 : i + 1;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      draw();
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        db.content = await api('/admin/content', { method: 'PUT', body: draft });
        toast('კონტენტი შენახულია ✓');
      } catch (ex) {
        toast(ex.message);
      }
    });
    draw();
  }

  /* --------------------------------------------------------- settings */

  function settings() {
    const s = db.settings;
    const input = (name, label, type = 'text', extra = '') => `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(s[name])}" ${extra}></label>`;
    root.innerHTML = `
      <div class="page-head"><div><h1>პარამეტრები</h1><p>მიწოდება, ფასები, კონტაქტები და გადახდის მეთოდები.</p></div></div>
      <form data-settings-form>
        <div class="card"><h2>მიწოდება და ფასები</h2><div class="form-grid">
          ${input('currency', 'ვალუტის სიმბოლო')}
          ${input('deliveryFee', 'მიწოდების ფასი', 'number', 'step="0.01" min="0"')}
          ${input('freeDeliveryFrom', 'უფასო მიწოდება თანხიდან (0 = გამორთული)', 'number', 'step="0.01" min="0"')}
          ${input('mixPrice', 'Lab Mix-ის ფასი (მომხმარებლის მიერ აწყობილი)', 'number', 'step="0.01" min="0"')}
        </div></div>
        <div class="card"><h2>გადახდის მეთოდები</h2>
          <label class="check" style="margin-bottom:12px"><input type="checkbox" name="cashOnDelivery" ${s.cashOnDelivery ? 'checked' : ''}> გადახდა მიტანისას</label>
          <label class="check"><input type="checkbox" name="onlinePayments" ${s.onlinePayments ? 'checked' : ''}> ონლაინ გადახდა ბარათით</label>
          <p class="muted" style="font-size:13px;margin:10px 0 0">${db.paymentsConfigured
            ? '✅ Flitt დაკავშირებულია. ჩართეთ „ონლაინ გადახდა“, რომ მომხმარებლებმა ბარათით გადაიხადონ.'
            : '⚠️ Flitt ჯერ არ არის დაკავშირებული: სერვერზე საჭიროა FLITT_MERCHANT_ID, FLITT_SECRET_KEY და PUBLIC_URL. მანამდე ბარათით გადახდა საიტზე არ გამოჩნდება.'}</p>
        </div>
        <div class="card"><h2>კონტაქტი</h2><div class="form-grid">
          ${input('phone', 'ტელეფონი')}${input('email', 'ელ-ფოსტა', 'email')}
          ${input('address', 'მისამართი')}${input('hours', 'სამუშაო საათები')}
        </div></div>
        <div class="card"><h2>სოციალური ქსელები</h2><div class="form-grid">
          ${input('instagram', 'Instagram ბმული', 'url')}${input('facebook', 'Facebook ბმული', 'url')}${input('tiktok', 'TikTok ბმული', 'url')}
        </div></div>
        <div class="save-bar"><button class="btn btn--primary" type="submit">შენახვა</button></div>
      </form>`;
    $('[data-settings-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const body = Object.fromEntries(new FormData(f));
      body.cashOnDelivery = f.cashOnDelivery.checked;
      body.onlinePayments = f.onlinePayments.checked;
      try {
        db.settings = await api('/admin/settings', { method: 'PUT', body });
        toast('პარამეტრები შენახულია ✓');
      } catch (ex) {
        toast(ex.message);
      }
    });
  }

  /* ------------------------------------------------------ subscribers */

  function subscribers() {
    root.innerHTML = `
      <div class="page-head"><div><h1>გამომწერები</h1><p>${db.subscribers.length} ელ-ფოსტა</p></div>
        <button class="btn btn--sm" type="button" data-export-subs ${db.subscribers.length ? '' : 'disabled'}>CSV ექსპორტი ⤓</button></div>
      <div class="card">${db.subscribers.length ? `<table>
        <thead><tr><th>ელ-ფოსტა</th><th>თარიღი</th><th></th></tr></thead>
        <tbody>${db.subscribers.map((s) => `<tr><td>${esc(s.email)}</td><td>${date(s.createdAt)}</td><td style="text-align:right"><button class="icon" type="button" data-del-sub="${esc(s.email)}" title="წაშლა">✕</button></td></tr>`).join('')}</tbody>
      </table>` : '<p class="empty">ჯერ არავინ გამოწერილა.</p>'}</div>`;
    $('[data-export-subs]').addEventListener('click', () => downloadCsv('taste-lab-subscribers.csv', [['email', 'date'], ...db.subscribers.map((s) => [s.email, s.createdAt])]));
    $$('[data-del-sub]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('წავშალო ' + b.dataset.delSub + '?')) return;
      await api('/admin/subscribers/' + encodeURIComponent(b.dataset.delSub), { method: 'DELETE' });
      await reload();
      subscribers();
    }));
  }

  /* --------------------------------------------------------- security */

  function security() {
    root.innerHTML = `
      <div class="page-head"><div><h1>პაროლის შეცვლა</h1><p>შეცვლის შემდეგ ყველა სხვა მოწყობილობიდან სესია დაიხურება.</p></div></div>
      <form class="card" style="max-width:480px" data-pw-form>
        <label class="field" style="margin-bottom:14px"><span>მიმდინარე პაროლი</span><input type="password" name="current" required autocomplete="current-password"></label>
        <label class="field" style="margin-bottom:14px"><span>ახალი პაროლი (მინ. 8 სიმბოლო)</span><input type="password" name="next" required minlength="8" autocomplete="new-password"></label>
        <label class="field" style="margin-bottom:14px"><span>გაიმეორეთ ახალი პაროლი</span><input type="password" name="repeat" required minlength="8" autocomplete="new-password"></label>
        <button class="btn btn--primary" type="submit">პაროლის შეცვლა</button>
      </form>`;
    $('[data-pw-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const f = Object.fromEntries(new FormData(form));
      if (f.next !== f.repeat) return toast('ახალი პაროლები არ ემთხვევა');
      try {
        await api('/admin/password', { method: 'POST', body: f });
        form.reset();
        $('[data-default-pw]').hidden = true;
        toast('პაროლი შეიცვალა ✓');
      } catch (ex) {
        toast(ex.message);
      }
    });
  }

  /* ----------------------------------------------------------- drawer */

  function openDrawer(html) {
    $('[data-drawer-body]').innerHTML = html;
    $('[data-drawer]').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    $('[data-drawer]').hidden = true;
    document.body.style.overflow = '';
  }
  $('[data-drawer]').addEventListener('click', (e) => { if (e.target.closest('[data-drawer-close]')) closeDrawer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('[data-drawer]').hidden) closeDrawer(); });

  boot();
})();
