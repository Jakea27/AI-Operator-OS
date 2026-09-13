import type {
  ContentFormatModule,
  ContentProductionInput,
  ContentScript,
} from './contentProductionTypes'

const MAX_SOURCE_LENGTH = 20_000
const MAX_REQUIREMENTS_LENGTH = 4_000
const MIN_NARRATION_WORDS_PER_SECOND = 2.75
const MAX_NARRATION_WORDS_PER_SECOND = 3.3

export function narrationWordRange(targetDurationSeconds: number) {
  return {
    minimum: Math.ceil(Number((targetDurationSeconds * MIN_NARRATION_WORDS_PER_SECOND).toFixed(6))),
    maximum: Math.floor(targetDurationSeconds * MAX_NARRATION_WORDS_PER_SECOND),
  }
}

function narrationSentencePlan(targetDurationSeconds: number) {
  const range = narrationWordRange(targetDurationSeconds)
  const sentenceCount = Math.max(2, Math.ceil(range.minimum / 8))
  return {
    sentenceCount,
    minimumWordsPerSentence: Math.ceil(range.minimum / sentenceCount),
    maximumWordsPerSentence: Math.floor(range.maximum / sentenceCount),
  }
}

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
  const permittedKeys = new Set(['hookText', 'narrationText', 'narrationSentences', 'ctaText'])
  const extraKeys = Object.keys(parsed).filter((key) => !permittedKeys.has(key))

  if (extraKeys.length > 0) {
    throw new Error(`Provider response contains unsupported fields: ${extraKeys.join(', ')}.`)
  }

  const hookText = requiredText(parsed.hookText, 'hookText')
  if (parsed.narrationText !== undefined && parsed.narrationSentences !== undefined) {
    throw new Error('Provider response must contain narrationText or narrationSentences, not both.')
  }
  if (Array.isArray(parsed.narrationSentences) && parsed.narrationSentences.length === 0) {
    throw new Error('narrationSentences must contain at least one sentence.')
  }
  const narrationText = Array.isArray(parsed.narrationSentences)
    ? parsed.narrationSentences.map((sentence, index) => requiredText(sentence, `narrationSentences[${index}]`)).join(' ')
    : requiredText(parsed.narrationText, 'narrationText')
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
  const wordRange = narrationWordRange(target)
  const sentencePlan = narrationSentencePlan(target)
  return [
    'Create one complete vertical-video narration package for the Reddit Stories content format.',
    `Target spoken duration: approximately ${target} seconds.`,
    `HARD LENGTH REQUIREMENT: the combined narrationSentences text must contain ${wordRange.minimum}-${wordRange.maximum} words so the spoken narration matches that target.`,
    `Return narrationSentences as an array of exactly ${sentencePlan.sentenceCount} distinct strings, each containing ${sentencePlan.minimumWordsPerSentence}-${sentencePlan.maximumWordsPerSentence} words.`,
    'Do not finish early. Count all narrationSentences words before responding and revise them until the combined total is inside the required range. Do not report the word count.',
    'When the source is only a topic, independently invent a complete story with a setup, escalating events, a turning point, and a clear ending.',
    'Do not merely summarize or restate the supplied topic.',
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
    'Return JSON only, with exactly hookText, narrationSentences, and ctaText:',
    '{"hookText":"...","narrationSentences":["sentence 1","sentence 2"],"ctaText":"..."}',
    'hookText and ctaText must be non-empty strings; narrationSentences must contain only non-empty strings. Do not add Markdown, analysis, titles, or additional fields.',
    'hookText and ctaText are separate from narrationSentences and do not count toward its required word range.',
    'Do not repeat any narration sentence. Keep ctaText separate from narrationSentences.',
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
