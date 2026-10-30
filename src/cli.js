#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { parseFile } from './parser.js';
import { fillRubric } from './filler.js';
import { connect, pickPage } from './browser.js';

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

if (values.help) { usage(); process.exit(0); }
if (positionals.length !== 1) { usage(); process.exit(1); }
const [file] = positionals;

try {
  const rubric = parseFile(file);
  if (values['dry-run']) {
    console.log(JSON.stringify(rubric, null, 2));
    process.exit(0);
  }
  const browser = await connect(values['browser-url']);
  const { url } = values;
  const page = await pickPage(browser, !url);
  if (url) await page.goto(url, { waitUntil: 'networkidle2' });
  await fillRubric(page, rubric);
  await browser.disconnect();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
