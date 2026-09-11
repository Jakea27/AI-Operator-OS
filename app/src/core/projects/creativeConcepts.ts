import type { CreativeConcept, CreativeConceptSourceReferences, ProjectKnowledgeEntry, ProjectRecord } from './projectTypes'

export const CREATIVE_CONCEPT_CANDIDATE_COUNT = 4

type ParsedConceptCandidate = Pick<CreativeConcept, 'title' | 'summary' | 'angle' | 'rationale' | 'audienceValue' | 'hookDirection'>

export type CreativeConceptParseResult =
  | {
    success: true
    candidates: ParsedConceptCandidate[]
  }
  | {
    success: false
    error: string
  }

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = text(record[key])
    if (value) return value
  }
  return ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractJsonPayload(raw: string) {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const firstArray = trimmed.indexOf('[')
  const lastArray = trimmed.lastIndexOf(']')
  if (firstArray >= 0 && lastArray > firstArray) {
    return trimmed.slice(firstArray, lastArray + 1)
  }

  const firstObject = trimmed.indexOf('{')
  const lastObject = trimmed.lastIndexOf('}')
  if (firstObject >= 0 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1)
  }

  return trimmed
}

export function parseCreativeConceptCandidates(raw: string): CreativeConceptParseResult {
  if (!raw.trim()) {
    return { success: false, error: 'Creative concept parsing failed: provider response was empty.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonPayload(raw))
  } catch {
    return { success: false, error: 'Creative concept parsing failed: provider response did not contain valid JSON.' }
  }

  const candidates = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.concepts)
      ? parsed.concepts
      : isRecord(parsed) && Array.isArray(parsed.candidates)
        ? parsed.candidates
        : undefined

  if (!candidates) {
    return { success: false, error: 'Creative concept parsing failed: JSON payload must contain a concepts array.' }
  }

  if (candidates.length !== CREATIVE_CONCEPT_CANDIDATE_COUNT) {
    return { success: false, error: `Creative concept parsing failed: expected exactly ${CREATIVE_CONCEPT_CANDIDATE_COUNT} candidates and received ${candidates.length}.` }
  }

  const normalized = candidates.map((candidate) => {
    if (!isRecord(candidate)) return undefined

    const item: ParsedConceptCandidate = {
      title: firstString(candidate, ['title', 'name']),
      summary: firstString(candidate, ['summary', 'conceptSummary', 'description']),
      angle: firstString(candidate, ['angle', 'creativeAngle']),
      rationale: firstString(candidate, ['rationale', 'reasoning']),
      audienceValue: firstString(candidate, ['audienceValue', 'intendedAudienceValue', 'value']),
      hookDirection: firstString(candidate, ['hookDirection', 'hook', 'openingHook']),
    }

    return Object.values(item).every((value) => value.length > 0) ? item : undefined
  })

  if (normalized.some((candidate) => !candidate)) {
    return { success: false, error: 'Creative concept parsing failed: every candidate must include title, summary, angle, rationale, audienceValue, and hookDirection.' }
  }

  return {
    success: true,
    candidates: normalized as ParsedConceptCandidate[],
  }
}

export function buildCreativeConceptInstructions(project: ProjectRecord) {
  const asset = project.businessAsset
  const brief = project.creativeBrief
  const selectedKnowledgeIds = new Set(brief?.selectedKnowledgeEntryIds ?? [])
  const selectedKnowledge = project.knowledgeWorkspace?.entries.filter((entry) => selectedKnowledgeIds.has(entry.id)) ?? []
  const knowledgeText = selectedKnowledge.length > 0
    ? selectedKnowledge.map((entry: ProjectKnowledgeEntry) => [
      `- ${entry.title} (${entry.section})`,
      entry.content ? `  Content: ${entry.content}` : '',
      entry.url ? `  URL: ${entry.url}` : '',
      entry.tags.length > 0 ? `  Tags: ${entry.tags.join(', ')}` : '',
    ].filter(Boolean).join('\n')).join('\n')
    : '- No selected Knowledge Workspace entries.'

  return [
    'Generate exactly 4 reusable creative topic/concept candidates for CEO review.',
    'Return valid JSON only. Do not include markdown unless it is one JSON code fence.',
    'Schema: {"concepts":[{"title":"","summary":"","angle":"","rationale":"","audienceValue":"","hookDirection":""}]}',
    'Do not publish, approve, create a Blueprint, create Work Orders, or trigger external action.',
    '',
    'Business Asset Context:',
    `- Topic/Input: ${asset?.topic || 'Not specified'}`,
    `- Goal: ${asset?.goal || 'Not specified'}`,
    `- Target Audience: ${asset?.targetAudience || 'Not specified'}`,
    `- Tone: ${asset?.tone || 'Not specified'}`,
    `- Target Length: ${asset?.targetLength || 'Not specified'}`,
    `- Platform: ${asset?.platform || 'Not specified'}`,
    `- Target Platforms: ${asset?.targetPlatforms?.length ? asset.targetPlatforms.join(', ') : 'Not specified'}`,
    `- Asset Type: ${asset?.assetType || 'Not specified'}`,
    `- Additional Notes: ${asset?.additionalNotes || 'None'}`,
    '',
    'Creative Brief Context:',
    `- Offer Context: ${brief?.offerContext || 'Not specified'}`,
    `- Key Message: ${brief?.keyMessage || 'Not specified'}`,
    `- CTA: ${brief?.callToAction || 'Not specified'}`,
    `- Constraints: ${brief?.constraints || 'None'}`,
    `- Required Inclusions: ${brief?.requiredInclusions || 'None'}`,
    `- Prohibited Content: ${brief?.prohibitedContent || 'None'}`,
    `- Platform Instructions: ${brief?.platformInstructions || 'None'}`,
    `- Asset Instructions: ${brief?.assetInstructions || 'None'}`,
    '',
    'Selected Knowledge Workspace References:',
    knowledgeText,
    '',
    'Project Context:',
    `- Project: ${project.name}`,
    `- Project Description: ${project.description}`,
  ].join('\n')
}

export function createCreativeConceptRecords(candidates: ParsedConceptCandidate[], sourceReferences: CreativeConceptSourceReferences, createdAt: string): CreativeConcept[] {
  return candidates.map((candidate) => ({
    conceptId: id('CC'),
    ...candidate,
    status: 'Generated',
    selected: false,
    sourceReferences,
    createdAt,
    updatedAt: createdAt,
    metadata: {
      candidateCount: String(CREATIVE_CONCEPT_CANDIDATE_COUNT),
      generationPolicy: 'Manual',
    },
  }))
}
