'use strict';

// Diagnoses order-email delivery step by step. Run on the server:
//   docker compose exec app node scripts/check-mail.js          (checks only)
//   docker compose exec app node scripts/check-mail.js --send   (also sends a test email)
// Never prints the password, only whether it is set and how long it is.

const dns = require('dns').promises;
const net = require('net');
const nodemailer = require('nodemailer');

const env = (k) => process.env[k] || '';
const HOST = env('SMTP_HOST');
const PORT = Number(env('SMTP_PORT')) || 587;
const USER = env('SMTP_USER');
const PASS = env('SMTP_PASS');
const TO = env('ORDER_NOTIFY_TO') || USER;

const ok = (m) => console.log('  ✅ ' + m);
const bad = (m) => console.log('  ❌ ' + m);
const info = (m) => console.log('  • ' + m);

function tcp(host, port) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port, timeout: 10000 });
    s.once('connect', () => { s.destroy(); resolve(null); });
    s.once('timeout', () => { s.destroy(); resolve('timeout'); });
    s.once('error', (e) => resolve(e.code || e.message));
  });
}

async function login(host) {
  const t = nodemailer.createTransport({ host, port: PORT, secure: PORT === 465, requireTLS: PORT !== 465, auth: { user: USER, pass: PASS }, connectionTimeout: 15000 });
  try {
    await t.verify();
    return { t };
  } catch (err) {
    return { err };
  }
}

function explain(err) {
  const r = `${err.code || ''} ${err.responseCode || ''} ${err.response || err.message}`;
  if (/EAUTH|535|authentication|Invalid credentials|Username and Password not accepted/i.test(r)) {
    return 'Zoho rejected the login: wrong password, or two-factor login is on and SMTP_PASS must be an App Password, or the plan has no SMTP access (Forever Free).';
  }
  if (/ETIMEDOUT|ECONNREFUSED|timeout|ENOTFOUND|EAI_AGAIN/i.test(r)) return 'The server cannot reach the mail host on this port.';
  if (/553|550|not allowed|Relaying|sender/i.test(r)) return 'Logged in, but Zoho refuses to send from this address. SMTP_USER and the sender must be the same mailbox.';
  return '';
}

(async () => {
  console.log('\n1) Settings (.env)');
  for (const [k, v] of [['SMTP_HOST', HOST], ['SMTP_PORT', String(PORT)], ['SMTP_USER', USER], ['ORDER_NOTIFY_TO', TO]]) (v ? ok : bad)(`${k} = ${v || '(empty)'}`);
  (PASS ? ok : bad)(`SMTP_PASS = ${PASS ? `set (${PASS.length} characters)` : '(empty)'}`);
  if (PASS && PASS !== PASS.trim()) bad('SMTP_PASS starts or ends with a space — remove it in .env');
  if (!HOST || !USER || !PASS) {
    bad('Fill in the empty values in .env, then: docker compose up -d --force-recreate app');
    process.exit(1);
  }
  if (PORT === 25 || PORT === 465) bad(`Port ${PORT} is blocked by Hetzner for new servers — use 587`);

  // Zoho uses a different host for mailboxes on your own domain.
  const hosts = [HOST];
  if (/^smtp\.zoho\./.test(HOST)) hosts.push(HOST.replace('smtp.', 'smtppro.'));
  else if (/^smtppro\.zoho\./.test(HOST)) hosts.push(HOST.replace('smtppro.', 'smtp.'));

  console.log('\n2) Network');
  for (const h of hosts) {
    try {
      const a = await dns.lookup(h);
      const e = await tcp(h, PORT);
      (e ? bad : ok)(`${h}:${PORT} ${e ? 'not reachable (' + e + ')' : 'reachable'} [${a.address}]`);
    } catch (e) {
      bad(`${h}: DNS lookup failed (${e.code})`);
    }
  }

  console.log('\n3) Login');
  let working = null;
  for (const h of hosts) {
    const r = await login(h);
    if (r.t) {
      ok(`${h}: login OK`);
      if (!working) working = { host: h, t: r.t };
    } else {
      bad(`${h}: ${r.err.code || ''} ${r.err.responseCode || ''} ${(r.err.response || r.err.message || '').slice(0, 160)}`);
      const why = explain(r.err);
      if (why) info(why);
    }
  }
  if (!working) process.exit(1);
  if (working.host !== HOST) info(`Use SMTP_HOST=${working.host} in .env, then: docker compose up -d --force-recreate app`);

  if (process.argv.includes('--send')) {
    console.log('\n4) Sending a test email');
    try {
      const r = await working.t.sendMail({ from: `Taste Lab <${USER}>`, to: TO, subject: 'Taste Lab — mail check', text: 'This is a test email from scripts/check-mail.js.' });
      ok(`Sent to ${TO} (${r.response})`);
    } catch (err) {
      bad(`${err.code || ''} ${err.responseCode || ''} ${err.response || err.message}`);
      const why = explain(err);
      if (why) info(why);
      process.exit(1);
    }
  } else {
    info('Add --send to also send a test email.');
  }
  console.log('');
})();
