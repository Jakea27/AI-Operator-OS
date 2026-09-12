const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('operatorOS', {
  platform: process.platform,
  version: '0.1.0-alpha',
  contentProduction: {
    selectFootage: () => ipcRenderer.invoke('content-production:select-footage'),
    listNarrationVoices: () => ipcRenderer.invoke('content-production:list-voices'),
    buildMedia: (request) => ipcRenderer.invoke('content-production:build-media', request),
    cancelMedia: (jobId, attemptId) => ipcRenderer.invoke('content-production:cancel-media', jobId, attemptId),
    previewUrl: (outputFileName) => `ao-media://output/${encodeURIComponent(outputFileName)}`,
    revealOutput: (outputFileName) => ipcRenderer.invoke('content-production:reveal-output', outputFileName),
    onProgress: (listener) => {
      const handler = (_event, progress) => listener(progress)
      ipcRenderer.on('content-production:progress', handler)
      return () => ipcRenderer.removeListener('content-production:progress', handler)
    },
  },
})
