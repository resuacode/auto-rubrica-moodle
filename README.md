# auto-rubrica-moodle
Automatizador de rúbricas para Moodle desde VS Code. Lee una rúbrica definida en `.md` o `.csv` y rellena el editor de rúbricas de Moodle en tu navegador (sin plugins en el servidor).

## Requisitos
- Node.js 18+ y Google Chrome/Chromium.

## Instalación
```bash
npm install
```
(`puppeteer-core` no descarga un navegador; se usa el tuyo.)

## Formato del archivo
**Markdown** (`ejemplos/rubrica.md`): `#` nombre de la rúbrica, `##` cada criterio, y una línea `- puntos: descripción` por nivel.
```md
# Rúbrica: Trabajo final
## Claridad
- 0: Confusa
- 10: Clara
```
**CSV** (`ejemplos/rubrica.csv`): cabecera `criterio,puntos,descripcion`; una fila por nivel (usa comillas si el texto contiene comas). Cada criterio necesita al menos 2 niveles.

## Uso paso a paso
1. Cierra Chrome y ábrelo con depuración remota y tu sesión de Moodle:
   ```bash
   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-moodle
   ```
2. Inicia sesión en Moodle y abre la página *Definir nueva rúbrica* de la actividad (Calificación avanzada → Rúbrica).
3. Valida tu archivo (opcional):
   ```bash
   node src/cli.js ejemplos/rubrica.md --dry-run
   ```
4. Ejecuta (usa la pestaña activa, o `--url` para navegar a ella):
   ```bash
   node src/cli.js ejemplos/rubrica.md
   ```
5. Revisa la rúbrica en pantalla y pulsa **Guardar** manualmente.

Opciones: `--browser-url` (por defecto `http://127.0.0.1:9222`), `--url`, `--dry-run`.

## Pruebas
`npm test`

## Notas
Los selectores se basan en el editor estándar de Moodle (`gradingform_rubric`). Si tu tema o versión difiere, ajusta las constantes en `src/filler.js`.
