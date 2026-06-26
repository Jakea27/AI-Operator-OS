import { MemoryType } from '@/src/core/memory'

const typeStyles: Partial<Record<MemoryType, string>> = {
  'Business Rule': 'border-lime/35 bg-lime/10 text-lime',
  Decision: 'border-blue-400/35 bg-blue-400/10 text-blue-300',
  Architecture: 'border-purple-400/35 bg-purple-400/10 text-purple-300',
  Research: 'border-amber-400/35 bg-amber-400/10 text-amber-300',
  Idea: 'border-orange-400/35 bg-orange-400/10 text-orange-300',
  Bug: 'border-red-400/35 bg-red-400/10 text-red-300',
  SOP: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-300',
  Sprint: 'border-teal-400/35 bg-teal-400/10 text-teal-300',
  Knowledge: 'border-green-400/35 bg-green-400/10 text-green-300',
  Issue: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
  'Meeting Note': 'border-sky-400/35 bg-sky-400/10 text-sky-300',
  'Release Note': 'border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-300',
}

export function memoryTypeClass(type: MemoryType) {
  return typeStyles[type] ?? 'border-white/10 bg-white/[0.05] text-[#c3cbc7]'
}

const typeDots: Partial<Record<MemoryType, string>> = {
  'Business Rule': 'bg-lime',
  Decision: 'bg-blue-300',
  Architecture: 'bg-purple-300',
  Research: 'bg-amber-300',
  Idea: 'bg-orange-300',
  Bug: 'bg-red-300',
  SOP: 'bg-cyan-300',
  Sprint: 'bg-teal-300',
  Knowledge: 'bg-green-300',
  Issue: 'bg-rose-300',
  'Meeting Note': 'bg-sky-300',
  'Release Note': 'bg-fuchsia-300',
}

export function memoryTypeDotClass(type: MemoryType) {
  return typeDots[type] ?? 'bg-white/50'
}
