import fs from 'node:fs';
import path from 'node:path';
import { compile } from 'svelte/compiler';
import assert from 'node:assert/strict';
import { render } from 'svelte/server';
const pages = import.meta.glob('/src/routes/kb/**/+page.svx', { eager: true });
fs.mkdirSync('rendered', { recursive: true });
const css = fs.readdirSync('src/lib', {recursive:true}).filter(p=>p.endsWith('.svelte')).map(p=>{const filename=path.resolve('src/lib',p);return compile(fs.readFileSync(filename,'utf8'),{filename,generate:'client',css:'external',dev:false}).css?.code ?? '';}).join(String.fromCharCode(10));
assert.ok(css.length > 1000, 'Missing compiled component CSS');
const outputs = [];
for (const [source, page] of Object.entries(pages)) {
  const route = source.replace('/src/routes', '').replace('/+page.svx', '');
  const target = 'rendered' + route + '/index.html';
  const { body: rawBody, head } = render(page.default);
  const body = rawBody.replace(/href="(\/kb[^"#]*)(#[^"]*)?"/g, (_, href, hash = '') => 'href="' + path.posix.relative(path.posix.dirname(target), 'rendered' + href + '/index.html') + hash + '"');
  const html = '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + head + '<style>' + css + '</style></head><body>' + body + '</body></html>';
  fs.mkdirSync(target.slice(0, target.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(target, html);
  outputs.push({ source, html: target });
}
const review = fs.readFileSync('rendered/kb/incidents/4471-review/index.html', 'utf8');
const audit = JSON.parse(fs.readFileSync('rendered/audit.json', 'utf8'));
for (const text of ['379', '33', '412', 'parser', 'hint', audit.deskRef]) assert.ok(review.includes(text), 'Rendered review lacks ' + text);
assert.ok(!review.includes("this page isn't signed"));
assert.ok(review.includes('<svg'), 'Missing rendered queue chart');
for (const scope of new Set(review.match(/svelte-[a-z0-9]+/g))) assert.ok(css.includes(scope), 'Missing scoped CSS: ' + scope);
fs.writeFileSync('rendered/manifest.json', JSON.stringify({ generatedAt: new Date().toISOString(), renderer: 'mdsvex + Svelte server render, bundled with Vite', pages: outputs, verifiedDeskRef: audit.deskRef }, null, 2) + '\n');
console.log('Rendered and checked', outputs.length, 'pages; desk ref', audit.deskRef);
