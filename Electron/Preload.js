const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getApiToken: () => ipcRenderer.invoke("get-api-token"),
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (data) => ipcRenderer.invoke("save-config", data),
  isConfigured: () => ipcRenderer.invoke("is-configured"),
  clearConfig: () => ipcRenderer.invoke("clear-config"),
  clearBot: () => ipcRenderer.invoke("clear-bot"),
  pickExcelFolder: () => ipcRenderer.invoke("pick-excel-folder"),
  copyExcelTemplate: (folder) => ipcRenderer.invoke("copy-excel-template", folder),
  openExcelFile: (filePath) => ipcRenderer.invoke("open-excel-file", filePath),
  checkExcelPath: (filePath) => ipcRenderer.invoke("check-excel-path", filePath),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  resetExcelFile: (filePath) => ipcRenderer.invoke("reset-excel-file", filePath),
});
