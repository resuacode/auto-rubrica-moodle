const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  chromeStatus: () => ipcRenderer.invoke('chrome:status'),
  launchChrome: () => ipcRenderer.invoke('chrome:launch'),
  chooseRubric: () => ipcRenderer.invoke('rubric:choose'),
  loadRubric: (file) => ipcRenderer.invoke('rubric:load', webUtils.getPathForFile(file)),
  importRubric: (rubric) => ipcRenderer.invoke('rubric:import', rubric),
  onLog: (fn) => ipcRenderer.on('import:log', (_e, msg) => fn(msg)),
});
