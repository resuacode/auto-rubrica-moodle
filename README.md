# Auto Rúbrica Moodle
Crea rúbricas en Moodle a partir de un archivo `.md` o `.csv`, sin tener que escribir a mano cada criterio, nivel y puntuación. Rellena el editor de rúbricas de Moodle en tu navegador; no hace falta instalar nada en el servidor de Moodle.

Hay dos formas de usarlo:
- **Aplicación de escritorio** para Windows, macOS y Linux: arrastras el archivo, pulsas *Importar* y listo. No requiere línea de comandos.
- **Línea de comandos** (Windows, macOS o Linux con Node.js).

---

## Aplicación de escritorio

### Descarga e instalación
Descarga el archivo de tu sistema desde la [página de releases](https://github.com/resuacode/auto-rubrica-moodle/releases/latest). Solo necesitas tener **Google Chrome** instalado (en macOS y Linux también sirve Chromium).

| Sistema | Archivo | Cómo se instala |
|---|---|---|
| **Windows** | `AutoRubricaMoodle-<versión>.exe` | No se instala: es portable, basta con abrirlo. |
| **macOS** con Apple Silicon (M1, M2…) | `…-mac-arm64.dmg` | Abre el `.dmg` y arrastra la aplicación a *Aplicaciones*. |
| **macOS** con Intel | `…-mac-x64.dmg` | Igual que el anterior. |
| **Linux** (Ubuntu, Debian…) | `…-linux-amd64.deb` | `sudo apt install ./AutoRubricaMoodle-<versión>-linux-amd64.deb`; aparece en el menú de aplicaciones. |
| **Linux** (cualquier distribución) | `…-linux-x86_64.AppImage` | Portable: dale permiso de ejecución (`chmod +x` o *Propiedades → Permitir ejecutar*) y ábrelo. |

La aplicación no está firmada, así que la primera vez el sistema avisará:
- **Windows**: SmartScreen dice que no es de un editor reconocido. Pulsa **Más información → Ejecutar de todas formas**.
- **macOS**: si no permite abrirla, ve a **Ajustes del Sistema → Privacidad y seguridad** y pulsa **Abrir igualmente**. Si dice que la aplicación «está dañada», ejecuta en Terminal `xattr -cr "/Applications/Auto Rubrica Moodle.app"` y vuelve a abrirla.
- **Linux (AppImage)**: si no arranca en Ubuntu, instala FUSE: `sudo apt install libfuse2t64` (o `libfuse2` en versiones anteriores a la 24.04).

### Uso
1. **Abre Chrome desde la aplicación.** Pulsa **Abrir Chrome para Moodle**. Se abre una ventana de Chrome con un perfil propio de la aplicación (Chrome no permite que otro programa controle tu perfil habitual).
   La primera vez, inicia sesión en Moodle en esa ventana; las siguientes veces la sesión ya estará iniciada.
2. **Abre el editor de rúbricas.** En esa ventana de Chrome, entra en la actividad (con el método de calificación *Rúbrica*), ve a *Calificación avanzada* y elige definir un nuevo formulario de calificación desde cero.
   La aplicación mostrará en verde **Editor detectado** con el título de la página.
3. **Carga la rúbrica.** Arrastra el archivo `.md` o `.csv` a la aplicación, o pulsa **Seleccionar archivo…**.
   Verás una vista previa con los criterios, niveles, puntuaciones y la puntuación máxima. Si el archivo tiene algún error, se indica la línea o fila. El botón **i** junto al título «Rúbrica» muestra el formato que deben tener los archivos.
4. **Revisa el nombre.** El campo **Nombre de la rúbrica** es obligatorio en Moodle. Se rellena con el título del archivo (o con el nombre del archivo si no tiene título); puedes cambiarlo.
5. **Importa.** Pulsa **Importar a Moodle**. La aplicación rellena el nombre, los criterios, los niveles y las puntuaciones, y añade o elimina filas para que coincidan con tu archivo.
6. **Guarda en Moodle.** Revisa la rúbrica en Chrome y guárdala con el botón de Moodle (como lista para usar o como borrador). La aplicación nunca guarda por ti.

### Problemas frecuentes
| Mensaje | Solución |
|---|---|
| *Chrome no conectado* | Pulsa **Abrir Chrome para Moodle**. Si ya tenías esa ventana abierta y la cerraste, vuelve a pulsarlo. |
| *Chrome conectado, pero no hay ninguna pestaña con el editor de rúbricas* | En la ventana de Chrome abierta por la aplicación, abre el editor de la rúbrica (paso 2). Las pestañas de tu Chrome habitual no se detectan. |
| *No se encontró Google Chrome (ni Chromium) instalado* | Instala Google Chrome en su ubicación por defecto. En Linux, la aplicación busca `google-chrome`, `google-chrome-stable`, `chromium` o `chromium-browser`. |
| Error en la vista previa | Revisa el archivo en la línea o fila indicada (ver [formato](#formato-del-archivo)). |

---

## Formato del archivo
Cada criterio necesita **al menos 2 niveles**. Las puntuaciones pueden tener decimales (`2.5` o `2,5`).

### Markdown (`.md`)
- `#` nombre de la rúbrica (opcional; se puede quitar el prefijo «Rúbrica:»).
- `##` cada criterio.
- `- puntos: descripción` cada nivel.

```md
# Rúbrica: Trabajo final

## Claridad de la exposición
- 0: Confusa, no se entiende el mensaje
- 5: Comprensible con algunas lagunas
- 10: Clara y bien estructurada

## Uso de fuentes
- 0: No cita fuentes
- 5: Cita fuentes variadas
```

### CSV (`.csv`)
Cabecera `criterio,puntos,descripcion` y una fila por nivel. Las filas del mismo criterio se agrupan. Las columnas pueden ir separadas por comas o por punto y coma (como guarda Excel en español); se detecta automáticamente. Si un texto contiene el separador, ponlo entre comillas.

Se admiten archivos en UTF-8 y en ANSI (Windows-1252), así que desde Excel sirve tanto «CSV UTF-8» como «CSV (delimitado por comas)».

```csv
criterio,puntos,descripcion
Claridad de la exposición,0,"Confusa, no se entiende el mensaje"
Claridad de la exposición,5,Comprensible con algunas lagunas
Claridad de la exposición,10,Clara y bien estructurada
Uso de fuentes,0,No cita fuentes
Uso de fuentes,5,Cita fuentes variadas
```

Los CSV no llevan nombre de rúbrica: se usa el nombre del archivo (`Trabajo final.csv` → «Trabajo final»). Lo mismo ocurre con un `.md` sin línea `#`.

Tienes ambos ejemplos en [`ejemplos/`](ejemplos/).

---

## Línea de comandos
Requiere **Node.js 18+** y Google Chrome o Chromium.

```bash
npm install
```

1. Abre Chrome con depuración remota y un perfil propio (Chrome no la permite con el perfil habitual):
   ```bash
   # Linux / macOS
   google-chrome --remote-debugging-port=9222 --user-data-dir=$HOME/.chrome-moodle
   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=%LOCALAPPDATA%\chrome-moodle
   ```
2. En esa ventana, inicia sesión en Moodle y abre el editor de la rúbrica (*Calificación avanzada* de la actividad).
3. Valida el archivo (opcional): `node src/cli.js ejemplos/rubrica.md --dry-run`
4. Importa: `node src/cli.js ejemplos/rubrica.md`
5. Revisa la rúbrica y pulsa **Guardar** en Moodle.

| Opción | Descripción |
|---|---|
| `--dry-run` | Solo valida el archivo y muestra la rúbrica interpretada. |
| `--url <url>` | Navega a esa URL antes de rellenar (si no, usa la pestaña que tenga el editor abierto). |
| `--browser-url <url>` | Dirección de depuración de Chrome (por defecto `http://127.0.0.1:9222`). |
| `--help`, `-h` | Muestra la ayuda. |

---

## Desarrollo
```bash
npm install
npm test            # tests del parser y del rellenado
npm run app         # abre la aplicación de escritorio
npm run build:win   # .exe portable de Windows en dist/
npm run build:linux # .AppImage y .deb de Linux
npm run build:mac   # .dmg de macOS (Apple Silicon e Intel); solo funciona en macOS
```

- `src/parser.js` lee los archivos, `src/filler.js` rellena el editor y `src/browser.js` localiza Chrome y la pestaña del editor; los usan tanto `src/cli.js` como la aplicación (`app/`, Electron).
- Los tests del rellenado abren en Chrome headless una imitación del editor de Moodle (`test/fixtures/editor-rubrica.html`). Buscan Chrome en `CHROME_PATH`, en las rutas habituales o en la caché de Puppeteer, y se omiten si no lo encuentran.
- En la terminal de VS Code, ejecuta `unset ELECTRON_RUN_AS_NODE` antes de `npm run app`; si no, Electron arranca como Node.
- `npm run build:win` funciona también desde Linux/WSL sin Wine (por eso el `.exe` usa el icono por defecto de Electron). En macOS, sin certificado de Apple, la aplicación se firma «ad hoc», lo mínimo para que arranque en Apple Silicon.
- Los selectores se basan en el editor estándar de Moodle (`gradingform_rubric`). Si tu tema o versión difiere, ajusta las constantes de `src/filler.js`.

### Publicar una versión
Cada push y pull request ejecuta los tests (`.github/workflows/ci.yml`). Para publicar una versión probada:

```bash
npm version minor        # o patch / major: actualiza package.json, hace commit y crea la etiqueta vX.Y.Z
git push --follow-tags   # sube el commit y la etiqueta
```

Al llegar la etiqueta, `.github/workflows/release.yml` pasa los tests, comprueba que la etiqueta coincide con la versión de `package.json`, genera los paquetes de Windows y Linux (en Ubuntu) y de macOS (en un runner de macOS), y crea la release de GitHub con todos ellos (si ya existía, sustituye los archivos).

Para comprobar que los paquetes se generan sin publicar nada, lanza el workflow a mano: *Actions → Release → Run workflow*. Los paquetes quedan como artefactos descargables de esa ejecución. El texto fijo de las notas está en `.github/release-notes.md`; debajo se añaden automáticamente los cambios desde la versión anterior.
