Crea rúbricas en Moodle desde un archivo `.md` o `.csv` sin usar la línea de comandos. Solo necesitas tener **Google Chrome** instalado (en Linux y macOS también sirve Chromium).

## Descarga
| Sistema | Archivo |
|---|---|
| **Windows** | `AutoRubricaMoodle-<versión>.exe`: portable, no requiere instalación. |
| **macOS** (Apple Silicon: M1, M2…) | `AutoRubricaMoodle-<versión>-mac-arm64.dmg` |
| **macOS** (Intel) | `AutoRubricaMoodle-<versión>-mac-x64.dmg` |
| **Linux** (Ubuntu, Debian…) | `AutoRubricaMoodle-<versión>-linux-amd64.deb` |
| **Linux** (cualquier distribución) | `AutoRubricaMoodle-<versión>-linux-x86_64.AppImage`: portable. |

La aplicación no está firmada, así que la primera vez el sistema avisará:
- **Windows**: en el aviso de SmartScreen, pulsa **Más información → Ejecutar de todas formas**.
- **macOS**: arrastra la aplicación a *Aplicaciones* y ábrela. Si macOS no permite abrirla, ve a **Ajustes del Sistema → Privacidad y seguridad** y pulsa **Abrir igualmente**.
- **Linux (.deb)**: instálalo con `sudo apt install ./AutoRubricaMoodle-<versión>-linux-amd64.deb`.
- **Linux (AppImage)**: dale permiso de ejecución (`chmod +x` o *Propiedades → Permitir ejecutar*). En Ubuntu puede hacer falta `sudo apt install libfuse2t64` (o `libfuse2` en versiones anteriores a la 24.04).

## Cómo se usa
1. Pulsa **Abrir Chrome para Moodle** e inicia sesión en Moodle en esa ventana (solo la primera vez).
2. Abre el editor de la rúbrica de la actividad (*Calificación avanzada*). La aplicación mostrará **Editor detectado**.
3. Arrastra tu `.md` o `.csv` (o usa **Seleccionar archivo…**) y revisa la vista previa y el nombre. El botón **i** explica el formato de los archivos.
4. Pulsa **Importar a Moodle**, revisa la rúbrica y guárdala en Moodle.

Más detalles en el [README](https://github.com/resuacode/auto-rubrica-moodle#readme).
