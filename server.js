'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const store = require('./lib/store');
const auth = require('./lib/auth');
const payments = require('./lib/payments');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const UPLOAD_DIR = path.join(store.DATA_DIR, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
store.init();
auth.init();

const app = express();
app.disable('x-powered-by');
// Behind a reverse proxy (Caddy, Nginx, Render…) so req.secure and req.ip are correct.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
app.use(express.json({ limit: '200kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

/* ---------------------------------------------------------------- helpers */

const ORDER_STATUSES = ['new', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const CATEGORIES = ['yogurt', 'fruit', 'sweets', 'mix'];

function str(v, max = 500) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function num(v, { min = 0, max = 1e7, int = false } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  const clamped = Math.min(max, Math.max(min, n));
  return int ? Math.round(clamped) : Math.round(clamped * 100) / 100;
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || crypto.randomBytes(4).toString('hex');
}

function publicProduct(p) {
  const { createdAt, updatedAt, ...rest } = p;
  return rest;
}

function sanitizeProduct(input, existing = {}) {
  const nutrition = input.nutrition && typeof input.nutrition === 'object' ? input.nutrition : {};
  return {
    ...existing,
    name: str(input.name, 120) || existing.name || 'ახალი პროდუქტი',
    slug: slugify(str(input.slug, 60) || existing.slug || input.nameEn || ''),
    nameEn: str(input.nameEn, 120),
    category: CATEGORIES.includes(input.category) ? input.category : 'fruit',
    tagline: str(input.tagline, 160),
    description: str(input.description, 2000),
    ingredients: str(input.ingredients, 500),
    price: num(input.price, { min: 0, max: 100000 }),
    oldPrice: input.oldPrice === '' || input.oldPrice == null ? null : num(input.oldPrice, { min: 0, max: 100000 }),
    weight: str(input.weight, 30),
    stock: num(input.stock, { min: 0, max: 1e6, int: true }),
    color: /^#[0-9a-fA-F]{6}$/.test(input.color) ? input.color : '#F58220',
    illustration: str(input.illustration, 30) || 'strawberry',
    image: typeof input.image === 'string' && /^\/(uploads|products)\/[\w.-]+$/.test(input.image) ? input.image : (input.image === '' ? '' : existing.image || ''),
    badge: str(input.badge, 30),
    featured: Boolean(input.featured),
    active: input.active === undefined ? true : Boolean(input.active),
    nutrition: {
      kcal: str(String(nutrition.kcal ?? ''), 20),
      protein: str(String(nutrition.protein ?? ''), 20),
      carbs: str(String(nutrition.carbs ?? ''), 20),
      fat: str(String(nutrition.fat ?? ''), 20),
    },
  };
}

function computeTotals(items, settings) {
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const freeFrom = Number(settings.freeDeliveryFrom) || 0;
  const delivery = subtotal === 0 || (freeFrom > 0 && subtotal >= freeFrom) ? 0 : Number(settings.deliveryFee) || 0;
  return { subtotal, delivery, total: Math.round((subtotal + delivery) * 100) / 100 };
}

/* ------------------------------------------------------------- public API */

app.get('/api/site', (req, res) => {
  const db = store.read();
  res.json({
    content: db.content,
    // Card payment is only offered once Flitt credentials are set on the server.
    settings: { ...db.settings, onlinePayments: Boolean(db.settings.onlinePayments) && payments.configured() },
    products: db.products.filter((p) => p.active).map(publicProduct),
  });
});

app.post('/api/orders', (req, res) => {
  const db = store.read();
  const body = req.body || {};
  const customer = {
    name: str(body.customer?.name, 100),
    phone: str(body.customer?.phone, 30),
    email: str(body.customer?.email, 120),
    city: str(body.customer?.city, 60),
    address: str(body.customer?.address, 300),
    note: str(body.customer?.note, 500),
  };
  if (!customer.name || !/^[+\d\s()-]{7,20}$/.test(customer.phone) || !customer.address) {
    return res.status(400).json({ error: 'გთხოვთ შეავსოთ სახელი, ტელეფონი და მისამართი.' });
  }

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const items = [];
  for (const raw of rawItems) {
    const qty = num(raw.qty, { min: 1, max: 99, int: true });
    if (raw.type === 'mix') {
      // Custom "lab mix" box — composed of active products, priced from settings.
      const parts = (Array.isArray(raw.parts) ? raw.parts : [])
        .map((id) => db.products.find((p) => p.id === id && p.active))
        .filter(Boolean)
        .slice(0, 4);
      if (parts.length < 2) continue;
      items.push({
        type: 'mix',
        name: 'ჩემი Lab Mix — ' + parts.map((p) => p.name).join(' + '),
        parts: parts.map((p) => p.id),
        price: num(db.settings.mixPrice, { min: 0 }),
        qty,
      });
      continue;
    }
    const product = db.products.find((p) => p.id === raw.id && p.active);
    if (!product) continue;
    if (product.stock < qty) {
      return res.status(409).json({ error: `"${product.name}" — მარაგში მხოლოდ ${product.stock} ცალია.` });
    }
    items.push({ type: 'product', id: product.id, name: product.name, price: product.price, qty });
  }
  if (!items.length) return res.status(400).json({ error: 'კალათა ცარიელია.' });

  const paymentMethod = payments.methods(db.settings).some((m) => m.id === body.paymentMethod && m.enabled)
    ? body.paymentMethod
    : 'cash';

  const order = store.update((d) => {
    d.counters.order = (d.counters.order || 1000) + 1;
    const number = 'TL-' + d.counters.order;
    for (const item of items) {
      if (item.type !== 'product') continue;
      const p = d.products.find((x) => x.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.qty);
    }
    const o = {
      id: crypto.randomUUID(),
      number,
      createdAt: new Date().toISOString(),
      status: 'new',
      paymentMethod,
      paymentStatus: 'pending',
      paymentRef: paymentMethod === 'card' ? payments.paymentRef({ number }) : undefined,
      customer,
      items,
      ...computeTotals(items, d.settings),
    };
    d.orders.unshift(o);
    return o;
  });

  payments
    .createPayment(order)
    .then((payment) => res.status(201).json({ order: { number: order.number, total: order.total }, payment }))
    .catch((err) => {
      // The customer chose to pay by card, so don't keep an order nobody can pay for.
      console.error('payment init failed', order.number, err.message);
      store.update((d) => {
        const o = d.orders.find((x) => x.id === order.id);
        if (o) cancelOrder(d, o, 'გადახდის გვერდი ვერ შეიქმნა');
      });
      res.status(502).json({ error: 'ონლაინ გადახდა ახლა ვერ ხერხდება. სცადეთ თავიდან ან აირჩიეთ „გადახდა მიტანისას“.' });
    });
});

// Puts stock back (once) and cancels an order that was never paid.
function cancelOrder(d, o, reason) {
  if (!o.restocked) {
    for (const item of o.items) {
      const p = item.type === 'product' && d.products.find((x) => x.id === item.id);
      if (p) p.stock += item.qty;
    }
    o.restocked = true;
  }
  o.status = 'cancelled';
  if (reason) o.adminNote = [o.adminNote, reason].filter(Boolean).join('\n');
}

// Applies a verified Flitt result to its order. Safe to call repeatedly:
// Flitt reports each payment both to the callback and via the browser return.
function applyPayment(result) {
  return store.update((d) => {
    const o = d.orders.find((x) => x.paymentRef && x.paymentRef === result.ref);
    if (!o) return null;
    o.paymentId = result.paymentId || o.paymentId;
    o.flittStatus = result.flittStatus;
    if (result.status === 'paid') {
      if (result.amount !== Math.round(o.total * 100)) {
        console.error('Flitt amount mismatch', o.number, result.amount, o.total);
        o.adminNote = [o.adminNote, `⚠️ გადახდილი თანხა (${result.amount / 100}) არ ემთხვევა შეკვეთას`].filter(Boolean).join('\n');
        return o;
      }
      o.paymentStatus = 'paid';
      if (o.status === 'new') o.status = 'paid';
    } else if (result.status === 'failed' && o.paymentStatus !== 'paid') {
      o.paymentStatus = 'failed';
      if (o.status === 'new') cancelOrder(d, o, 'ონლაინ გადახდა არ შედგა');
    } else if (result.status === 'refunded') {
      o.paymentStatus = 'refunded';
    }
    return o;
  });
}

app.post('/api/subscribe', (req, res) => {
  const email = str(req.body?.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  store.update((d) => {
    if (!d.subscribers.some((x) => x.email === email)) d.subscribers.unshift({ email, createdAt: new Date().toISOString() });
  });
  res.json({ ok: true });
});

const formBody = express.urlencoded({ extended: false, limit: '50kb' });

// Server-to-server notification from Flitt.
app.post('/api/payments/callback', formBody, (req, res) => {
  const result = payments.parseResult(req.body);
  if (!result) {
    console.warn('Flitt callback with invalid signature');
    return res.status(400).send('invalid signature');
  }
  const o = applyPayment(result);
  if (!o) console.warn('Flitt callback for unknown order', result.ref);
  res.send('OK');
});

// Flitt sends the customer's browser back here (as a form POST) after paying.
function paymentReturn(req, res) {
  const result = payments.parseResult(req.method === 'POST' ? req.body : req.query);
  const o = result && applyPayment(result);
  const qs = o ? `order=${encodeURIComponent(o.number)}&payment=${o.paymentStatus}` : 'payment=unknown';
  res.redirect(303, '/checkout?' + qs);
}
app.post('/payment/return', formBody, paymentReturn);
app.get('/payment/return', paymentReturn);

/* -------------------------------------------------------------- admin API */

const loginAttempts = new Map();

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (rec.until > now) return res.status(429).json({ error: 'ძალიან ბევრი მცდელობა. სცადეთ რამდენიმე წუთში.' });

  if (!auth.verifyPassword(str(req.body?.password, 200))) {
    rec.count += 1;
    if (rec.count >= 5) {
      rec.until = now + 5 * 60 * 1000;
      rec.count = 0;
    }
    loginAttempts.set(ip, rec);
    return res.status(401).json({ error: 'პაროლი არასწორია.' });
  }
  loginAttempts.delete(ip);
  res.setHeader('Set-Cookie', auth.sessionCookie(auth.createToken(), req.secure));
  res.json({ ok: true, defaultPassword: auth.isDefaultPassword() });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', auth.clearCookie());
  res.json({ ok: true });
});

const admin = express.Router();
admin.use(auth.requireAdmin);

admin.get('/me', (req, res) => res.json({ ok: true, defaultPassword: auth.isDefaultPassword() }));

admin.post('/password', (req, res) => {
  const current = str(req.body?.current, 200);
  const next = str(req.body?.next, 200);
  if (!auth.verifyPassword(current)) return res.status(400).json({ error: 'მიმდინარე პაროლი არასწორია.' });
  if (next.length < 8) return res.status(400).json({ error: 'ახალი პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს.' });
  auth.setPassword(next);
  res.setHeader('Set-Cookie', auth.sessionCookie(auth.createToken(), req.secure));
  res.json({ ok: true });
});

admin.get('/data', (req, res) => {
  const { auth: _auth, ...db } = store.read();
  res.json({ ...db, statuses: ORDER_STATUSES, paymentsConfigured: payments.configured() });
});

admin.post('/products', (req, res) => {
  const product = store.update((d) => {
    const p = sanitizeProduct(req.body || {});
    p.id = crypto.randomUUID();
    if (d.products.some((x) => x.slug === p.slug)) p.slug += '-' + crypto.randomBytes(2).toString('hex');
    p.createdAt = p.updatedAt = new Date().toISOString();
    d.products.push(p);
    return p;
  });
  res.status(201).json(product);
});

admin.put('/products/:id', (req, res) => {
  const product = store.update((d) => {
    const i = d.products.findIndex((x) => x.id === req.params.id);
    if (i === -1) return null;
    const p = sanitizeProduct(req.body || {}, d.products[i]);
    if (d.products.some((x) => x.slug === p.slug && x.id !== p.id)) p.slug += '-' + crypto.randomBytes(2).toString('hex');
    p.updatedAt = new Date().toISOString();
    d.products[i] = p;
    return p;
  });
  if (!product) return res.status(404).json({ error: 'not found' });
  res.json(product);
});

admin.delete('/products/:id', (req, res) => {
  store.update((d) => {
    d.products = d.products.filter((x) => x.id !== req.params.id);
  });
  res.json({ ok: true });
});

admin.post('/products/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  store.update((d) => {
    d.products.sort((a, b) => {
      const ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
      return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
    });
  });
  res.json({ ok: true });
});

admin.put('/orders/:id', (req, res) => {
  const order = store.update((d) => {
    const o = d.orders.find((x) => x.id === req.params.id);
    if (!o) return null;
    if (ORDER_STATUSES.includes(req.body?.status)) o.status = req.body.status;
    if (['pending', 'paid', 'failed', 'refunded'].includes(req.body?.paymentStatus)) o.paymentStatus = req.body.paymentStatus;
    if (typeof req.body?.adminNote === 'string') o.adminNote = str(req.body.adminNote, 1000);
    return o;
  });
  if (!order) return res.status(404).json({ error: 'not found' });
  res.json(order);
});

admin.delete('/orders/:id', (req, res) => {
  store.update((d) => {
    d.orders = d.orders.filter((x) => x.id !== req.params.id);
  });
  res.json({ ok: true });
});

admin.delete('/subscribers/:email', (req, res) => {
  store.update((d) => {
    d.subscribers = d.subscribers.filter((x) => x.email !== req.params.email);
  });
  res.json({ ok: true });
});

admin.put('/content', (req, res) => {
  const content = store.update((d) => {
    d.content = store.mergeContent(d.content, req.body || {});
    return d.content;
  });
  res.json(content);
});

admin.put('/settings', (req, res) => {
  const b = req.body || {};
  const settings = store.update((d) => {
    const s = d.settings;
    s.currency = str(b.currency, 5) || '₾';
    s.deliveryFee = num(b.deliveryFee);
    s.freeDeliveryFrom = num(b.freeDeliveryFrom);
    s.mixPrice = num(b.mixPrice);
    s.phone = str(b.phone, 40);
    s.email = str(b.email, 120);
    s.address = str(b.address, 200);
    s.hours = str(b.hours, 100);
    s.instagram = str(b.instagram, 200);
    s.facebook = str(b.facebook, 200);
    s.tiktok = str(b.tiktok, 200);
    s.cashOnDelivery = Boolean(b.cashOnDelivery);
    s.onlinePayments = Boolean(b.onlinePayments);
    return s;
  });
  res.json(settings);
});

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype];
      cb(null, Date.now().toString(36) + '-' + crypto.randomBytes(6).toString('hex') + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)),
});

admin.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ატვირთეთ JPG, PNG, WEBP ან GIF (მაქს. 5MB).' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.use('/api/admin', admin);

app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'ფაილი ძალიან დიდია (მაქს. 5MB).' : 'სერვერის შეცდომა' });
});

/* ------------------------------------------------------------ static files */

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
app.use(express.static(path.join(ROOT, 'public'), { extensions: ['html'] }));
app.use((req, res) => res.status(404).sendFile(path.join(ROOT, 'public', '404.html')));

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Taste Lab → http://localhost:${PORT}`);
    console.log(`Admin     → http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
