import { Buffer } from 'node:buffer'
import process from 'node:process'
import esbuild from '../app/node_modules/esbuild/lib/main.js'

const source = `
  import { runLocalOllamaPromptSmokeTest } from './app/src/core/providers/providerExecutionSmokeTest.ts';
  const result = await runLocalOllamaPromptSmokeTest();
  globalThis.__AO_LOCAL_OLLAMA_SMOKE_RESULT__ = result;
`

const bundle = await esbuild.build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: 'ao-local-ollama-prompt-smoke.ts',
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
})

const code = bundle.outputFiles[0]?.text
if (!code) {
  console.error('Smoke test bundle was not generated.')
  process.exit(1)
}

await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const result = globalThis.__AO_LOCAL_OLLAMA_SMOKE_RESULT__
console.log(JSON.stringify(result, null, 2))

if (!result?.success) {
  process.exit(2)
}
