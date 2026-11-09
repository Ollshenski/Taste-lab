'use strict';

// Single-admin password auth with HMAC-signed, httpOnly session cookies.

const crypto = require('crypto');
const store = require('./store');

const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'tastelab2026';
const COOKIE = 'tl_admin';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

function hash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function init() {
  const { auth } = store.read();
  if (!auth.hash || !auth.secret) {
    store.update((d) => {
      d.auth.secret = d.auth.secret || crypto.randomBytes(32).toString('hex');
      if (!d.auth.hash) {
        d.auth.salt = crypto.randomBytes(16).toString('hex');
        d.auth.hash = hash(DEFAULT_PASSWORD, d.auth.salt);
        d.auth.isDefault = !process.env.ADMIN_PASSWORD;
      }
    });
  }
}

function verifyPassword(password) {
  if (!password) return false;
  const { auth } = store.read();
  const a = Buffer.from(hash(password, auth.salt), 'hex');
  const b = Buffer.from(auth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function setPassword(password) {
  store.update((d) => {
    d.auth.salt = crypto.randomBytes(16).toString('hex');
    d.auth.hash = hash(password, d.auth.salt);
    d.auth.isDefault = false;
    // Rotating the secret signs out every other session.
    d.auth.secret = crypto.randomBytes(32).toString('hex');
  });
}

// Password reset links: only a SHA-256 of the token is stored, it expires after
// 30 minutes and works once. Creating a new one replaces the previous one.
const RESET_TTL = 30 * 60 * 1000;
const RESET_COOLDOWN = 5 * 60 * 1000;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Returns a new token, or null when one was issued less than 5 minutes ago.
function createResetToken() {
  const now = Date.now();
  const prev = store.read().auth.reset;
  if (prev && now - prev.issued < RESET_COOLDOWN) return null;
  const token = crypto.randomBytes(32).toString('base64url');
  store.update((d) => {
    d.auth.reset = { hash: sha256(token), issued: now, exp: now + RESET_TTL };
  });
  return token;
}

function resetTokenValid(token) {
  const r = store.read().auth.reset;
  if (typeof token !== 'string' || !r || r.exp < Date.now()) return false;
  const a = Buffer.from(sha256(token));
  const b = Buffer.from(r.hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Sets the new password if the token is valid; the token cannot be used again.
function resetPassword(token, password) {
  if (!resetTokenValid(token)) return false;
  setPassword(password);
  store.update((d) => {
    delete d.auth.reset;
  });
  return true;
}

function isDefaultPassword() {
  return Boolean(store.read().auth.isDefault);
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL })).toString('base64url');
  return payload + '.' + sign(payload, store.read().auth.secret);
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = sign(payload, store.read().auth.secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function sessionCookie(token, secure) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}${secure ? '; Secure' : ''}`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

function requireAdmin(req, res, next) {
  if (verifyToken(readCookie(req, COOKIE))) return next();
  res.status(401).json({ error: 'unauthorized' });
}

module.exports = { init, verifyPassword, setPassword, isDefaultPassword, createToken, sessionCookie, clearCookie, requireAdmin, createResetToken, resetTokenValid, resetPassword };
