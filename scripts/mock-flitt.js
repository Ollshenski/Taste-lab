'use strict';

// Local stand-in for the Flitt hosted checkout, for testing payments without
// real cards or network access. It checks request signatures, shows a page
// with "pay" / "decline" buttons, then reports the result to the shop the way
// Flitt does: a signed server callback plus a signed browser POST back.
//
//   FLITT_SECRET_KEY=test node scripts/mock-flitt.js          (listens on :4000)
//   FLITT_MERCHANT_ID=1549901 FLITT_SECRET_KEY=test PUBLIC_URL=http://localhost:3000 \
//     FLITT_API_URL=http://localhost:4000 npm start

const http = require('http');
const crypto = require('crypto');
const { sign } = require('../lib/payments');

const PORT = Number(process.env.MOCK_FLITT_PORT) || 4000;
const KEY = process.env.FLITT_SECRET_KEY || 'test';
const sessions = new Map();

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

function result(session, status) {
  const r = session.request;
  const params = {
    merchant_id: r.merchant_id,
    order_id: r.order_id,
    order_status: status,
    response_status: 'success',
    amount: r.amount,
    actual_amount: r.amount,
    currency: r.currency,
    payment_id: session.paymentId,
    masked_card: '444455XXXXXX1111',
    tran_type: 'purchase',
  };
  params.signature = sign(params, KEY);
  return params;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'POST' && url.pathname.replace(/\/$/, '') === '/api/checkout/url') {
    const { request } = JSON.parse((await readBody(req)) || '{}');
    const reply = (response) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ response }));
    };
    if (!request || sign(request, KEY) !== request.signature) {
      return reply({ response_status: 'failure', error_code: 1014, error_message: 'Invalid signature' });
    }
    const token = crypto.randomBytes(8).toString('hex');
    const paymentId = String(Math.floor(Math.random() * 1e9));
    sessions.set(token, { request, paymentId });
    return reply({ response_status: 'success', checkout_url: `http://localhost:${PORT}/pay/${token}`, payment_id: paymentId });
  }

  const m = url.pathname.match(/^\/pay\/(\w+)(\/(approved|declined))?$/);
  const session = m && sessions.get(m[1]);
  if (!session) {
    res.writeHead(404);
    return res.end('unknown payment');
  }

  if (!m[3]) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><meta charset="utf-8"><title>Mock Flitt</title>
      <body style="font-family:sans-serif;max-width:420px;margin:60px auto;text-align:center">
      <h2>Mock Flitt checkout</h2><p>${esc(session.request.order_desc)}</p>
      <p style="font-size:28px"><b>${(session.request.amount / 100).toFixed(2)} ${esc(session.request.currency)}</b></p>
      <form method="post" action="/pay/${m[1]}/approved"><button id="pay" style="font-size:18px;padding:12px 30px">Pay</button></form><br>
      <form method="post" action="/pay/${m[1]}/declined"><button id="decline">Decline</button></form></body>`);
  }

  // Report the result like Flitt: server callback first, then browser return.
  const params = result(session, m[3]);
  await fetch(session.request.server_callback_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  }).then((r) => console.log('callback', r.status, params.order_id, m[3])).catch((e) => console.error('callback failed', e.message));

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset="utf-8"><body onload="document.forms[0].submit()">
    <form method="post" action="${esc(session.request.response_url)}">
    ${Object.entries(params).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}
    </form></body>`);
}).listen(PORT, () => console.log(`Mock Flitt → http://localhost:${PORT}`));
