import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFile, parseMarkdown } from '../src/parser.js';

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
