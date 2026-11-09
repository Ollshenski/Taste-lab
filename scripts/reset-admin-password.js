'use strict';

// Sets a new admin password and signs out every admin session.
// Stop the site first, otherwise the running server overwrites the change:
//   docker compose stop app
//   docker compose run --rm app node scripts/reset-admin-password.js
//   docker compose start app
// The new password is asked for interactively, so it never ends up in shell history.

const readline = require('readline');
const store = require('../lib/store');
const auth = require('../lib/auth');

// One reader for both questions; typed characters are shown as "*" on a terminal.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let prompt = '';
rl._writeToOutput = (s) => rl.output.write(s.startsWith(prompt) || s === '\r\n' || s === '\n' ? s : '*'.repeat(s.length));
const lines = rl[Symbol.asyncIterator]();

async function ask(question) {
  prompt = question;
  process.stdout.write(question);
  const { value } = await lines.next();
  if (!process.stdin.isTTY) process.stdout.write('\n');
  return value || '';
}

(async () => {
  store.init();
  auth.init();
  const first = await ask('New admin password (at least 8 characters): ');
  if (first.length < 8) {
    console.error('Too short — nothing changed.');
    process.exit(1);
  }
  const second = await ask('Repeat the password: ');
  if (first !== second) {
    console.error('The passwords do not match — nothing changed.');
    process.exit(1);
  }
  auth.setPassword(first);
  rl.close();
  console.log('✅ Admin password changed. Start the site again: docker compose start app');
})();
