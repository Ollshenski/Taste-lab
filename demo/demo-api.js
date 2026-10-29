/* Taste Lab — browser-only demo backend.
   Replaces the Express API with a localStorage-backed mock so the shop and the
   admin panel can be tried without a server (e.g. as a hosted static demo).
   Each visitor gets their own copy of the data. Injected by scripts/build-demo.js. */
(function () {
  const SEED = __SEED__;
  const KEY = 'tl_demo_db_v1';
  const SESSION = 'tl_demo_admin';
  const PASSWORD_DEFAULT = 'tastelab2026';
  const STATUSES = ['new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

  // The demo host blocks native confirm dialogs; accept them so deletes work.
  window.confirm = () => true;

  const clone = (v) => JSON.parse(JSON.stringify(v));
  let memory = null;
  function load() {
    if (memory) return memory;
    try { memory = JSON.parse(localStorage.getItem(KEY)); } catch { memory = null; }
    if (!memory) memory = { ...clone(SEED), password: PASSWORD_DEFAULT };
    return memory;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* storage full or blocked */ }
  }
  const authed = () => { try { return sessionStorage.getItem(SESSION) === '1'; } catch { return memory?._session; } };
  const setAuthed = (v) => { try { v ? sessionStorage.setItem(SESSION, '1') : sessionStorage.removeItem(SESSION); } catch { load()._session = v; } };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== '' ? Math.round(Number(v) * 100) / 100 : d);
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  function totals(items, s) {
    const subtotal = Math.round(items.reduce((a, i) => a + i.price * i.qty, 0) * 100) / 100;
    const free = Number(s.freeDeliveryFrom) || 0;
    const delivery = subtotal === 0 || (free > 0 && subtotal >= free) ? 0 : Number(s.deliveryFee) || 0;
    return { subtotal, delivery, total: Math.round((subtotal + delivery) * 100) / 100 };
  }

  function product(input, existing = {}) {
    const n = input.nutrition || {};
    return {
      ...existing,
      name: String(input.name || existing.name || 'ახალი პროდუქტი').slice(0, 120),
      nameEn: String(input.nameEn || ''), slug: String(input.slug || existing.slug || uuid().slice(0, 8)),
      category: ['yogurt', 'fruit', 'mix'].includes(input.category) ? input.category : 'fruit',
      tagline: String(input.tagline || ''), description: String(input.description || ''), ingredients: String(input.ingredients || ''),
      price: num(input.price), oldPrice: input.oldPrice === '' || input.oldPrice == null ? null : num(input.oldPrice),
      weight: String(input.weight || ''), stock: Math.max(0, Math.round(num(input.stock))),
      color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : '#F58220',
      illustration: String(input.illustration || 'strawberry'), image: typeof input.image === 'string' ? input.image : existing.image || '',
      badge: String(input.badge || ''), featured: Boolean(input.featured), active: input.active === undefined ? true : Boolean(input.active),
      nutrition: { kcal: String(n.kcal || ''), protein: String(n.protein || ''), carbs: String(n.carbs || ''), fat: String(n.fat || '') },
    };
  }

  async function handle(method, path, body) {
    const db = load();
    if (method === 'GET' && path === '/api/site') {
      return json(200, { content: db.content, settings: db.settings, products: db.products.filter((p) => p.active) });
    }
    if (method === 'POST' && path === '/api/subscribe') {
      const email = String(body?.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'invalid email' });
      if (!db.subscribers.some((s) => s.email === email)) db.subscribers.unshift({ email, createdAt: new Date().toISOString() });
      save();
      return json(200, { ok: true });
    }
    if (method === 'POST' && path === '/api/orders') {
      const c = body?.customer || {};
      if (!c.name || !/^[+\d\s()-]{7,20}$/.test(c.phone || '') || !c.address) return json(400, { error: 'გთხოვთ შეავსოთ სახელი, ტელეფონი და მისამართი.' });
      const items = [];
      for (const raw of body.items || []) {
        const qty = Math.max(1, Math.min(99, Math.round(num(raw.qty, 1))));
        if (raw.type === 'mix') {
          const parts = (raw.parts || []).map((id) => db.products.find((p) => p.id === id && p.active)).filter(Boolean).slice(0, 4);
          if (parts.length >= 2) items.push({ type: 'mix', name: 'ჩემი Lab Mix — ' + parts.map((p) => p.name).join(' + '), parts: parts.map((p) => p.id), price: num(db.settings.mixPrice), qty });
          continue;
        }
        const p = db.products.find((x) => x.id === raw.id && x.active);
        if (!p) continue;
        if (p.stock < qty) return json(409, { error: `"${p.name}" — მარაგში მხოლოდ ${p.stock} ცალია.` });
        items.push({ type: 'product', id: p.id, name: p.name, price: p.price, qty });
      }
      if (!items.length) return json(400, { error: 'კალათა ცარიელია.' });
      items.forEach((i) => { const p = i.type === 'product' && db.products.find((x) => x.id === i.id); if (p) p.stock -= i.qty; });
      db.counters.order = (db.counters.order || 1000) + 1;
      const order = { id: uuid(), number: 'TL-' + db.counters.order, createdAt: new Date().toISOString(), status: 'new', paymentMethod: 'cash', paymentStatus: 'pending', customer: c, items, ...totals(items, db.settings) };
      db.orders.unshift(order);
      save();
      return json(201, { order: { number: order.number, total: order.total }, payment: null });
    }
    if (method === 'POST' && path === '/api/admin/login') {
      if (body?.password !== db.password) return json(401, { error: 'პაროლი არასწორია. (დემო: tastelab2026)' });
      setAuthed(true);
      return json(200, { ok: true, defaultPassword: db.password === PASSWORD_DEFAULT });
    }
    if (method === 'POST' && path === '/api/admin/logout') { setAuthed(false); return json(200, { ok: true }); }
    if (!path.startsWith('/api/admin/')) return json(404, { error: 'not found' });
    if (!authed()) return json(401, { error: 'unauthorized' });

    const [, , , res, id] = path.split('/');
    const done = (status, payload) => { save(); return json(status, payload); };
    if (res === 'me') return json(200, { ok: true, defaultPassword: db.password === PASSWORD_DEFAULT });
    if (res === 'data') { const { password, _session, ...rest } = db; return json(200, { ...clone(rest), statuses: STATUSES }); }
    if (res === 'password') {
      if (body.current !== db.password) return json(400, { error: 'მიმდინარე პაროლი არასწორია.' });
      if (String(body.next || '').length < 8) return json(400, { error: 'ახალი პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.' });
      db.password = body.next;
      return done(200, { ok: true });
    }
    if (res === 'products') {
      if (id === 'reorder') {
        const ids = body.ids || [];
        db.products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        return done(200, { ok: true });
      }
      if (method === 'POST') { const p = { ...product(body), id: uuid() }; db.products.push(p); return done(201, p); }
      const i = db.products.findIndex((p) => p.id === id);
      if (i < 0) return json(404, { error: 'not found' });
      if (method === 'DELETE') { db.products.splice(i, 1); return done(200, { ok: true }); }
      db.products[i] = product(body, db.products[i]);
      return done(200, db.products[i]);
    }
    if (res === 'orders') {
      const o = db.orders.find((x) => x.id === id);
      if (!o) return json(404, { error: 'not found' });
      if (method === 'DELETE') { db.orders = db.orders.filter((x) => x !== o); return done(200, { ok: true }); }
      if (STATUSES.includes(body.status)) o.status = body.status;
      if (body.paymentStatus) o.paymentStatus = body.paymentStatus;
      if (typeof body.adminNote === 'string') o.adminNote = body.adminNote;
      return done(200, o);
    }
    if (res === 'subscribers') { db.subscribers = db.subscribers.filter((s) => s.email !== decodeURIComponent(id)); return done(200, { ok: true }); }
    if (res === 'content') { db.content = { ...db.content, ...body }; return done(200, db.content); }
    if (res === 'settings') {
      const s = db.settings;
      Object.assign(s, body, {
        deliveryFee: num(body.deliveryFee), freeDeliveryFrom: num(body.freeDeliveryFrom), mixPrice: num(body.mixPrice),
        cashOnDelivery: Boolean(body.cashOnDelivery), onlinePayments: Boolean(body.onlinePayments),
      });
      return done(200, s);
    }
    if (res === 'upload') {
      const file = body instanceof FormData ? body.get('image') : null;
      if (!file || !/^image\//.test(file.type)) return json(400, { error: 'ატვირთეთ სურათი.' });
      if (file.size > 1.5 * 1024 * 1024) return json(400, { error: 'დემოში ფოტო მაქს. 1.5MB უნდა იყოს.' });
      const url = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(file); });
      return json(200, { url });
    }
    return json(404, { error: 'not found' });
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, opts = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith('/api')) return realFetch(input, opts);
    let body = opts.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    return handle((opts.method || 'GET').toUpperCase(), url.split('?')[0], body || {});
  };

  window.TL_DEMO_RESET = () => { try { localStorage.removeItem(KEY); } catch {} memory = null; location.reload(); };
})();
