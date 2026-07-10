import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { SummaryCard } from '@/components/SummaryCard'
import {
  filterOpportunities,
  OpportunityFilters as OpportunityFilterState,
  useOpportunityStore,
} from '@/src/core/opportunities'
import { OpportunityCard } from '../components/OpportunityCard'
import { OpportunityFilters } from '../components/OpportunityFilters'
import { OpportunityForm } from '../components/OpportunityForm'

export function OpportunityPipelinePage() {
  const opportunityStore = useOpportunityStore()
  const [showForm, setShowForm] = useState(false)
  const [filters, setFilters] = useState<OpportunityFilterState>({
    search: '',
    businessCategory: 'All',
    stage: 'All',
    priority: 'All',
    tag: 'All',
    status: 'All',
    sort: 'newest',
  })

  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunityStore.opportunities, filters),
    [opportunityStore.opportunities, filters],
  )

  const stats = useMemo(() => {
    const opportunities = opportunityStore.opportunities
    return {
      total: opportunities.length,
      research: opportunities.filter((opportunity) => opportunity.stage === 'Phase 1 Research').length,
      review: opportunities.filter((opportunity) => opportunity.stage === 'CEO Review').length,
      buildReady: opportunities.filter((opportunity) => ['Ready to Build', 'Building'].includes(opportunity.stage)).length,
    }
  }, [opportunityStore.opportunities])

  const filterOptions = useMemo(() => {
    const categories = Array.from(new Set(opportunityStore.opportunities.map((opportunity) => opportunity.businessCategory))).sort()
    const tags = Array.from(new Set(opportunityStore.opportunities.flatMap((opportunity) => opportunity.tags))).sort()
    return { categories, tags }
  }, [opportunityStore.opportunities])

  return (
    <>
      <PageIntro
        eyebrow="Module 001"
        title="Opportunity Pipeline"
        description="The front door for every future business inside AI Operator OS. Capture ideas, move them through research and CEO review, and prepare only the right opportunities for build."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Opportunity
          </button>
        }
      />

      {showForm ? (
        <OpportunityForm
          onCancel={() => setShowForm(false)}
          onCreate={(input) => {
            opportunityStore.createOpportunity(input)
            setShowForm(false)
          }}
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total" value={stats.total} helper="Opportunities captured" />
        <SummaryCard label="Validation" value={stats.research} helper="In Phase 1 Research" />
        <SummaryCard label="CEO Review" value={stats.review} helper="Waiting for direction" />
        <SummaryCard label="Build Queue" value={stats.buildReady} helper="Ready or actively building" />
      </div>

      <OpportunityFilters
        filters={filters}
        onChange={setFilters}
        categories={filterOptions.categories}
        tags={filterOptions.tags}
      />

      {filteredOpportunities.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No opportunities found</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Start with one business idea.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Opportunities are structured records, not random notes. Add one idea, then move it through validation,
            CEO review, blueprint, build, launch, and operation.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
            <Plus size={15} /> New Opportunity
          </button>
        </section>
      )}
    </>
  )
}
