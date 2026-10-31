import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFile } from '../src/parser.js';
import { fillRubric } from '../src/filler.js';
import { connect, findEditorPages, DEFAULT_BROWSER_URL } from '../src/browser.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const DEBUG_PORT = new URL(DEFAULT_BROWSER_URL).port;

// Conexión con Chrome reutilizada entre llamadas; se descarta si Chrome se cierra.
let browserPromise = null;
async function getBrowser() {
  // Comprobación rápida antes de intentar conectar con Puppeteer
  const res = await fetch(`${DEFAULT_BROWSER_URL}/json/version`, { signal: AbortSignal.timeout(1000) }).catch(() => null);
  if (!res?.ok) { browserPromise = null; return null; }
  browserPromise ??= connect().then((b) => {
    b.once('disconnected', () => { browserPromise = null; });
    return b;
  }).catch((e) => { browserPromise = null; throw e; });
  return browserPromise;
}

async function chromeStatus() {
  const browser = await getBrowser().catch(() => null);
  if (!browser) return { connected: false };
  const [page] = await findEditorPages(browser);
  return { connected: true, editor: page ? await page.title() : null };
}

// Chrome solo admite depuración remota con un perfil distinto del habitual, así que
// la aplicación usa uno propio: la sesión de Moodle iniciada en él se conserva.
function findChrome() {
  const bases = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA];
  return bases.filter(Boolean)
    .map((b) => join(b, 'Google', 'Chrome', 'Application', 'chrome.exe'))
    .find((p) => existsSync(p));
}

function launchChrome() {
  const chrome = findChrome();
  if (!chrome) throw new Error('No se encontró Google Chrome instalado.');
  const profile = join(app.getPath('userData'), 'chrome-moodle');
  spawn(chrome, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
  ], { detached: true, stdio: 'ignore' }).unref();
}

function loadRubric(path) {
  return { fileName: basename(path), rubric: parseFile(path) };
}

// Los errores se devuelven como datos para que la interfaz muestre solo el mensaje.
const handle = (channel, fn) => ipcMain.handle(channel, async (event, ...args) => {
  try { return { ok: true, value: await fn(event, ...args) }; }
  catch (e) { return { ok: false, error: e.message }; }
});

handle('chrome:status', () => chromeStatus());
handle('chrome:launch', () => launchChrome());
handle('rubric:load', (_e, path) => loadRubric(path));
handle('rubric:choose', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Selecciona la rúbrica',
    filters: [{ name: 'Rúbricas', extensions: ['md', 'csv'] }],
    properties: ['openFile'],
  });
  return canceled ? null : loadRubric(filePaths[0]);
});
handle('rubric:import', async (event, rubric) => {
  const browser = await getBrowser();
  if (!browser) throw new Error('Chrome no está conectado. Pulsa "Abrir Chrome para Moodle".');
  const [page] = await findEditorPages(browser);
  if (!page) throw new Error('No hay ninguna pestaña con el editor de rúbricas de Moodle abierto.');
  await page.bringToFront();
  await fillRubric(page, rubric, { log: (msg) => event.sender.send('import:log', msg) });
});

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 780,
    height: 760,
    minWidth: 560,
    minHeight: 560,
    title: 'Auto Rúbrica Moodle',
    autoHideMenuBar: true,
    webPreferences: { preload: join(here, 'preload.cjs') },
  });
  win.loadFile(join(here, 'index.html'));
});

// Al salir solo se desconecta: Chrome y la rúbrica rellenada siguen abiertos.
app.on('window-all-closed', async () => {
  const browser = await browserPromise?.catch(() => null);
  await browser?.disconnect().catch(() => {});
  app.quit();
});
