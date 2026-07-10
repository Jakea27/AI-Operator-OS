export type StatusTone = 'neutral' | 'good' | 'warning' | 'danger' | 'info' | 'muted'

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-line bg-white/[0.04] text-[#dce7df]',
  good: 'border-lime/30 bg-lime/10 text-lime',
  warning: 'border-[#ffcc66]/30 bg-[#ffcc66]/10 text-[#ffdc8f]',
  danger: 'border-red-400/30 bg-red-400/10 text-red-200',
  info: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  muted: 'border-line bg-ink/45 text-muted',
}

export function statusTone(status: string): StatusTone {
  const normalized = status.toLowerCase()
  if (['approved', 'completed', 'complete', 'ready', 'ready for review', 'healthy', 'operating', 'active'].includes(normalized)) return 'good'
  if (['pending', 'planning', 'draft', 'incomplete', 'watch', 'waiting approval', 'review', 'on hold'].includes(normalized)) return 'warning'
  if (['blocked', 'rejected', 'at risk', 'over budget'].includes(normalized)) return 'danger'
  if (['in progress', 'building', 'launching', 'optimizing', 'scaling'].includes(normalized)) return 'info'
  if (['archived', 'paused', 'deferred'].includes(normalized)) return 'muted'
  return 'neutral'
}

export function StatusBadge({ label, tone }: { label: string; tone?: StatusTone }) {
  return (
    <span className={`status-badge ${toneClasses[tone ?? statusTone(label)]}`}>
      {label}
    </span>
  )
}
