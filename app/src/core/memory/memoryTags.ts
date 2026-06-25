import { MemoryEntry } from './memoryTypes'

export const suggestedMemoryTags = [
  'ceo',
  'money',
  'development',
  'customer',
  'process',
  'product',
  'strategy',
  'operations',
  'risk',
  'research',
]

export const suggestedMemoryCategories = [
  'Development',
  'Finance',
  'Marketing',
  'Operations',
  'AI',
  'Product',
  'Research',
  'Sales',
  'Automation',
  'Strategy',
]

export function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

export function collectMemoryTags(entries: MemoryEntry[]) {
  return Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort()
}

export function collectMemoryCategories(entries: MemoryEntry[]) {
  return Array.from(new Set([
    ...suggestedMemoryCategories,
    ...entries.map((entry) => entry.category).filter(Boolean),
  ])).sort()
}
