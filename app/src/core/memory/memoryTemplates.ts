import { MemoryDraft, MemoryType } from './memoryTypes'

export type MemoryTemplate = {
  label: MemoryType
  type: MemoryType
  category: string
  summary: string
  details: string
  tags: string[]
}

export const memoryTemplates: MemoryTemplate[] = [
  {
    label: 'Decision',
    type: 'Decision',
    category: 'Strategy',
    summary: 'Decision made, expected outcome, and business impact.',
    details: '## Decision\n\n## Context\n\n## Alternatives considered\n\n## Expected outcome\n\n## Review date',
    tags: ['decision'],
  },
  {
    label: 'Business Rule',
    type: 'Business Rule',
    category: 'Operations',
    summary: 'Rule that guides repeatable business decisions.',
    details: '## Rule\n\n## Why it exists\n\n## Applies when\n\n## Exceptions\n\n## Owner',
    tags: ['business-rule'],
  },
  {
    label: 'SOP',
    type: 'SOP',
    category: 'Operations',
    summary: 'Repeatable operating procedure and completion standard.',
    details: '## Purpose\n\n## Inputs\n\n## Steps\n\n1. \n2. \n3. \n\n## Definition of done',
    tags: ['sop', 'process'],
  },
  {
    label: 'Sprint',
    type: 'Sprint',
    category: 'Development',
    summary: 'Sprint objective, progress, outcomes, and follow-up work.',
    details: '## Objective\n\n## Completed\n\n- \n\n## In progress\n\n- \n\n## Risks\n\n## Next sprint',
    tags: ['sprint'],
  },
  {
    label: 'Idea',
    type: 'Idea',
    category: 'Product',
    summary: 'Opportunity worth evaluating and the problem it may solve.',
    details: '## Opportunity\n\n## Customer problem\n\n## Proposed approach\n\n## Evidence needed\n\n## Next experiment',
    tags: ['idea'],
  },
  {
    label: 'Bug',
    type: 'Bug',
    category: 'Development',
    summary: 'Observed defect, impact, and current status.',
    details: '## Symptoms\n\n## Steps to reproduce\n\n1. \n2. \n\n## Expected behavior\n\n## Actual behavior\n\n## Resolution',
    tags: ['bug'],
  },
  {
    label: 'Research',
    type: 'Research',
    category: 'Research',
    summary: 'Research question, evidence, findings, and recommendation.',
    details: '## Research question\n\n## Sources\n\n- \n\n## Findings\n\n## Recommendation\n\n## Confidence',
    tags: ['research'],
  },
]

export function applyMemoryTemplate(current: MemoryDraft, template: MemoryTemplate): MemoryDraft {
  return {
    ...current,
    type: template.type,
    category: template.category,
    summary: template.summary,
    details: template.details,
    tags: template.tags,
  }
}
