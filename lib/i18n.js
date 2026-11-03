'use strict';

// Storefront languages. Georgian is the base: every other language falls back
// to it field by field, so a half-finished translation never shows blanks.

const LANGS = ['ka', 'en', 'ru'];
const PRODUCT_FIELDS = ['name', 'tagline', 'description', 'ingredients', 'badge', 'weight'];
const SETTING_FIELDS = ['address', 'hours', 'companyName', 'legalAddress'];

const MESSAGES = {
  fields: {
    ka: 'გთხოვთ შეავსოთ სახელი, ტელეფონი და მისამართი.',
    en: 'Please enter your name, phone number and address.',
    ru: 'Пожалуйста, укажите имя, телефон и адрес.',
  },
  agree: {
    ka: 'შეკვეთისთვის საჭიროა მომსახურების პირობებზე თანხმობა.',
    en: 'Please accept the Terms of Service to place an order.',
    ru: 'Для заказа нужно принять условия обслуживания.',
  },
  stock: {
    ka: '"{name}" — მარაგში მხოლოდ {n} ცალია.',
    en: '"{name}" — only {n} left in stock.',
    ru: '«{name}» — в наличии только {n} шт.',
  },
  empty: { ka: 'კალათა ცარიელია.', en: 'Your cart is empty.', ru: 'Корзина пуста.' },
  payment: {
    ka: 'ონლაინ გადახდა ახლა ვერ ხერხდება. სცადეთ თავიდან ან აირჩიეთ „გადახდა მიტანისას“.',
    en: 'Online payment is unavailable right now. Please try again or choose “Pay on delivery”.',
    ru: 'Онлайн-оплата сейчас недоступна. Попробуйте ещё раз или выберите «Оплата при получении».',
  },
};

function pickLang(value) {
  return LANGS.includes(value) ? value : 'ka';
}

function msg(key, lang, vars = {}) {
  const set = MESSAGES[key] || {};
  return (set[pickLang(lang)] || set.ka || key).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Deep merge where empty strings in the translation keep the Georgian value.
function overlay(base, tr) {
  if (typeof base === 'string') return typeof tr === 'string' && tr.trim() ? tr : base;
  if (Array.isArray(base)) {
    // The Georgian list decides which items exist; translations fill them in.
    const list = Array.isArray(tr) ? tr : [];
    return base.map((item, i) => overlay(item, list[i]));
  }
  if (base && typeof base === 'object') {
    const out = { ...base };
    for (const k of Object.keys(base)) if (tr && k in tr) out[k] = overlay(base[k], tr[k]);
    return out;
  }
  return base;
}

function localizeContent(db, lang) {
  return lang === 'ka' ? db.content : overlay(db.content, db.contentI18n?.[lang] || {});
}

function localizeProduct(p, lang) {
  if (lang === 'ka') return p;
  const tr = p.i18n?.[lang] || {};
  const out = { ...p };
  for (const f of PRODUCT_FIELDS) if (typeof tr[f] === 'string' && tr[f].trim()) out[f] = tr[f];
  return out;
}

function localizeSettings(s, lang) {
  if (lang === 'ka') return s;
  const out = { ...s };
  for (const f of SETTING_FIELDS) if (s[`${f}_${lang}`]) out[f] = s[`${f}_${lang}`];
  return out;
}

module.exports = { LANGS, PRODUCT_FIELDS, SETTING_FIELDS, pickLang, msg, overlay, localizeContent, localizeProduct, localizeSettings };
