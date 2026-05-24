const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('calendarAPI', {
  exportIcs: (defaultName, content) =>
    ipcRenderer.invoke('calendar:export-ics', { defaultName, content }),
  importIcs: () => ipcRenderer.invoke('calendar:import-ics'),
  openExternal: (url) => ipcRenderer.invoke('calendar:open-external', url),
})
