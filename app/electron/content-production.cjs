const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { spawn } = require('node:child_process')

const ALLOWED_FOOTAGE_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm', '.avi'])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/
const activeProcesses = new Map()

function assertSafeId(value, fieldName) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) throw new Error(`${fieldName} is invalid.`)
  return value
}

function assertInside(rootPath, candidatePath) {
  const root = path.resolve(rootPath)
  const candidate = path.resolve(candidatePath)
  const relative = path.relative(root, candidate)
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Resolved path leaves the protected content-production directory.')
  return candidate
}

async function validateFootagePath(sourcePath) {
  if (typeof sourcePath !== 'string' || !sourcePath.trim()) throw new Error('Prerecorded footage path is required.')
  const resolved = await fsp.realpath(sourcePath)
  const extension = path.extname(resolved).toLowerCase()
  if (!ALLOWED_FOOTAGE_EXTENSIONS.has(extension)) throw new Error(`Unsupported footage extension: ${extension || 'none'}.`)
  const stats = await fsp.stat(resolved)
  if (!stats.isFile()) throw new Error('Selected footage is not a file.')
  return { sourcePath: resolved, extension, displayName: path.basename(resolved) }
}

function resolveFfmpegPath({ isPackaged = false, resourcesPath = process.resourcesPath, ffmpegPath } = {}) {
  if (ffmpegPath) return path.resolve(ffmpegPath)
  if (isPackaged) {
    return path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  }
  return require('ffmpeg-static')
}

function resolveTtsScriptPath({ isPackaged = false, resourcesPath = process.resourcesPath, appDirectory = __dirname, ttsScriptPath } = {}) {
  if (ttsScriptPath) return path.resolve(ttsScriptPath)
  if (isPackaged) return path.join(resourcesPath, 'app.asar.unpacked', 'electron', 'system-speech-tts.ps1')
  return path.join(appDirectory, 'system-speech-tts.ps1')
}

function runProcess(executable, args, { cwd, processKey, timeoutMs = 180_000, onStdout } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (processKey) activeProcesses.set(processKey, child)
    let stdout = ''
    let stderr = ''
    let settled = false
    const timer = setTimeout(() => {
      child.kill()
      if (!settled) reject(new Error(`Process timed out after ${timeoutMs} ms.`))
      settled = true
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout = `${stdout}${text}`.slice(-64_000)
      onStdout?.(text)
    })
    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk.toString()}`.slice(-64_000)
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      if (processKey && activeProcesses.get(processKey) === child) activeProcesses.delete(processKey)
      if (!settled) reject(error)
      settled = true
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (processKey && activeProcesses.get(processKey) === child) activeProcesses.delete(processKey)
      if (settled) return
      settled = true
      if (code === 0) resolve({ stdout, stderr, code })
      else reject(new Error((stderr || stdout || `${path.basename(executable)} exited with code ${code}.`).trim()))
    })
  })
}

function cancelActiveProcess(processKey) {
  const child = activeProcesses.get(processKey)
  if (!child) return false
  activeProcesses.delete(processKey)
  return child.kill()
}

function cancelAllActiveProcesses() {
  let canceled = 0
  for (const [processKey, child] of activeProcesses.entries()) {
    activeProcesses.delete(processKey)
    if (child.kill()) canceled += 1
  }
  return canceled
}

function mediaStageError(stage, code, error) {
  const wrapped = new Error(error instanceof Error ? error.message : String(error))
  wrapped.stage = stage
  wrapped.code = code
  return wrapped
}

async function listSystemVoices(options = {}) {
  const scriptPath = resolveTtsScriptPath(options)
  const result = await runProcess('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
    '-ListVoices',
  ], { timeoutMs: 30_000 })
  const parsed = JSON.parse(result.stdout.trim() || '[]')
  return Array.isArray(parsed) ? parsed : []
}

async function synthesizeNarration({ text, voiceId, attemptDirectory, processKey, options = {} }) {
  if (typeof text !== 'string' || !text.trim() || text.length > 30_000) throw new Error('Narration text must contain 1 to 30,000 characters.')
  const wavPath = path.join(attemptDirectory, 'narration.wav')
  const timingPath = path.join(attemptDirectory, 'word-timings.json')
  const configPath = path.join(attemptDirectory, 'tts-request.json')
  const config = {
    text: text.trim(),
    voiceId: typeof voiceId === 'string' ? voiceId.slice(0, 160) : '',
    rate: 0,
    volume: 100,
    outputWavPath: wavPath,
    timingJsonPath: timingPath,
  }
  await fsp.writeFile(configPath, JSON.stringify(config), 'utf8')
  const scriptPath = resolveTtsScriptPath(options)
  await runProcess('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
    '-InputJsonPath', configPath,
  ], { processKey, timeoutMs: 180_000 })
  const timing = JSON.parse((await fsp.readFile(timingPath, 'utf8')).replace(/^\uFEFF/, ''))
  if (!Array.isArray(timing.words) || timing.words.length === 0) throw new Error('System.Speech returned no usable word timing.')
  return { wavPath, words: timing.words, voice: timing.voice || 'Windows default voice' }
}

async function readWaveDurationMs(wavPath) {
  const buffer = await fsp.readFile(wavPath)
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Narration output is not a valid RIFF/WAVE file.')
  }
  let offset = 12
  let bytesPerSecond
  let dataSize
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    if (chunkId === 'fmt ' && size >= 16) bytesPerSecond = buffer.readUInt32LE(offset + 16)
    if (chunkId === 'data') {
      dataSize = size
      break
    }
    offset += 8 + size + (size % 2)
  }
  if (!bytesPerSecond || dataSize === undefined) throw new Error('Narration WAV duration metadata is incomplete.')
  return Math.round((dataSize / bytesPerSecond) * 1000)
}

function groupWordTimings(words, narrationDurationMs, { maxWords = 3, maxCharacters = 24, maxDurationMs = 1400 } = {}) {
  const normalized = words
    .filter((word) => word && typeof word.text === 'string' && word.text.trim() && Number.isFinite(word.startMs) && word.startMs >= 0)
    .map((word) => ({ text: word.text.trim(), startMs: Math.round(word.startMs) }))
    .sort((a, b) => a.startMs - b.startMs)
  if (!normalized.length || !Number.isFinite(narrationDurationMs) || narrationDurationMs <= 0) return []

  const groups = []
  let current = []
  for (const word of normalized) {
    const proposed = [...current, word]
    const text = proposed.map((item) => item.text).join(' ')
    const duration = word.startMs - (current[0]?.startMs ?? word.startMs)
    const punctuationBoundary = current.length > 0 && /[.!?]$/.test(current[current.length - 1].text)
    if (current.length > 0 && (proposed.length > maxWords || text.length > maxCharacters || duration > maxDurationMs || punctuationBoundary)) {
      groups.push({ words: current, startMs: current[0].startMs })
      current = [word]
    } else {
      current = proposed
    }
  }
  if (current.length) groups.push({ words: current, startMs: current[0].startMs })

  return groups.map((group, index) => {
    const nextStart = groups[index + 1]?.startMs ?? narrationDurationMs
    return {
      text: group.words.map((word) => word.text).join(' '),
      startMs: Math.min(group.startMs, narrationDurationMs),
      endMs: Math.max(group.startMs + 250, Math.min(narrationDurationMs, nextStart - 40)),
    }
  }).filter((cue) => cue.startMs < narrationDurationMs && cue.endMs > cue.startMs)
}

function assTime(milliseconds) {
  const centiseconds = Math.max(0, Math.round(milliseconds / 10))
  const hours = Math.floor(centiseconds / 360000)
  const minutes = Math.floor((centiseconds % 360000) / 6000)
  const seconds = Math.floor((centiseconds % 6000) / 100)
  const fraction = centiseconds % 100
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(fraction).padStart(2, '0')}`
}

function escapeAssText(text) {
  return text.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}').replace(/\r?\n/g, '\\N')
}

function createAssSubtitles(hookText, ctaText, cues, narrationDurationMs) {
  const duration = Math.max(500, narrationDurationMs)
  const hookEnd = Math.min(duration, 3000)
  const ctaStart = Math.max(0, duration - 2800)
  return `${[
    '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', 'WrapStyle: 0', 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Caption,Arial,74,&H00FFFFFF,&H000000FF,&H00101010,&H78000000,1,0,0,0,100,100,0,0,1,5,1,2,80,80,260,1',
    'Style: Hook,Arial,82,&H0000FFFF,&H000000FF,&H00101010,&H78000000,1,0,0,0,100,100,0,0,1,6,1,8,90,90,170,1',
    'Style: CTA,Arial,70,&H0000FFFF,&H000000FF,&H00101010,&H78000000,1,0,0,0,100,100,0,0,1,5,1,2,90,90,170,1', '',
    '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    `Dialogue: 2,${assTime(0)},${assTime(hookEnd)},Hook,,0,0,0,,${escapeAssText(hookText)}`,
    ...cues.map((cue) => `Dialogue: 1,${assTime(cue.startMs)},${assTime(cue.endMs)},Caption,,0,0,0,,${escapeAssText(cue.text)}`),
    `Dialogue: 2,${assTime(ctaStart)},${assTime(duration)},CTA,,0,0,0,,${escapeAssText(ctaText)}`,
  ].join('\n')}\n`
}

function buildFfmpegArguments({ footagePath, narrationPath, outputPath, durationSeconds }) {
  return [
    '-y', '-hide_banner', '-loglevel', 'warning', '-stream_loop', '-1', '-i', footagePath, '-i', narrationPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,subtitles=captions.ass',
    '-t', durationSeconds.toFixed(3), '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', outputPath,
  ]
}

function validateMediaRequest(request) {
  if (!request || typeof request !== 'object') throw new Error('Content media request is required.')
  const jobId = assertSafeId(request.jobId, 'jobId')
  const attemptId = assertSafeId(request.attemptId, 'attemptId')
  if (request.formatId !== 'reddit-stories') throw new Error('Unsupported content format.')
  if (!request.script || typeof request.script !== 'object') throw new Error('Structured script is required.')
  for (const field of ['hookText', 'narrationText', 'ctaText']) {
    if (typeof request.script[field] !== 'string' || !request.script[field].trim()) throw new Error(`${field} is required.`)
    if (request.script[field].length > 30_000) throw new Error(`${field} exceeds the supported length.`)
  }
  return { jobId, attemptId }
}

async function renderContentProduction(request, environment, onProgress = () => {}) {
  const { jobId, attemptId } = validateMediaRequest(request)
  const processKey = `${jobId}:${attemptId}`
  const footage = await validateFootagePath(request.footagePath)
  const outputRoot = path.resolve(environment.outputRoot)
  const tempRoot = path.resolve(environment.tempRoot)
  await fsp.mkdir(outputRoot, { recursive: true })
  await fsp.mkdir(tempRoot, { recursive: true })
  const attemptDirectory = assertInside(tempRoot, path.join(tempRoot, jobId, attemptId))
  await fsp.mkdir(attemptDirectory, { recursive: true })
  const outputFileName = `${jobId}-${attemptId}.mp4`
  const outputPath = assertInside(outputRoot, path.join(outputRoot, outputFileName))
  let completed = false

  try {
    onProgress({ jobId, attemptId, stage: 'Narrating', progress: 0, message: 'Generating local narration and word timing.' })
    let narration
    let durationMs
    let cues
    try {
      narration = await synthesizeNarration({
        text: request.script.narrationText,
        voiceId: request.voiceId,
        attemptDirectory,
        processKey,
        options: environment,
      })
      durationMs = await readWaveDurationMs(narration.wavPath)
      cues = groupWordTimings(narration.words, durationMs)
      if (!cues.length) throw new Error('Narration word timing could not produce caption cues.')
      const captionsPath = path.join(attemptDirectory, 'captions.ass')
      await fsp.writeFile(captionsPath, createAssSubtitles(request.script.hookText, request.script.ctaText, cues, durationMs), 'utf8')
    } catch (error) {
      throw mediaStageError('Narrating', 'Narration Failed', error)
    }
    onProgress({ jobId, attemptId, stage: 'Narrating', progress: 100, message: 'Narration and synchronized captions are ready.' })
    onProgress({ jobId, attemptId, stage: 'Rendering', progress: 0, message: 'Rendering the vertical MP4.' })

    try {
      const ffmpegPath = resolveFfmpegPath(environment)
      if (!fs.existsSync(ffmpegPath)) throw new Error('Pinned FFmpeg runtime was not found.')
      await runProcess(ffmpegPath, buildFfmpegArguments({
        footagePath: footage.sourcePath,
        narrationPath: narration.wavPath,
        outputPath,
        durationSeconds: durationMs / 1000,
      }), { cwd: attemptDirectory, processKey, timeoutMs: 600_000 })
      const outputStats = await fsp.stat(outputPath)
      if (!outputStats.isFile() || outputStats.size === 0) throw new Error('FFmpeg did not produce a usable MP4 output file.')
      completed = true
      onProgress({ jobId, attemptId, stage: 'Rendering', progress: 100, message: 'Vertical MP4 rendering completed.' })

      return {
        outputFileName,
        relativeOutputPath: outputFileName,
        durationSeconds: Number((durationMs / 1000).toFixed(3)),
        width: 1080,
        height: 1920,
        frameRate: 30,
        videoCodec: 'h264',
        audioCodec: 'aac',
        narrationVoice: narration.voice,
        captionCount: cues.length,
      }
    } catch (error) {
      throw mediaStageError('Rendering', 'Media Render Failed', error)
    }
  } finally {
    if (!completed) await fsp.rm(outputPath, { force: true })
    await fsp.rm(attemptDirectory, { recursive: true, force: true })
  }
}

function safeOutputPath(outputRoot, outputFileName) {
  if (typeof outputFileName !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,255}\.mp4$/i.test(outputFileName)) {
    throw new Error('Output filename is invalid.')
  }
  return assertInside(outputRoot, path.join(outputRoot, outputFileName))
}

module.exports = {
  ALLOWED_FOOTAGE_EXTENSIONS,
  assertInside,
  assertSafeId,
  buildFfmpegArguments,
  cancelActiveProcess,
  cancelAllActiveProcesses,
  createAssSubtitles,
  groupWordTimings,
  listSystemVoices,
  readWaveDurationMs,
  renderContentProduction,
  resolveFfmpegPath,
  resolveTtsScriptPath,
  runProcess,
  safeOutputPath,
  synthesizeNarration,
  validateFootagePath,
  validateMediaRequest,
}
