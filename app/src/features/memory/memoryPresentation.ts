import { MemoryType } from '@/src/core/memory'

const typeStyles: Partial<Record<MemoryType, string>> = {
  'Business Rule': 'border-lime/30 bg-lime/10 text-lime',
  Decision: 'border-[#6ca8ff]/30 bg-[#6ca8ff]/10 text-[#8bb9ff]',
  Architecture: 'border-[#b58cff]/30 bg-[#b58cff]/10 text-[#c5a6ff]',
  Research: 'border-[#f4bd55]/30 bg-[#f4bd55]/10 text-[#f4c96f]',
  Idea: 'border-[#ff9f55]/30 bg-[#ff9f55]/10 text-[#ffad6d]',
  Bug: 'border-[#ff6f6f]/30 bg-[#ff6f6f]/10 text-[#ff8b8b]',
  SOP: 'border-[#54d9eb]/30 bg-[#54d9eb]/10 text-[#78e4f1]',
  Sprint: 'border-[#42cbb7]/30 bg-[#42cbb7]/10 text-[#6dd8c8]',
  Knowledge: 'border-[#72d68a]/30 bg-[#72d68a]/10 text-[#8ee0a0]',
}

export function memoryTypeClass(type: MemoryType) {
  return typeStyles[type] ?? 'border-white/10 bg-white/[0.05] text-[#c3cbc7]'
}
