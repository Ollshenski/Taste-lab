'use strict';

// Tiny JSON-file database. All writes go through update(), which applies a
// mutation to an in-memory copy and atomically persists it to disk.

const fs = require('fs');
const path = require('path');
const seed = require('./seed');

// On serverless hosts (Vercel) the project folder is read-only, so data lives
// in the temp dir there — fine for a demo, but it resets between cold starts.
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? path.join(require('os').tmpdir(), 'taste-lab') : path.join(__dirname, '..', 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');

let db = null;

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // Fill in any keys added to the seed after the database was created.
    const fresh = seed();
    db.content = mergeContent(fresh.content, db.content || {});
    db.settings = { ...fresh.settings, ...(db.settings || {}) };
    db.counters = { ...fresh.counters, ...(db.counters || {}) };
    db.products = db.products || [];
    db.orders = db.orders || [];
    db.subscribers = db.subscribers || [];
    db.auth = db.auth || {};
  } else {
    db = seed();
  }
  persist();
}

function persist() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function read() {
  return clone(db);
}

function update(mutator) {
  const draft = clone(db);
  const result = mutator(draft);
  db = draft;
  persist();
  return result === undefined ? undefined : clone(result);
}

// Sanitise incoming content against the shape of the default content, so the
// admin panel can only ever store known keys with string values.
function sanitizeAgainst(schema, input) {
  if (typeof schema === 'string') {
    return typeof input === 'string' ? input.slice(0, 3000) : schema;
  }
  if (typeof schema === 'number') {
    const n = Number(input);
    return Number.isFinite(n) ? n : schema;
  }
  if (Array.isArray(schema)) {
    if (!Array.isArray(input)) return clone(schema);
    const template = schema[0];
    return input.slice(0, 30).map((item) => sanitizeAgainst(template, item));
  }
  if (schema && typeof schema === 'object') {
    const out = {};
    const src = input && typeof input === 'object' ? input : {};
    for (const key of Object.keys(schema)) {
      out[key] = key in src ? sanitizeAgainst(schema[key], src[key]) : clone(schema[key]);
    }
    return out;
  }
  return schema;
}

function mergeContent(current, incoming) {
  const schema = seed().content;
  return sanitizeAgainst(schema, { ...current, ...incoming });
}

module.exports = { DATA_DIR, init, read, update, mergeContent };
