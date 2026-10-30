#!/usr/bin/env node
import { parseArgs } from 'node:util';
import puppeteer from 'puppeteer-core';
import { parseFile } from './parser.js';
import { fillRubric } from './filler.js';

function usage() {
  console.log(`Uso: node src/cli.js <archivo.md|.csv> [--url <url_edicion_rubrica>] [--browser-url http://127.0.0.1:9222] [--dry-run]

  --dry-run     Solo valida el archivo y muestra la rúbrica interpretada.
  --browser-url Chrome abierto con --remote-debugging-port (por defecto http://127.0.0.1:9222).
  --url         Navega a esta URL antes de rellenar (opcional; si no, usa la pestaña activa).
  --help, -h    Muestra esta ayuda.`);
}

let values, positionals;
try {
  ({ values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      url: { type: 'string' },
      'browser-url': { type: 'string', default: 'http://127.0.0.1:9222' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  }));
} catch (e) {
  console.error('Error:', e.message);
  usage();
  process.exit(1);
}

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

if (values.help) { usage(); process.exit(0); }
if (positionals.length !== 1) { usage(); process.exit(1); }
const [file] = positionals;

try {
  const rubric = parseFile(file);
  if (values['dry-run']) {
    console.log(JSON.stringify(rubric, null, 2));
    process.exit(0);
  }
  const browser = await puppeteer.connect({
    browserURL: values['browser-url'],
    defaultViewport: null,
  });
  const { url } = values;
  const page = await pickPage(browser, !url);
  if (url) await page.goto(url, { waitUntil: 'networkidle2' });
  await fillRubric(page, rubric);
  await browser.disconnect();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
