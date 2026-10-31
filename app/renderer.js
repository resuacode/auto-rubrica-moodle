const $ = (id) => document.getElementById(id);
const state = { rubric: null, chrome: { connected: false, editor: null }, busy: false };

function render() {
  const { connected, editor } = state.chrome;
  const status = $('status');
  status.className = `status ${editor ? 'ok' : connected ? 'warn' : 'off'}`;
  status.textContent = editor ? `Editor detectado: ${editor}`
    : connected ? 'Chrome conectado, pero no hay ninguna pestaña con el editor de rúbricas'
    : 'Chrome no conectado';
  $('launch').hidden = connected;

  $('import').disabled = state.busy || !state.rubric?.name || !editor;
  $('import-hint').textContent = state.busy ? 'Importando…'
    : !state.rubric ? 'Carga primero una rúbrica.'
    : !state.rubric.name ? 'Escribe un nombre para la rúbrica.'
    : !editor ? 'Abre el editor de rúbricas en Chrome.'
    : '';
}

async function refreshStatus() {
  if (state.busy) return;
  const res = await window.api.chromeStatus();
  state.chrome = res.ok ? res.value : { connected: false };
  render();
}

function showRubric({ fileName, rubric }) {
  state.rubric = rubric;
  $('file-error').hidden = true;
  const preview = $('preview');
  preview.replaceChildren();
  const max = rubric.criteria.reduce((sum, c) => sum + Math.max(...c.levels.map((l) => l.score)), 0);

  const head = document.createElement('div');
  head.className = 'summary';
  head.innerHTML = '<label for="rubric-name">Nombre de la rúbrica</label>'
    + '<input id="rubric-name" type="text" required><span class="muted"></span>';
  // Moodle exige un nombre; el parser ya pone el del archivo si no viene en él.
  const nameInput = head.querySelector('input');
  nameInput.value = rubric.name;
  nameInput.addEventListener('input', () => { rubric.name = nameInput.value.trim(); render(); });
  head.querySelector('span').textContent =
    `${fileName} · ${rubric.criteria.length} criterios · ${max} puntos máx.`;
  preview.append(head);

  for (const c of rubric.criteria) {
    const box = document.createElement('div');
    box.className = 'criterion';
    const title = document.createElement('h3');
    title.textContent = c.description;
    const levels = document.createElement('ol');
    for (const l of c.levels) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="score"></span><span></span>';
      li.children[0].textContent = `${l.score} pt`;
      li.children[1].textContent = l.definition;
      levels.append(li);
    }
    box.append(title, levels);
    preview.append(box);
  }
  preview.hidden = false;
  render();
}

function handleResult(res) {
  if (!res.ok) {
    state.rubric = null;
    $('preview').hidden = true;
    $('file-error').textContent = res.error;
    $('file-error').hidden = false;
    render();
  } else if (res.value) showRubric(res.value);
}

function log(text, kind = '') {
  const li = document.createElement('li');
  li.textContent = text;
  if (kind) li.className = kind;
  $('log').append(li);
  $('log').hidden = false;
}

$('launch').addEventListener('click', async () => {
  const res = await window.api.launchChrome();
  if (!res.ok) alert(res.error);
  setTimeout(refreshStatus, 1500);
});

$('choose').addEventListener('click', async () => handleResult(await window.api.chooseRubric()));

const formatDialog = $('format-dialog');
$('format-info').addEventListener('click', () => formatDialog.showModal());
// Se cierra con el botón, con Esc (nativo de <dialog>) o pulsando fuera del cuadro
formatDialog.addEventListener('click', (e) => {
  if (e.target === formatDialog || e.target.closest('[data-close]')) formatDialog.close();
});

const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.add('over');
}));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));
drop.addEventListener('drop', async (e) => {
  e.preventDefault();
  const [file] = e.dataTransfer.files;
  if (file) handleResult(await window.api.loadRubric(file));
});
// Evita que soltar un archivo fuera de la zona abra el archivo en la ventana
['dragover', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => e.preventDefault()));

window.api.onLog((msg) => log(msg));

$('import').addEventListener('click', async () => {
  state.busy = true;
  $('log').replaceChildren();
  render();
  const res = await window.api.importRubric(state.rubric);
  if (!res.ok) log(`Error: ${res.error}`, 'error');
  else log('Importación completada.', 'done');
  state.busy = false;
  refreshStatus();
});

render();
refreshStatus();
setInterval(refreshStatus, 2500);
