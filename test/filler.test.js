import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { parseFile } from '../src/parser.js';
import { fillRubric } from '../src/filler.js';

// Busca un Chrome/Chromium local: CHROME_PATH, rutas habituales o la caché de Puppeteer.
function findChrome() {
  const cache = join(homedir(), '.cache/puppeteer/chrome');
  const cached = existsSync(cache)
    ? readdirSync(cache).map((v) => join(cache, v, 'chrome-linux64/chrome'))
    : [];
  return [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', ...cached]
    .find((p) => p && existsSync(p));
}

const chrome = findChrome();
const fixture = readFileSync(new URL('./fixtures/editor-rubrica.html', import.meta.url), 'utf8');

// Devuelve lo que Moodle recibiría al enviar el formulario, agrupado por criterio.
const readForm = (page) => page.evaluate(() => {
  const criteria = [...document.querySelectorAll('#rubric-criteria tr.criterion')].map((tr) => ({
    description: tr.querySelector('td.description textarea').value,
    shown: tr.querySelector('td.description .plainvalue').textContent,
    levels: [...tr.querySelectorAll('td.level')].map((td) => ({
      score: td.querySelector('.score input').value,
      definition: td.querySelector('.definition textarea').value,
    })),
  }));
  return { name: document.querySelector('#id_name').value, criteria };
});

test('rellenado del editor de rúbricas', { skip: !chrome && 'no se encontró Chrome (define CHROME_PATH)' }, async (t) => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const log = () => {};
  // Una página nueva por caso: el script de la página de prueba no admite recargarse en la misma.
  const open = async () => { const page = await browser.newPage(); await page.setContent(fixture); return page; };

  await t.test('añade niveles y criterios que faltan', async () => {
    const page = await open();
    const rubric = parseFile('ejemplos/rubrica.md');
    rubric.criteria.push({ description: 'Extra', levels: [{ score: 0, definition: 'No' }, { score: 1, definition: 'Sí' }] });
    await fillRubric(page, rubric, { log });
    const form = await readForm(page);
    assert.equal(form.name, 'Trabajo final');
    assert.deepEqual(form.criteria.map((c) => c.levels.length), [3, 4, 2]);
    assert.equal(form.criteria[1].description, 'Uso de fuentes');
    assert.equal(form.criteria[1].shown, 'Uso de fuentes');
    assert.deepEqual(form.criteria[1].levels[3], { score: '10', definition: 'Cita fuentes de calidad con formato correcto' });
  });

  await t.test('elimina niveles y criterios sobrantes', async () => {
    const page = await open();
    const rubric = parseFile('ejemplos/rubrica.csv');
    rubric.criteria.pop();
    rubric.criteria[0].levels.pop();
    await fillRubric(page, rubric, { log });
    const form = await readForm(page);
    assert.equal(form.criteria.length, 1);
    assert.deepEqual(form.criteria[0].levels, [
      { score: '0', definition: 'Confusa, no se entiende el mensaje' },
      { score: '5', definition: 'Comprensible con algunas lagunas' },
    ]);
  });
});
