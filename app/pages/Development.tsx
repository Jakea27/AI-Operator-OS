import { Bug, CheckCircle2, Circle, Code2, GitPullRequest, Rocket } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'

const columns = [
  { title: 'Backlog', count: 4, cards: [['Memory search', 'Feature'], ['Invoice sync', 'Integration']] },
  { title: 'In progress', count: 3, cards: [['Onboarding automation', 'Priority'], ['Desktop shell', 'Feature']] },
  { title: 'Review', count: 2, cards: [['Billing guardrails', 'Pull request'], ['Settings persistence', 'Feature']] },
  { title: 'Done', count: 18, cards: [['Repository foundation', 'Complete'], ['Operating dashboard', 'Complete']] },
]

export function Development() {
  return (
    <>
      <PageIntro eyebrow="Build system" title="Ship the work that creates leverage." description="A focused development workspace for the current sprint, releases, and technical health." action={<button className="btn-primary flex items-center gap-2"><Code2 size={15} /> New task</button>} />
      <div className="mb-4 grid grid-cols-3 gap-4">
        {[['Sprint velocity', '32 pts', '+18%', Rocket], ['Open pull requests', '4', '2 ready', GitPullRequest], ['Active issues', '7', '3 high priority', Bug]].map(([label, value, meta, Icon]) => {
          const IconComponent = Icon as typeof Rocket
          return <section key={label as string} className="panel flex items-center gap-4 p-5"><div className="rounded-xl bg-lime/10 p-3 text-lime"><IconComponent size={18} /></div><div><p className="m-0 text-xs text-muted">{label as string}</p><p className="my-1 text-xl font-semibold">{value as string}</p><p className="m-0 text-[11px] text-mint">{meta as string}</p></div></section>
        })}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column, columnIndex) => (
          <section key={column.title} className="panel min-h-[420px] p-4">
            <div className="mb-4 flex items-center justify-between px-1"><div className="flex items-center gap-2">{columnIndex === 3 ? <CheckCircle2 size={15} className="text-mint" /> : <Circle size={13} className="text-muted" />}<h3 className="m-0 text-sm font-semibold">{column.title}</h3></div><span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-muted">{column.count}</span></div>
            <div className="space-y-3">
              {column.cards.map(([title, tag]) => <article key={title} className="rounded-xl border border-line bg-ink/50 p-4 transition hover:border-muted"><p className="m-0 text-sm font-medium">{title}</p><div className="mt-6 flex items-center justify-between"><span className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-muted">{tag}</span><div className="flex -space-x-1.5"><span className="h-5 w-5 rounded-full border-2 border-panel bg-mint/30" /><span className="h-5 w-5 rounded-full border-2 border-panel bg-lime/30" /></div></div></article>)}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
