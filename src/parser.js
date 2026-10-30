import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

/**
 * Estructura devuelta: { name, criteria: [{ description, levels: [{ score, definition }] }] }
 */

function parseScore(raw, where) {
  const score = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(score)) throw new Error(`Puntuación no válida "${raw}" (${where})`);
  return score;
}

export function parseMarkdown(text) {
  const rubric = { name: '', criteria: [] };
  let current = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const l = line.trim();
    if (!l) return;
    let m;
    if ((m = /^#\s+(.*)$/.exec(l))) {
      rubric.name = m[1].replace(/^Rúbrica:\s*/i, '').trim();
    } else if ((m = /^##\s+(.*)$/.exec(l))) {
      current = { description: m[1].trim(), levels: [] };
      rubric.criteria.push(current);
    } else if ((m = /^[-*]\s*([^:]+?)\s*:\s*(.*)$/.exec(l))) {
      if (!current) throw new Error(`Nivel sin criterio (línea ${i + 1})`);
      current.levels.push({ score: parseScore(m[1], `línea ${i + 1}`), definition: m[2].trim() });
    } else {
      throw new Error(`Línea no reconocida (línea ${i + 1}): ${l}`);
    }
  });
  return rubric;
}

export function parseCsvRows(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

export function parseCsv(text) {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ''));
  const rubric = { name: '', criteria: [] };
  rows.slice(1).forEach((r, i) => {
    if (r.length < 3) throw new Error(`Fila CSV incompleta (fila ${i + 2})`);
    const name = r[0].trim();
    let c = rubric.criteria.find((x) => x.description === name);
    if (!c) { c = { description: name, levels: [] }; rubric.criteria.push(c); }
    c.levels.push({ score: parseScore(r[1], `fila ${i + 2}`), definition: r[2].trim() });
  });
  return rubric;
}

export function validate(rubric) {
  if (!rubric.criteria.length) throw new Error('La rúbrica no tiene criterios');
  for (const c of rubric.criteria) {
    if (!c.description) throw new Error('Hay un criterio sin nombre');
    if (c.levels.length < 2) throw new Error(`El criterio "${c.description}" necesita al menos 2 niveles`);
  }
  return rubric;
}

/** Interpreta el contenido de un archivo; la extensión de `name` decide el formato. */
export function parseText(text, name) {
  const ext = extname(name).toLowerCase();
  if (ext === '.md') return validate(parseMarkdown(text));
  if (ext === '.csv') return validate(parseCsv(text));
  throw new Error('Formato no soportado (usa .md o .csv)');
}

export function parseFile(path) {
  return parseText(readFileSync(path, 'utf8'), path);
}
