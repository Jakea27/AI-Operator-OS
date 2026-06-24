const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('operatorOS', {
  platform: process.platform,
  version: '0.1.0-alpha',
})
