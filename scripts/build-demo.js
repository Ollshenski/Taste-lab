'use strict';

// Builds a server-free demo of the shop into a folder (default: demo-dist/).
// Every page is self-contained: CSS, JS and images are inlined, and the API is
// replaced by demo/demo-api.js, which keeps data in the visitor's browser.
//
//   node scripts/build-demo.js [outDir]

const fs = require('fs');
const path = require('path');
const seed = require('../lib/seed');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'demo-dist'));

const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const read = (rel) => fs.readFileSync(path.join(PUB, rel), 'utf8');
const dataUri = (rel) => `data:${MIME[path.extname(rel)]};base64,${fs.readFileSync(path.join(PUB, rel)).toString('base64')}`;

const db = seed();
delete db.auth;
const demoApi = fs.readFileSync(path.join(ROOT, 'demo', 'demo-api.js'), 'utf8').replace('__SEED__', JSON.stringify(db));

function build(rel, { home, embedded }) {
  let html = read(rel);
  html = html
    .replace(/<link rel="stylesheet" href="\/([^"]+\.css)">/g, (_, f) => `<style>\n${read(f)}\n</style>`)
    .replace(/<script src="\/js\/illustrations\.js"><\/script>/, () => `<script>\n${demoApi}\n</script>\n<script src="/js/illustrations.js"></script>`)
    .replace(/<script src="\/([^"]+\.js)"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/g, '<\\/script')}\n</script>`)
    .replace(/(src|href)="\/(assets\/[^"]+)"/g, (_, a, f) => `${a}="${dataUri(f)}"`)
    .replace(/href="\/checkout"/g, 'href="checkout.html"')
    .replace(/href="\/admin"/g, `href="${home.replace('index.html', '')}admin/index.html"`)
    .replace(/href="\/(#[^"]*)?"/g, (_, h) => `href="${home}${h || ''}"`)
    .replace(/<link rel="(preconnect|apple-touch-icon)"[^>]*>\n?/g, '')
    .replace(/<meta property="og:image"[^>]*>\n?/g, '');
  if (embedded) {
    // The host wraps the main page in its own document skeleton.
    html = html.replace(/<!doctype html>\n?|<\/?html[^>]*>\n?|<\/?head>\n?|<\/?body>\n?|<meta (charset|name="viewport")[^>]*>\n?/gi, '');
  }
  return html;
}

// JS template strings with absolute links (checkout.js) are inlined above; patch them too.
function patchJs(html, home) {
  return html.replace(/href="\/(#[^"]*)?"/g, (_, h) => `href="${home}${h || ''}"`);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'admin'), { recursive: true });

let index = build('index.html', { home: 'index.html', embedded: true });
index = index.replace(
  '<span>Made with 🧪 in Georgia</span>',
  '<span>Made with 🧪 in Georgia · <a href="admin/index.html" style="display:inline;color:var(--orange)">ადმინ პანელი (დემო)</a></span>'
);
fs.writeFileSync(path.join(OUT, 'index.html'), index);
fs.writeFileSync(path.join(OUT, 'checkout.html'), patchJs(build('checkout.html', { home: 'index.html' }), 'index.html'));
fs.writeFileSync(path.join(OUT, 'admin', 'index.html'), patchJs(build('admin/index.html', { home: '../index.html' }), '../index.html'));

for (const f of ['index.html', 'checkout.html', 'admin/index.html']) {
  const html = fs.readFileSync(path.join(OUT, f), 'utf8');
  const leftovers = html.match(/(src|href)="\/(?!\/)[^"]*"/g);
  console.log(f.padEnd(18), (html.length / 1024).toFixed(0) + ' KB', leftovers ? 'absolute links left: ' + leftovers.join(' ') : '');
}
