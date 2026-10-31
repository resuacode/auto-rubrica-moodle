import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsv, parseFile, parseMarkdown, parseText } from '../src/parser.js';

test('md y csv de ejemplo se interpretan', () => {
  const md = parseFile('ejemplos/rubrica.md');
  assert.equal(md.name, 'Trabajo final');
  assert.equal(md.criteria.length, 2);
  assert.equal(md.criteria[1].levels[3].score, 10);
  const csv = parseFile('ejemplos/rubrica.csv');
  assert.equal(csv.criteria[0].levels[0].definition, 'Confusa, no se entiende el mensaje');
});

test('nivel sin criterio falla', () => {
  assert.throws(() => parseMarkdown('- 1: x'));
});

test('sin nombre se usa el del archivo', () => {
  assert.equal(parseFile('ejemplos/rubrica.csv').name, 'rubrica');
  assert.equal(parseText('## C\n- 0: a\n- 1: b', 'C:\\Rúbricas\\Proyecto 2.md').name, 'Proyecto 2');
});

test('CSV separado por punto y coma (Excel en español)', () => {
  const r = parseCsv('criterio;puntos;descripcion\r\nClaridad;0;"Confusa; sin orden"\r\nClaridad;2,5;Clara, ordenada\r\n');
  assert.deepEqual(r.criteria[0].levels, [
    { score: 0, definition: 'Confusa; sin orden' },
    { score: 2.5, definition: 'Clara, ordenada' },
  ]);
});

test('CSV en Windows-1252 conserva las tildes', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'rubrica-')), 'Exposición.csv');
  writeFileSync(path, Buffer.from('criterio;puntos;descripcion\nExposición;0;Muy pobre\nExposición;1;Sí\n', 'latin1'));
  const r = parseFile(path);
  assert.equal(r.name, 'Exposición');
  assert.equal(r.criteria[0].description, 'Exposición');
  assert.equal(r.criteria[0].levels[1].definition, 'Sí');
});
