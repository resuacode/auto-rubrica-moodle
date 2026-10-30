#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { parseFile } from './parser.js';
import { fillRubric } from './filler.js';

function usage() {
  console.log(`Uso: node src/cli.js <archivo.md|.csv> [--url <url_edicion_rubrica>] [--browser-url http://127.0.0.1:9222] [--dry-run]

  --dry-run     Solo valida el archivo y muestra la rúbrica interpretada.
  --browser-url Chrome abierto con --remote-debugging-port (por defecto http://127.0.0.1:9222).
  --url         Navega a esta URL antes de rellenar (opcional; si no, usa la pestaña activa).`);
}

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const file = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--dry-run'));

// Elige la pestaña sobre la que trabajar: prioriza la que ya muestra el editor de
// rúbricas y, entre varias candidatas, la que está visible (pestaña activa).
async function pickPage(browser, needsEditor) {
  const pages = await browser.pages();
  const info = await Promise.all(pages.map((p) => p.evaluate(() => ({
    editor: !!document.querySelector('#rubric-criteria'),
    visible: document.visibilityState === 'visible',
  })).catch(() => ({ editor: false, visible: false }))));
  const pick = (idx) => idx.find((i) => info[i].visible) ?? idx[0];
  const all = pages.map((_, i) => i);
  const withEditor = all.filter((i) => info[i].editor);
  if (needsEditor && withEditor.length) return pages[pick(withEditor)];
  const i = pick(all);
  return i === undefined ? browser.newPage() : pages[i];
}

if (!file || args.includes('--help')) { usage(); process.exit(file ? 0 : 1); }

try {
  const rubric = parseFile(file);
  if (args.includes('--dry-run')) {
    console.log(JSON.stringify(rubric, null, 2));
    process.exit(0);
  }
  const browser = await puppeteer.connect({
    browserURL: opt('--browser-url', 'http://127.0.0.1:9222'),
    defaultViewport: null,
  });
  const url = opt('--url');
  const page = await pickPage(browser, !url);
  if (url) await page.goto(url, { waitUntil: 'networkidle2' });
  await fillRubric(page, rubric);
  await browser.disconnect();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
