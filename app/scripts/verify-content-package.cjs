const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const unpacked = path.join(root, 'release', 'win-unpacked', 'resources', 'app.asar.unpacked')
const ffmpegPath = path.join(unpacked, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
const ttsScriptPath = path.join(unpacked, 'electron', 'system-speech-tts.ps1')

for (const required of [ffmpegPath, ttsScriptPath]) {
  if (!fs.existsSync(required)) throw new Error(`Packaged runtime is missing: ${required}`)
}

const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const result = spawnSync(process.execPath, [tsx, 'scripts/verify-content-production-engine.ts'], {
  cwd: root,
  env: { ...process.env, AO_FFMPEG_PATH: ffmpegPath, AO_TTS_SCRIPT_PATH: ttsScriptPath },
  encoding: 'utf8',
  windowsHide: true,
})
if (result.error) throw result.error
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
if (result.status !== 0) process.exit(result.status || 1)
console.log('Unpacked Windows FFmpeg and System.Speech helper verification: PASS')
