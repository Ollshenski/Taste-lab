/* Taste Lab — shared storefront helpers: site data, cart model, formatting. */
(function () {
  const CART_KEY = 'tl_cart_v1';
  const listeners = new Set();
  let site = null;

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function money(n) {
    const cur = site?.settings?.currency || '₾';
    const v = Number(n) || 0;
    return (Number.isInteger(v) ? v : v.toFixed(2)) + ' ' + cur;
  }

  function get(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  async function loadSite() {
    const res = await fetch('/api/site');
    if (!res.ok) throw new Error('site load failed');
    site = await res.json();
    return site;
  }

  /* -------------------------------------------------------------- cart */

  function readCart() {
    try {
      const v = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  let cart = readCart();

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode */ }
    listeners.forEach((fn) => fn(cart));
  }

  function productById(id) {
    return site?.products.find((p) => p.id === id);
  }

  // Cart lines: { key, type: 'product'|'mix', id?, parts?, qty }
  // Prices and names are always resolved from live site data.
  function resolveLine(line) {
    if (line.type === 'mix') {
      const parts = (line.parts || []).map(productById).filter(Boolean);
      if (parts.length < 2) return null;
      return { ...line, name: 'Lab Mix: ' + parts.map((p) => p.name.replace(/^.*— /, '')).join(' + '), price: Number(site.settings.mixPrice) || 0, parts, color: parts[0].color, illustration: 'mix' };
    }
    const p = productById(line.id);
    if (!p) return null;
    return { ...line, name: p.name, price: p.price, color: p.color, illustration: p.illustration, image: p.image, stock: p.stock, weight: p.weight };
  }

  function lines() {
    return cart.map(resolveLine).filter(Boolean);
  }

  function totals() {
    const items = lines();
    const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
    const free = Number(site?.settings?.freeDeliveryFrom) || 0;
    const delivery = subtotal === 0 || (free > 0 && subtotal >= free) ? 0 : Number(site?.settings?.deliveryFee) || 0;
    return { items, subtotal, delivery, total: Math.round((subtotal + delivery) * 100) / 100, count: items.reduce((s, i) => s + i.qty, 0), free };
  }

  function add(id, qty = 1) {
    const p = productById(id);
    if (!p) return false;
    const line = cart.find((l) => l.type === 'product' && l.id === id);
    const current = line ? line.qty : 0;
    const next = Math.min(p.stock, current + qty, 99);
    if (next <= current) return false;
    if (line) line.qty = next;
    else cart.push({ key: 'p:' + id, type: 'product', id, qty: next });
    saveCart();
    return true;
  }

  function addMix(parts) {
    const key = 'm:' + parts.slice().sort().join(',');
    const line = cart.find((l) => l.key === key);
    if (line) line.qty = Math.min(99, line.qty + 1);
    else cart.push({ key, type: 'mix', parts: parts.slice(), qty: 1 });
    saveCart();
  }

  function setQty(key, qty) {
    const line = cart.find((l) => l.key === key);
    if (!line) return;
    if (qty <= 0) cart = cart.filter((l) => l.key !== key);
    else {
      const max = line.type === 'product' ? productById(line.id)?.stock ?? 99 : 99;
      line.qty = Math.min(qty, max, 99);
    }
    saveCart();
  }

  function clear() {
    cart = [];
    saveCart();
  }

  function onChange(fn) {
    listeners.add(fn);
  }

  // Drop lines whose product no longer exists or exceeds stock.
  function reconcile() {
    cart = cart.filter((l) => resolveLine(l));
    cart.forEach((l) => {
      if (l.type === 'product') l.qty = Math.min(l.qty, productById(l.id).stock);
    });
    cart = cart.filter((l) => l.qty > 0);
    saveCart();
  }

  function visual(item, cls = '') {
    if (item.image) return `<img class="${cls}" src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">`;
    return window.TLIllo.illo(item.illustration, item.color, cls);
  }

  let toastTimer;
  function toast(msg) {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  window.TL = {
    esc, money, get, loadSite, toast, visual,
    get site() { return site; },
    cart: { add, addMix, setQty, clear, lines, totals, onChange, reconcile, raw: () => cart.slice() },
  };
})();
