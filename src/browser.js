import puppeteer from 'puppeteer-core';

export const DEFAULT_BROWSER_URL = 'http://127.0.0.1:9222';

/** Se conecta a un Chrome abierto con --remote-debugging-port. */
export function connect(browserURL = DEFAULT_BROWSER_URL) {
  return puppeteer.connect({ browserURL, defaultViewport: null });
}

// Una pestaña que no responde (cargando, colgada…) se trata como no candidata.
const PAGE_TIMEOUT = 2000;

async function describePages(browser) {
  const pages = await browser.pages();
  const info = await Promise.all(pages.map((p) => Promise.race([
    p.evaluate(() => ({
      editor: !!document.querySelector('#rubric-criteria'),
      visible: document.visibilityState === 'visible',
    })),
    new Promise((_, reject) => setTimeout(reject, PAGE_TIMEOUT)),
  ]).catch(() => ({ editor: false, visible: false }))));
  return { pages, info };
}

/** Pestañas que muestran el editor de rúbricas, primero la visible (pestaña activa). */
export async function findEditorPages(browser) {
  const { pages, info } = await describePages(browser);
  return pages
    .map((page, i) => ({ page, ...info[i] }))
    .filter((p) => p.editor)
    .sort((a, b) => b.visible - a.visible)
    .map((p) => p.page);
}

// Elige la pestaña sobre la que trabajar: prioriza la que ya muestra el editor de
// rúbricas y, entre varias candidatas, la que está visible (pestaña activa).
export async function pickPage(browser, needsEditor) {
  if (needsEditor) {
    const [editor] = await findEditorPages(browser);
    if (editor) return editor;
  }
  const { pages, info } = await describePages(browser);
  const page = pages.find((_, i) => info[i].visible) ?? pages[0];
  return page ?? browser.newPage();
}
