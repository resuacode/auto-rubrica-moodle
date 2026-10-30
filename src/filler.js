/**
 * Rellena el editor de rúbricas de Moodle (gradingform_rubric) usando Puppeteer.
 * Se asume que la página ya muestra el formulario de edición de la rúbrica.
 */
const CRITERIA = '#rubric-criteria tr.criterion';
const ADD_CRITERION = 'input[name="rubric[addcriterion]"]';

async function setValue(page, handle, value) {
  await handle.click({ clickCount: 3 });
  await page.evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, handle, String(value));
}

export async function fillRubric(page, rubric, { log = console.log } = {}) {
  await page.waitForSelector(ADD_CRITERION, { timeout: 30000 });

  if (rubric.name) {
    const nameInput = await page.$('#id_name');
    if (nameInput) await setValue(page, nameInput, rubric.name);
  }

  // Elimina criterios existentes por defecto reutilizándolos: se rellenan en orden.
  for (let ci = 0; ci < rubric.criteria.length; ci++) {
    const crit = rubric.criteria[ci];
    let rows = await page.$$(CRITERIA);
    if (rows.length <= ci) {
      await page.click(ADD_CRITERION);
      await page.waitForFunction((s, n) => document.querySelectorAll(s).length > n, {}, CRITERIA, ci);
      rows = await page.$$(CRITERIA);
    }
    const row = rows[ci];

    // Asegura el número de niveles necesario
    const levelSel = 'td.level';
    let levels = await row.$$(levelSel);
    while (levels.length < crit.levels.length) {
      const before = levels.length;
      const add = await row.$('input[name$="[addlevel]"]');
      if (!add) throw new Error('No se encontró el botón "Añadir nivel"');
      await add.click();
      await page.waitForFunction(
        (idx, s, n) => document.querySelectorAll('#rubric-criteria tr.criterion')[idx].querySelectorAll(s).length > n,
        {}, ci, levelSel, before);
      levels = await (await page.$$(CRITERIA))[ci].$$(levelSel);
    }

    const freshRow = (await page.$$(CRITERIA))[ci];
    const desc = await freshRow.$('td.description textarea');
    await setValue(page, desc, crit.description);

    levels = await freshRow.$$(levelSel);
    for (let li = 0; li < crit.levels.length; li++) {
      const def = await levels[li].$('.definition textarea');
      const score = await levels[li].$('.score input[type="text"], .score input:not([type="hidden"])');
      await setValue(page, def, crit.levels[li].definition);
      await setValue(page, score, crit.levels[li].score);
    }
    log(`Criterio ${ci + 1}/${rubric.criteria.length}: ${crit.description}`);
  }
  log('Rúbrica rellenada. Revísala y pulsa "Guardar" en Moodle.');
}
