import { Search } from 'lucide-react'

export function MemorySearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="panel flex items-center gap-3 p-3">
      <Search size={17} className="ml-1 text-muted" />
      <input
        className="w-full bg-transparent py-1 text-sm text-white outline-none placeholder:text-muted"
        placeholder="Search titles, summaries, details, issues, sprints, authors, and tags..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
