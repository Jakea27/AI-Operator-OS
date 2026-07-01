import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { BusinessRecord, useBusinessStore } from '@/src/core/businesses'
import { BusinessCard } from '../components/BusinessCard'
import { BusinessForm } from '../components/BusinessForm'

export function BusinessesPage() {
  const businessStore = useBusinessStore()
  const [showForm, setShowForm] = useState(false)

  const stats = useMemo(() => {
    const businesses = businessStore.businesses
    return {
      total: businesses.length,
      building: countStatus(businesses, 'Building'),
      launching: countStatus(businesses, 'Launching'),
      operating: countStatus(businesses, 'Operating'),
      optimizing: countStatus(businesses, 'Optimizing'),
      pausedArchived: businesses.filter((business) => ['Paused', 'Archived'].includes(business.status)).length,
    }
  }, [businessStore.businesses])

  return (
    <>
      <PageIntro
        eyebrow="Module 002"
        title="Business Manager"
        description="Manage approved businesses as structured operating records. Track status, health, placeholder performance metrics, and the lifecycle from build through scale."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Business
          </button>
        }
      />

      {showForm ? (
        <BusinessForm
          onCancel={() => setShowForm(false)}
          onCreate={(input) => {
            businessStore.createBusiness(input)
            setShowForm(false)
          }}
        />
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Businesses" value={stats.total} />
        <SummaryCard label="Building" value={stats.building} />
        <SummaryCard label="Launching" value={stats.launching} />
        <SummaryCard label="Operating" value={stats.operating} />
        <SummaryCard label="Optimizing" value={stats.optimizing} />
        <SummaryCard label="Paused / Archived" value={stats.pausedArchived} />
      </div>

      {businessStore.businesses.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {businessStore.businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <section className="panel p-8 text-center">
          <p className="eyebrow mb-2">No businesses yet</p>
          <h3 className="m-0 font-display text-2xl font-semibold text-white">Create the first operating business record.</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
            Businesses are the active operating layer after opportunities have been validated and approved. Start with a
            simple record, then expand metrics, departments, tasks, and financials over time.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
            <Plus size={15} /> New Business
          </button>
        </section>
      )}
    </>
  )
}

function countStatus(businesses: BusinessRecord[], status: BusinessRecord['status']) {
  return businesses.filter((business) => business.status === status).length
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="m-0 mt-1 text-xs text-muted">Local business records</p>
    </div>
  )
}

