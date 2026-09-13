import type {
  ContentFormatModule,
  ContentProductionInput,
  ContentScript,
} from './contentProductionTypes'

const MAX_SOURCE_LENGTH = 20_000
const MAX_REQUIREMENTS_LENGTH = 4_000

function requiredText(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`)
  }
  return value.trim()
}

function assertNoRepeatedNarrationSentences(narrationText: string) {
  const sentences = narrationText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (new Set(sentences).size !== sentences.length) {
    throw new Error('narrationText must not repeat the same sentence.')
  }
}

function parseJsonObject(responseText: string) {
  const trimmed = responseText.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const candidate = fenced?.[1]?.trim() ?? trimmed

  if (!candidate.startsWith('{') || !candidate.endsWith('}')) {
    throw new Error('Provider response must contain one JSON object and no explanatory text.')
  }

  try {
    const parsed = JSON.parse(candidate) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Provider response JSON must be an object.')
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Provider response is not valid JSON: ${error.message}`)
    }
    throw error
  }
}

export function parseRedditStoriesScript(responseText: string): ContentScript {
  const parsed = parseJsonObject(responseText)
  const permittedKeys = new Set(['hookText', 'narrationText', 'ctaText'])
  const extraKeys = Object.keys(parsed).filter((key) => !permittedKeys.has(key))

  if (extraKeys.length > 0) {
    throw new Error(`Provider response contains unsupported fields: ${extraKeys.join(', ')}.`)
  }

  const hookText = requiredText(parsed.hookText, 'hookText')
  const narrationText = requiredText(parsed.narrationText, 'narrationText')
  const ctaText = requiredText(parsed.ctaText, 'ctaText')
  assertNoRepeatedNarrationSentences(narrationText)
  return { hookText, narrationText, ctaText }
}

function validateInput(input: ContentProductionInput) {
  const issues: string[] = []
  if (!input.topicOrSourceStory.trim()) issues.push('Topic or source story is required.')
  if (input.topicOrSourceStory.length > MAX_SOURCE_LENGTH) issues.push(`Topic or source story must not exceed ${MAX_SOURCE_LENGTH} characters.`)
  if (input.requirements.length > MAX_REQUIREMENTS_LENGTH) issues.push(`Requirements must not exceed ${MAX_REQUIREMENTS_LENGTH} characters.`)
  if (!input.footage.sourcePath.trim()) issues.push('Prerecorded footage is required.')
  if (input.targetDurationSeconds !== undefined && (!Number.isFinite(input.targetDurationSeconds) || input.targetDurationSeconds < 15 || input.targetDurationSeconds > 180)) {
    issues.push('Target duration must be between 15 and 180 seconds.')
  }
  return issues
}

function buildProviderInstructions(input: ContentProductionInput, revisionInstructions?: string) {
  const target = input.targetDurationSeconds ?? 60
  return [
    'Create one concise vertical-video narration package for the Reddit Stories content format.',
    `Target spoken duration: approximately ${target} seconds.`,
    input.style?.trim() ? `Style preference: ${input.style.trim()}` : '',
    '',
    'Source story or topic:',
    input.topicOrSourceStory.trim(),
    '',
    'CEO requirements:',
    input.requirements.trim() || 'No additional requirements.',
    revisionInstructions?.trim() ? '' : '',
    revisionInstructions?.trim() ? 'CEO revision instructions:' : '',
    revisionInstructions?.trim() ?? '',
    '',
    'Return JSON only, with exactly these three string fields:',
    '{"hookText":"...","narrationText":"...","ctaText":"..."}',
    'All three fields must be non-empty. Do not add Markdown, analysis, titles, or additional fields.',
    'Do not repeat any narration sentence. Keep ctaText separate from narrationText.',
    'Do not publish, approve, create work records, or trigger another action.',
  ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n').trim()
}

export const redditStoriesFormat: ContentFormatModule = {
  id: 'reddit-stories',
  label: 'Reddit Stories',
  defaults: {
    targetDurationSeconds: 60,
    width: 1080,
    height: 1920,
    frameRate: 30,
  },
  validateInput,
  buildProviderInstructions,
  parseProviderResult: parseRedditStoriesScript,
}

export const contentFormatModules: Record<ContentFormatModule['id'], ContentFormatModule> = {
  'reddit-stories': redditStoriesFormat,
}
