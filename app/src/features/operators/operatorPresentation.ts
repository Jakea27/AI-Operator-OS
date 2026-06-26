import { OperatorId, OperatorStatus } from '@/src/core/operators'

export const operatorIcons: Record<OperatorId, string> = {
  cto: '🛠',
  cfo: '💰',
  cmo: '📈',
  coo: '⚙',
  research: '🔬',
}

export const statusClass: Record<OperatorStatus, string> = {
  Working: 'border-lime/30 bg-lime/10 text-lime',
  Idle: 'border-white/10 bg-white/[0.05] text-[#b8c2bd]',
  Waiting: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Analyzing: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  'Needs Context': 'border-purple-400/30 bg-purple-400/10 text-purple-300',
  Blocked: 'border-red-400/30 bg-red-400/10 text-red-300',
}

export function operatorIcon(id: OperatorId) {
  return operatorIcons[id]
}
