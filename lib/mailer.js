'use strict';

// Order emails: a notification for the shop and a confirmation for the customer,
// sent through the shop's own mailbox over SMTP (Zoho by default).
//
// Configuration (environment variables):
//   SMTP_HOST        e.g. smtp.zoho.eu
//   SMTP_PORT        587 (STARTTLS). Hetzner blocks outgoing 25 and 465 by default.
//   SMTP_USER        the mailbox login, e.g. sandro@taste-lab.ge
//   SMTP_PASS        its password (a Zoho "app password" when 2FA is on)
//   MAIL_FROM        optional, defaults to "Taste Lab <SMTP_USER>"
//   ORDER_NOTIFY_TO  where shop notifications go, defaults to SMTP_USER

const nodemailer = require('nodemailer');

const HOST = process.env.SMTP_HOST || '';
const PORT = Number(process.env.SMTP_PORT) || 587;
const USER = process.env.SMTP_USER || '';
const PASS = process.env.SMTP_PASS || '';
const FROM = process.env.MAIL_FROM || (USER ? `Taste Lab <${USER}>` : '');
const NOTIFY_TO = process.env.ORDER_NOTIFY_TO || USER;
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

let transport = null;
function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465,
      requireTLS: PORT !== 465,
      auth: { user: USER, pass: PASS },
      connectionTimeout: 15000,
      // Local test server only; never set this in production.
      tls: process.env.SMTP_INSECURE_TLS === '1' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return transport;
}

function configured() {
  return Boolean(HOST && USER && PASS);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n, cur = '₾') => `${(Math.round((Number(n) || 0) * 100) / 100).toFixed(2)} ${cur}`;

const T = {
  ka: {
    subject: (n) => `შეკვეთა ${n} მიღებულია — Taste Lab`,
    hello: (name) => `გამარჯობა, ${name}!`,
    intro: 'მადლობა შეკვეთისთვის. ჩვენი გუნდი მალე დაგიკავშირდებათ ტელეფონით მიწოდების დასაზუსტებლად.',
    order: 'შეკვეთა', product: 'პროდუქტი', qty: 'რაოდ.', sum: 'ჯამი', subtotal: 'პროდუქტები', delivery: 'მიწოდება', free: 'უფასო', total: 'სულ',
    address: 'მიწოდების მისამართი', payment: 'გადახდა', card: 'ბარათით ონლაინ — გადახდილია', cash: 'მიწოდებისას',
    questions: 'კითხვები? უბრალოდ უპასუხეთ ამ წერილს ან დაგვირეკეთ:', thanks: 'გმადლობთ, Taste Lab',
  },
  en: {
    subject: (n) => `Order ${n} confirmed — Taste Lab`,
    hello: (name) => `Hello, ${name}!`,
    intro: 'Thank you for your order. Our team will call you shortly to arrange delivery.',
    order: 'Order', product: 'Product', qty: 'Qty', sum: 'Amount', subtotal: 'Products', delivery: 'Delivery', free: 'Free', total: 'Total',
    address: 'Delivery address', payment: 'Payment', card: 'Card online — paid', cash: 'On delivery',
    questions: 'Questions? Just reply to this email or call us:', thanks: 'Thank you, Taste Lab',
  },
  ru: {
    subject: (n) => `Заказ ${n} принят — Taste Lab`,
    hello: (name) => `Здравствуйте, ${name}!`,
    intro: 'Спасибо за заказ. Наша команда скоро позвонит вам, чтобы согласовать доставку.',
    order: 'Заказ', product: 'Товар', qty: 'Кол-во', sum: 'Сумма', subtotal: 'Товары', delivery: 'Доставка', free: 'Бесплатно', total: 'Итого',
    address: 'Адрес доставки', payment: 'Оплата', card: 'Картой онлайн — оплачено', cash: 'При получении',
    questions: 'Вопросы? Просто ответьте на это письмо или позвоните нам:', thanks: 'Спасибо, Taste Lab',
  },
};

// Cities are stored in Georgian (see checkout.js); translate them for the customer.
const KA_CITIES = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'გორი', 'ზუგდიდი', 'თელავი', 'სხვა'];
const CITIES = {
  en: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori', 'Zugdidi', 'Telavi', 'Other'],
  ru: ['Тбилиси', 'Батуми', 'Кутаиси', 'Рустави', 'Гори', 'Зугдиди', 'Телави', 'Другой'],
};
const cityName = (city, lang) => (CITIES[lang] || [])[KA_CITIES.indexOf(city)] || city;

// Product names in the order are stored in Georgian; show the customer their language.
function itemName(item, products, lang) {
  if (lang === 'ka' || item.type !== 'product') return item.name;
  const p = products.find((x) => x.id === item.id);
  return (p && p.i18n && p.i18n[lang] && p.i18n[lang].name) || item.name;
}

function itemsTable(order, t, products, lang, cur) {
  const row = (cells, bold) => `<tr>${cells.map((c, i) => `<td style="padding:8px 6px;border-bottom:1px solid #eee;${i ? 'text-align:right;white-space:nowrap;' : ''}${bold ? 'font-weight:700;' : ''}">${c}</td>`).join('')}</tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr style="color:#7A6F64;font-size:12px"><td style="padding:6px">${t.product}</td><td style="padding:6px;text-align:right">${t.qty}</td><td style="padding:6px;text-align:right">${t.sum}</td></tr>
    ${order.items.map((i) => row([esc(itemName(i, products, lang)), `${i.qty} × ${money(i.price, cur)}`, money(i.qty * i.price, cur)])).join('')}
    ${row([t.subtotal, '', money(order.subtotal, cur)])}
    ${row([t.delivery, '', order.delivery ? money(order.delivery, cur) : t.free])}
    ${row([t.total, '', money(order.total, cur)], true)}
  </table>`;
}

function layout(inner) {
  return `<!doctype html><html><body style="margin:0;background:#FDF3E8;font-family:Arial,Helvetica,sans-serif;color:#151515">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px">
      <div style="font-size:24px;font-weight:800;margin-bottom:16px"><span style="color:#F58220">Taste</span> Lab</div>
      <div style="background:#fff;border:2px solid #151515;border-radius:16px;padding:24px">${inner}</div>
    </div></body></html>`;
}

function customerEmail(order, settings, products) {
  const lang = T[order.lang] ? order.lang : 'ka';
  const t = T[lang];
  const cur = settings.currency || '₾';
  const c = order.customer;
  const html = layout(`
    <h2 style="margin:0 0 8px">${esc(t.hello(c.name))}</h2>
    <p style="margin:0 0 18px;line-height:1.5">${t.intro}</p>
    <p style="margin:0 0 12px"><b>${t.order}:</b> <span style="background:#F58220;border-radius:6px;padding:2px 8px;font-family:monospace">${esc(order.number)}</span></p>
    ${itemsTable(order, t, products, lang, cur)}
    <p style="margin:18px 0 4px"><b>${t.address}:</b> ${esc(cityName(c.city, lang))}, ${esc(c.address)}</p>
    <p style="margin:0 0 18px"><b>${t.payment}:</b> ${order.paymentMethod === 'card' ? t.card : t.cash}</p>
    <p style="margin:0;color:#3A3530;line-height:1.5">${t.questions} ${esc(settings.phone || '')}<br>${t.thanks}${PUBLIC_URL ? ` · <a href="${esc(PUBLIC_URL)}" style="color:#F58220">${esc(PUBLIC_URL.replace(/^https?:\/\//, ''))}</a>` : ''}</p>`);
  return { subject: t.subject(order.number), html };
}

function adminEmail(order, settings) {
  const t = T.ka;
  const cur = settings.currency || '₾';
  const c = order.customer;
  const pay = order.paymentMethod === 'card' ? `ბარათით — გადახდილი${order.paymentId ? ` (Flitt ID ${esc(order.paymentId)})` : ''}` : 'მიწოდებისას (ნაღდი/ბარათი კურიერთან)';
  const line = (k, v) => (v ? `<tr><td style="padding:4px 12px 4px 0;color:#7A6F64;white-space:nowrap">${k}</td><td style="padding:4px 0">${v}</td></tr>` : '');
  const html = layout(`
    <h2 style="margin:0 0 4px">🛒 ახალი შეკვეთა ${esc(order.number)}</h2>
    <p style="margin:0 0 16px;color:#7A6F64">${money(order.total, cur)} · ${pay}</p>
    <table style="font-size:14px;margin-bottom:16px">
      ${line('სახელი', esc(c.name))}
      ${line('ტელეფონი', `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`)}
      ${line('ელ-ფოსტა', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '')}
      ${line('მისამართი', `${esc(c.city)}, ${esc(c.address)}`)}
      ${line('კომენტარი', esc(c.note))}
      ${line('ენა', esc(order.lang || 'ka'))}
    </table>
    ${itemsTable(order, t, [], 'ka', cur)}
    ${PUBLIC_URL ? `<p style="margin:18px 0 0"><a href="${esc(PUBLIC_URL)}/admin#orders" style="display:inline-block;background:#F58220;color:#151515;font-weight:700;text-decoration:none;border:2px solid #151515;border-radius:999px;padding:10px 18px">ადმინ პანელში გახსნა →</a></p>` : ''}`);
  return { subject: `🛒 ახალი შეკვეთა ${order.number} — ${money(order.total, cur)}`, html };
}

// Sends both emails. Never throws: problems are logged and reported in the result.
async function sendOrderEmails(order, settings, products) {
  if (!configured()) return { skipped: 'not configured' };
  const result = {};
  const mail = getTransport();
  try {
    const a = adminEmail(order, settings);
    await mail.sendMail({ from: FROM, to: NOTIFY_TO, replyTo: order.customer.email || undefined, subject: a.subject, html: a.html });
    result.admin = 'sent';
  } catch (err) {
    console.error('order email to shop failed', order.number, err.message);
    result.admin = 'failed: ' + err.message;
  }
  if (order.customer.email) {
    try {
      const c = customerEmail(order, settings, products);
      await mail.sendMail({ from: FROM, to: order.customer.email, replyTo: NOTIFY_TO, subject: c.subject, html: c.html });
      result.customer = 'sent';
    } catch (err) {
      console.error('order email to customer failed', order.number, err.message);
      result.customer = 'failed: ' + err.message;
    }
  }
  return result;
}

async function sendTest() {
  if (!configured()) throw new Error('ელფოსტა არ არის კონფიგურირებული: სერვერზე საჭიროა SMTP_HOST, SMTP_USER, SMTP_PASS.');
  await getTransport().sendMail({
    from: FROM,
    to: NOTIFY_TO,
    subject: '✅ Taste Lab — სატესტო წერილი',
    html: layout('<h2 style="margin:0 0 8px">ელფოსტა მუშაობს ✅</h2><p style="margin:0">შეკვეთების შეტყობინებები ამ მისამართზე მოვა.</p>'),
  });
  return { to: NOTIFY_TO };
}

async function sendPasswordReset(link) {
  await getTransport().sendMail({
    from: FROM,
    to: NOTIFY_TO,
    subject: '🔑 Taste Lab — ადმინის პაროლის აღდგენა',
    html: layout(`
      <h2 style="margin:0 0 8px">პაროლის აღდგენა</h2>
      <p style="margin:0 0 18px;line-height:1.5">ვიღაცამ (იმედია, თქვენ) მოითხოვა ადმინ პანელის პაროლის აღდგენა. ახალი პაროლის დასაყენებლად დააჭირეთ ღილაკს. ბმული მოქმედებს <b>30 წუთი</b> და მხოლოდ ერთხელ.</p>
      <p style="margin:0 0 18px"><a href="${esc(link)}" style="display:inline-block;background:#F58220;color:#151515;font-weight:700;text-decoration:none;border:2px solid #151515;border-radius:999px;padding:12px 22px">ახალი პაროლის დაყენება →</a></p>
      <p style="margin:0;color:#7A6F64;font-size:13px;line-height:1.5">თუ ეს თქვენ არ მოგითხოვიათ, უბრალოდ წაშალეთ ეს წერილი — პაროლი არ შეიცვლება.</p>`),
    text: `ადმინის პაროლის აღდგენა (მოქმედებს 30 წუთი): ${link}`,
  });
}

module.exports = { configured, sendOrderEmails, sendTest, sendPasswordReset, notifyTo: () => NOTIFY_TO };
