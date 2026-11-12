// Builds the website from content/*.json and templates/*.html into dist/.
// Cloudflare runs this automatically ("node build.js") each time you save a change on GitHub.
const fs = require('fs');
const path = require('path');

const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const HL = '<span style="background: linear-gradient(transparent 64%, #FFD98A 64%)">';
const hl = (v) => esc(v).replace(/\*([^*]+)\*/g, HL + '$1</span>');

const ICONS = {
  heart: '<path d="M16 27C6 20 4 14 4 11a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 3-2 9-12 16z"></path>',
  book: '<path d="M4 8c4-2 8-2 12 1 4-3 8-3 12-1v17c-4-2-8-2-12 1-4-3-8-3-12-1z"></path><path d="M16 9v17"></path>',
  star: '<path d="M16 4l3.6 7.6 8.4 1-6.2 5.7 1.7 8.3L16 22.4 8.5 26.6l1.7-8.3L4 12.6l8.4-1z"></path>',
  home: '<path d="M6 26V12l10-8 10 8v14z"></path><path d="M13 26v-8h6v8"></path>',
};
const svg = (name) => '<svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true" style="display: block" fill="none" stroke="#4A2545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.heart) + '</svg>';
const COLORS = { pink: '#FFE3EC', butter: '#FFF1C9', mint: '#D9F0E8', white: '#FFFFFF', lavender: '#F1EAFE' };
const INVOLVED_BG = ['#FFEEF4', '#F1EAFE', '#E2F5EE'];

function lookup(ctx, p) {
  let v;
  const parts = p.split('.');
  for (let i = ctx.length - 1; i >= 0 && v === undefined; i--) {
    let cur = ctx[i];
    for (const k of parts) { cur = cur == null ? undefined : cur[k]; }
    v = cur;
  }
  return v;
}

function render(tpl, ctx) {
  // loops
  tpl = tpl.replace(/\{\{#each ([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (m, p, body) => {
    const list = lookup(ctx, p);
    if (!Array.isArray(list)) return '';
    return list.map((item, i) => render(body, ctx.concat([Object.assign({}, item, { '@n': i + 1 })]))).join('');
  });
  // raw values
  tpl = tpl.replace(/\{\{\{([\w.@]+)\}\}\}/g, (m, p) => String(lookup(ctx, p) ?? ''));
  // filtered / plain values
  tpl = tpl.replace(/\{\{([\w.@]+)(\|hl)?\}\}/g, (m, p, f) => (f ? hl(lookup(ctx, p)) : esc(lookup(ctx, p))));
  return tpl;
}

function loadJSON(f) {
  try { return JSON.parse(read(f)); }
  catch (e) { throw new Error('Problem in ' + f + ': ' + e.message); }
}

const site = loadJSON('content/site.json');
const home = loadJSON('content/home.json');
const letters = loadJSON('content/letters.json');

(home.focus_cards || []).forEach((c) => { c._bg = COLORS[c.color] || '#FFFFFF'; c._icon = svg(c.icon); });
(home.involved_cards || []).forEach((c, i) => {
  c._bg = INVOLVED_BG[i % INVOLVED_BG.length];
  c._btn = i % 3 === 0 ? 'background: #CDB9F5; color: #4A2545' : 'border: 2px solid #4A2545; color: #4A2545';
  c._target = /^https?:/.test(c.button_link || '') ? ' target="_blank" rel="noopener noreferrer"' : '';
});
(letters.photos || []).forEach((c, i) => { c._flex = i === 0 ? '1 1 620px' : '0 1 420px'; });

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(__dirname, 'public'), out, { recursive: true });

const pages = [
  ['templates/index.html', 'index.html', home],
  ['templates/letters-of-love.html', 'letters-of-love.html', letters],
];
for (const [tplFile, outFile, page] of pages) {
  fs.writeFileSync(path.join(out, outFile), render(read(tplFile), [{ site, p: page }]));
}
// old address /cares.html now goes to the Letters of Love page
fs.writeFileSync(path.join(out, 'cares.html'), read('templates/redirect.html'));
console.log('Built', pages.length, 'pages into dist/');
