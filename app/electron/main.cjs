const { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } = require('electron')
const path = require('node:path')
const { fileURLToPath, pathToFileURL } = require('node:url')
const {
  assertSafeId,
  cancelAllActiveProcesses,
  cancelActiveProcess,
  listSystemVoices,
  renderContentProduction,
  safeOutputPath,
  validateFootagePath,
} = require('./content-production.cjs')

const activeMediaBuilds = new Set()

const isDev = !app.isPackaged
const iconPath = path.join(__dirname, '../assets/icon.ico')
const devServerUrl = process.env.AO_DEV_SERVER_URL || 'http://127.0.0.1:5173'

app.setName('AI Operator OS')
protocol.registerSchemesAsPrivileged([{
  scheme: 'ao-media',
  privileges: { secure: true, standard: true, stream: true, supportFetchAPI: true },
}])
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

function contentOutputRoot() {
  return path.join(app.getPath('videos'), 'AI Operator OS', 'Generated')
}

function contentTempRoot() {
  return path.join(app.getPath('temp'), 'AI Operator OS', 'content-production')
}

function trustedSender(event) {
  const senderUrl = event.senderFrame?.url || event.sender.getURL()
  try {
    const parsed = new URL(senderUrl)
    if (isDev) {
      const allowedOrigins = new Set([new URL(devServerUrl).origin, 'http://localhost:5173'])
      return allowedOrigins.has(parsed.origin)
    }
    if (parsed.protocol !== 'file:') return false
    const rendererRoot = path.resolve(__dirname, '../dist')
    const senderPath = path.resolve(fileURLToPath(parsed))
    const relative = path.relative(rendererRoot, senderPath)
    return !relative.startsWith('..') && !path.isAbsolute(relative)
  } catch {
    return false
  }
}

function requireTrustedSender(event) {
  if (!trustedSender(event)) throw new Error('Content-production IPC request came from an untrusted renderer.')
}

function mediaEnvironment() {
  return {
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    appDirectory: __dirname,
    outputRoot: contentOutputRoot(),
    tempRoot: contentTempRoot(),
  }
}

function registerContentProductionIpc() {
  ipcMain.handle('content-production:select-footage', async (event) => {
    requireTrustedSender(event)
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: 'Select prerecorded footage',
      properties: ['openFile'],
      filters: [{ name: 'Video footage', extensions: ['mp4', 'mov', 'm4v', 'webm', 'avi'] }],
    })
    if (result.canceled || !result.filePaths[0]) return { canceled: true }
    const footage = await validateFootagePath(result.filePaths[0])
    return {
      canceled: false,
      footage: { ...footage, selectedAt: new Date().toISOString() },
    }
  })

  ipcMain.handle('content-production:list-voices', async (event) => {
    requireTrustedSender(event)
    return listSystemVoices(mediaEnvironment())
  })

  ipcMain.handle('content-production:build-media', async (event, request) => {
    requireTrustedSender(event)
    const jobId = assertSafeId(request?.jobId, 'jobId')
    const attemptId = assertSafeId(request?.attemptId, 'attemptId')
    const buildKey = `${jobId}:${attemptId}`
    if (activeMediaBuilds.has(buildKey)) {
      return { success: false, stage: 'Rendering', code: 'Duplicate Media Build', errorMessage: 'This job attempt is already being rendered.' }
    }
    activeMediaBuilds.add(buildKey)
    try {
      const media = await renderContentProduction(request, mediaEnvironment(), (progress) => {
        if (!event.sender.isDestroyed()) event.sender.send('content-production:progress', progress)
      })
      return { success: true, media }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Local media production failed.'
      const stage = error?.stage === 'Narrating' ? 'Narrating' : 'Rendering'
      return {
        success: false,
        stage,
        code: typeof error?.code === 'string' ? error.code : stage === 'Narrating' ? 'Narration Failed' : 'Media Render Failed',
        errorMessage: message,
      }
    } finally {
      activeMediaBuilds.delete(buildKey)
    }
  })

  ipcMain.handle('content-production:cancel-media', async (event, jobId, attemptId) => {
    requireTrustedSender(event)
    return { canceled: cancelActiveProcess(`${assertSafeId(jobId, 'jobId')}:${assertSafeId(attemptId, 'attemptId')}`) }
  })

  ipcMain.handle('content-production:reveal-output', async (event, outputFileName) => {
    requireTrustedSender(event)
    const outputPath = safeOutputPath(contentOutputRoot(), outputFileName)
    shell.showItemInFolder(outputPath)
    return { revealed: true }
  })

  protocol.handle('ao-media', (request) => {
    const url = new URL(request.url)
    if (url.hostname !== 'output') return new Response('Not found', { status: 404 })
    try {
      const outputFileName = decodeURIComponent(url.pathname.replace(/^\//, ''))
      const outputPath = safeOutputPath(contentOutputRoot(), outputFileName)
      return net.fetch(pathToFileURL(outputPath).toString(), { headers: request.headers })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })
}

app.whenReady().then(() => {
  registerContentProductionIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  cancelAllActiveProcesses()
})
