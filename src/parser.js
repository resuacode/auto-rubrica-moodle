import { readFileSync } from 'node:fs';
import { extname, win32 } from 'node:path';

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

export function parseCsvRows(text, delimiter = ',') {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ''; }
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

// Excel en español guarda los CSV separados por «;»: se elige el separador que
// más aparece en la cabecera (fuera de comillas).
export function detectDelimiter(text) {
  const header = text.split(/\r?\n/, 1)[0].replace(/"[^"]*"/g, '');
  const count = (c) => header.split(c).length - 1;
  return count(';') > count(',') ? ';' : ',';
}

export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = parseCsvRows(text, detectDelimiter(text));
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

/**
 * Interpreta el contenido de un archivo; la extensión de `name` decide el formato.
 * Moodle exige un nombre para la rúbrica: si el archivo no lo trae, se usa el del archivo.
 */
export function parseText(text, name) {
  const ext = extname(name);
  let rubric;
  if (ext.toLowerCase() === '.md') rubric = parseMarkdown(text);
  else if (ext.toLowerCase() === '.csv') rubric = parseCsv(text);
  else throw new Error('Formato no soportado (usa .md o .csv)');
  rubric.name ||= win32.basename(name, ext); // admite rutas con / y con \
  return validate(rubric);
}

/**
 * Lee el archivo como UTF-8 y, si no lo es, como Windows-1252 (lo que usa Excel
 * en español al guardar «CSV (delimitado por comas)»), para no perder las tildes.
 */
export function readText(path) {
  const bytes = readFileSync(path);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export function parseFile(path) {
  return parseText(readText(path), path);
}
