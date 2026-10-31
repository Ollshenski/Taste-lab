'use strict';

// Flitt payment adapter (hosted checkout page).
//
// Configuration (environment variables):
//   FLITT_MERCHANT_ID   merchant id from the Flitt merchant portal
//   FLITT_SECRET_KEY    payment key ("secret key") from the same place
//   PUBLIC_URL          public https address of the shop, e.g. https://taste-lab.ge
//   FLITT_API_URL       optional, defaults to https://pay.flitt.com (used by the local mock)
//
// Flow: createPayment() asks Flitt for a checkout_url and the customer is sent
// there. Flitt then reports the result twice: server-to-server to
// /api/payments/callback, and by sending the customer's browser back to
// /payment/return. Both carry a signature that verify() checks. As a safety net
// the server also polls fetchStatus() for card orders still waiting on a result.

const crypto = require('crypto');

const API_URL = (process.env.FLITT_API_URL || 'https://pay.flitt.com').replace(/\/+$/, '');
const MERCHANT_ID = process.env.FLITT_MERCHANT_ID || '';
const SECRET_KEY = process.env.FLITT_SECRET_KEY || '';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

function configured() {
  return Boolean(MERCHANT_ID && SECRET_KEY && PUBLIC_URL);
}

function methods(settings) {
  return [
    { id: 'card', label: 'ბარათით ონლაინ', enabled: Boolean(settings.onlinePayments) && configured() },
    { id: 'cash', label: 'გადახდა მიტანისას', enabled: settings.cashOnDelivery !== false },
  ];
}

// Flitt signature: SHA1 of the secret key and every non-empty parameter value,
// ordered by parameter name and joined with "|".
function sign(params, key = SECRET_KEY) {
  const values = Object.keys(params)
    .filter((k) => k !== 'signature' && k !== 'response_signature_string')
    .filter((k) => params[k] !== '' && params[k] !== null && params[k] !== undefined)
    .sort()
    .map((k) => String(params[k]));
  return crypto.createHash('sha1').update([key, ...values].join('|'), 'utf8').digest('hex');
}

function verify(params) {
  if (!params || typeof params.signature !== 'string' || !SECRET_KEY) return false;
  if (String(params.merchant_id) !== String(MERCHANT_ID)) return false;
  const expected = Buffer.from(sign(params));
  const given = Buffer.from(params.signature.toLowerCase());
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// Flitt needs an order_id that is unique per payment attempt.
function paymentRef(order) {
  return `${order.number}_${Date.now().toString(36)}`;
}

async function createPayment(order) {
  if (order.paymentMethod !== 'card') return null;
  if (!configured()) throw new Error('Flitt is not configured');

  const request = {
    merchant_id: Number(MERCHANT_ID),
    order_id: order.paymentRef,
    order_desc: `Taste Lab — შეკვეთა ${order.number}`,
    amount: Math.round(order.total * 100), // tetri
    currency: 'GEL',
    server_callback_url: `${PUBLIC_URL}/api/payments/callback`,
    response_url: `${PUBLIC_URL}/payment/return`,
    lang: 'ka',
    // Unpaid orders expire after an hour, so their stock is released sooner.
    lifetime: 3600,
  };
  if (order.customer.email) request.sender_email = order.customer.email;
  request.signature = sign(request);

  const res = await fetch(`${API_URL}/api/checkout/url/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => ({}))).response || {};
  if (data.response_status !== 'success' || !data.checkout_url) {
    throw new Error(`Flitt error ${data.error_code || res.status}: ${data.error_message || 'no checkout_url'}`);
  }
  return { redirectUrl: data.checkout_url, paymentId: data.payment_id };
}

// Asks Flitt for the current state of a payment attempt (same fields as a callback).
async function fetchStatus(ref) {
  if (!configured()) throw new Error('Flitt is not configured');
  const request = { order_id: ref, merchant_id: Number(MERCHANT_ID), version: '1.0.1' };
  request.signature = sign(request);
  const res = await fetch(`${API_URL}/api/status/order_id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => ({}))).response || {};
  if (data.response_status !== 'success') {
    throw new Error(`Flitt status error ${data.error_code || res.status}: ${data.error_message || ''}`);
  }
  return parseResult(data);
}

// Normalises a Flitt result (callback or browser return) into
// { ref, status: 'paid'|'failed'|'pending'|'refunded', raw }, or null if the signature is wrong.
function parseResult(params) {
  // Callbacks are flat JSON; some integrations wrap them in { response: {...} }.
  if (params && params.response && typeof params.response === 'object') params = params.response;
  if (!verify(params)) return null;
  const s = String(params.order_status || '');
  const status = s === 'approved' ? 'paid'
    : ['declined', 'expired'].includes(s) ? 'failed'
    : s === 'reversed' ? 'refunded'
    : 'pending';
  return {
    ref: String(params.order_id || ''),
    status,
    amount: Number(params.amount) || 0,
    paymentId: params.payment_id ? String(params.payment_id) : '',
    flittStatus: s,
  };
}

module.exports = { configured, methods, sign, verify, paymentRef, createPayment, fetchStatus, parseResult };
