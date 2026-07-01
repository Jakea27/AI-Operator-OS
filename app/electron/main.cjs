const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const isDev = !app.isPackaged
const iconPath = path.join(__dirname, '../assets/icon.ico')
const devServerUrl = process.env.AO_DEV_SERVER_URL || 'http://127.0.0.1:5173'

app.setName('AI Operator OS')
if (process.platform === 'win32') {
  app.setAppUserModelId('com.aioperator.os')
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadDevelopmentWindow(window, attempt = 1) {
  try {
    await window.loadURL(devServerUrl)
  } catch (error) {
    if (attempt >= 30) {
      console.error(`Failed to load AI Operator OS development server at ${devServerUrl}`)
      console.error(error)
      return
    }

    await delay(500)
    await loadDevelopmentWindow(window, attempt + 1)
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#090d0c',
    icon: iconPath,
    title: 'AI Operator OS',
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.once('ready-to-show', () => window.show())

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    loadDevelopmentWindow(window)
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
