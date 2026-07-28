import { AlertTriangle, Bot, BrainCircuit, CheckCircle2, Cloud, Database, Filter, Laptop, PlugZap, RefreshCw, Search, ServerCog, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { PageIntro } from '@/components/PageIntro'
import { SectionHeader } from '@/components/SectionHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { SummaryCard } from '@/components/SummaryCard'
import { ollamaAdapter } from '@/src/core/providers/adapters/ollama'
import { ModelRegistrationPlan } from '@/src/core/providers/modelDiscoveryTypes'
import { providerStore, useProviderStore } from '@/src/core/providers/providerStore'
import { ProviderHealthStatus } from '@/src/core/providers/providerTypes'
import {
  ProviderAttentionFilter,
  ProviderConfiguredFilter,
  ProviderEnabledFilter,
  ProviderFilters,
  ProviderHealthFilter,
  ProviderModelFilter,
  ProviderRuntimeFilter,
  ProviderSortMode,
  ProviderViewModel,
  buildProviderViewModels,
  filterAndSortProviders,
  formatProviderDate,
  formatProviderMoney,
  isOllamaProvider,
  providerStatusTone,
} from './providerDashboardUtils'

const defaultFilters: ProviderFilters = {
  query: '',
  health: 'All',
  runtime: 'All',
  enabled: 'All',
  configured: 'All',
  attention: 'All',
  models: 'All',
  sort: 'Updated',
}

type ActionState = {
  providerId?: string
  message: string
  tone: 'good' | 'warning' | 'danger' | 'neutral'
}

export function ProviderDashboardPage() {
  const providerState = useProviderStore()
  const [filters, setFilters] = useState<ProviderFilters>(defaultFilters)
  const [plans, setPlans] = useState<Record<string, ModelRegistrationPlan>>({})
  const [actionState, setActionState] = useState<ActionState | undefined>()
  const [busyProviderId, setBusyProviderId] = useState<string | undefined>()

  const providers = useMemo(() => buildProviderViewModels(providerState), [providerState])
  const filteredProviders = useMemo(() => filterAndSortProviders(providers, filters), [filters, providers])
  const stats = useMemo(() => ({
    total: providers.length,
    enabled: providers.filter((item) => item.provider.enabled).length,
    healthy: providers.filter((item) => item.healthStatus === 'Healthy').length,
    degraded: providers.filter((item) => item.healthStatus === 'Degraded').length,
    unavailable: providers.filter((item) => ['Unavailable', 'Error', 'Misconfigured'].includes(item.healthStatus)).length,
    disabled: providers.filter((item) => !item.provider.enabled).length,
    configured: providers.filter((item) => item.configured).length,
    misconfigured: providers.filter((item) => !item.configured).length,
    local: providers.filter((item) => item.provider.runtime === 'Local').length,
    cloud: providers.filter((item) => item.provider.runtime === 'Cloud').length,
    models: providerState.models.length,
    attention: providers.filter((item) => item.requiresAttention).length,
  }), [providerState.models.length, providers])

  function updateFilter<Key extends keyof ProviderFilters>(key: Key, value: ProviderFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function endpointFor(provider: ProviderViewModel) {
    return provider.configuration?.endpoint || ollamaAdapter.defaultEndpoint
  }

  function timeoutFor(provider: ProviderViewModel) {
    return provider.configuration?.connectionTimeoutMs
  }

  function ensureLocalOllamaProvider() {
    const result = ollamaAdapter.ensureProvider()
    setActionState({
      providerId: result.provider.id,
      tone: result.created ? 'good' : 'neutral',
      message: result.created
        ? `Local Ollama provider record created. Endpoint: ${result.endpoint}.`
        : `Local Ollama provider record already exists. Endpoint: ${result.endpoint}.`,
    })
  }

  async function runHealthCheck(provider: ProviderViewModel) {
    if (!isOllamaProvider(provider.provider)) return
    setBusyProviderId(provider.provider.id)
    try {
      const result = await ollamaAdapter.checkHealth({ endpoint: endpointFor(provider), timeoutMs: timeoutFor(provider) })
      ollamaAdapter.recordHealth(provider.provider.id, result)
      setActionState({
        providerId: provider.provider.id,
        tone: result.status === 'Healthy' ? 'good' : 'warning',
        message: result.message || `Health check completed with status ${result.status}.`,
      })
    } catch (error) {
      setActionState({
        providerId: provider.provider.id,
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Health check failed safely.',
      })
    } finally {
      setBusyProviderId(undefined)
    }
  }

  async function discoverModels(provider: ProviderViewModel) {
    if (!isOllamaProvider(provider.provider)) return
    setBusyProviderId(provider.provider.id)
    try {
      const result = await ollamaAdapter.createRegistrationPlan(provider.provider.id, { endpoint: endpointFor(provider), timeoutMs: timeoutFor(provider) })
      setPlans((current) => ({ ...current, [provider.provider.id]: result.plan }))
      setActionState({
        providerId: provider.provider.id,
        tone: result.plan.failureCount > 0 ? 'warning' : 'good',
        message: `${result.discovery.message} Registration plan: ${result.plan.addedCount} add, ${result.plan.updatedCount} update, ${result.plan.unchangedCount} unchanged, ${result.plan.rejectedCount} rejected.`,
      })
    } catch (error) {
      setActionState({
        providerId: provider.provider.id,
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Model discovery failed safely.',
      })
    } finally {
      setBusyProviderId(undefined)
    }
  }

  function applyPlan(provider: ProviderViewModel) {
    const plan = plans[provider.provider.id]
    if (!plan) return

    const result = ollamaAdapter.applyRegistrationPlan(provider.provider.id, plan)
    setPlans((current) => {
      const next = { ...current }
      delete next[provider.provider.id]
      return next
    })
    setActionState({
      providerId: provider.provider.id,
      tone: result.rejected.length > 0 ? 'warning' : 'good',
      message: `Registration plan applied: ${result.added.length} added, ${result.updated.length} updated, ${result.skipped.length} skipped, ${result.rejected.length} rejected.`,
    })
  }

  function toggleProvider(provider: ProviderViewModel) {
    if (provider.provider.enabled) {
      providerStore.disableProvider(provider.provider.id)
      setActionState({ providerId: provider.provider.id, tone: 'neutral', message: `${provider.provider.name} disabled. No provider execution was triggered.` })
      return
    }

    providerStore.enableProvider(provider.provider.id)
    setActionState({ providerId: provider.provider.id, tone: 'good', message: `${provider.provider.name} enabled. This only changes stored availability metadata.` })
  }

  function toggleModel(provider: ProviderViewModel, modelRecordId: string, enabled: boolean, displayName: string) {
    if (enabled) {
      providerStore.disableModel(modelRecordId)
      setActionState({ providerId: provider.provider.id, tone: 'neutral', message: `${displayName} disabled. No provider execution was triggered.` })
      return
    }

    providerStore.enableModel(modelRecordId)
    setActionState({ providerId: provider.provider.id, tone: 'good', message: `${displayName} enabled for provider recommendations. No prompt was executed.` })
  }

  return (
    <div className="space-y-7">
      <PageIntro
        eyebrow="Sprint 013"
        title="Provider Dashboard"
        description="Manage provider visibility, health metadata, local model registration plans, and provider readiness without executing prompts or connecting cloud services."
        action={<button type="button" className="btn-secondary" onClick={ensureLocalOllamaProvider}>Add Local Ollama Provider</button>}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Providers" value={stats.total} helper="Stored provider records" icon={<ServerCog size={16} />} />
        <SummaryCard label="Enabled" value={stats.enabled} helper="Available for recommendation" icon={<CheckCircle2 size={16} />} />
        <SummaryCard label="Healthy" value={stats.healthy} helper="Latest health metadata" icon={<ShieldCheck size={16} />} />
        <SummaryCard label="Needs Attention" value={stats.attention} helper="Validation warnings" icon={<AlertTriangle size={16} />} />
        <SummaryCard label="Local Providers" value={stats.local} helper="Local runtime" icon={<Laptop size={16} />} />
        <SummaryCard label="Model Records" value={stats.models} helper="Registered model metadata" icon={<BrainCircuit size={16} />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Configured" value={stats.configured} helper="Configuration ready" />
        <SummaryCard label="Misconfigured" value={stats.misconfigured} helper="Needs setup or validation" />
        <SummaryCard label="Degraded" value={stats.degraded} helper="Limited health" />
        <SummaryCard label="Unavailable" value={stats.unavailable} helper="Offline or error" />
        <SummaryCard label="Disabled" value={stats.disabled} helper="Not selectable" />
        <SummaryCard label="Cloud Providers" value={stats.cloud} helper="Framework only" icon={<Cloud size={16} />} />
      </div>

      <section className="panel p-5">
        <SectionHeader
          eyebrow="Provider control plane"
          title="Providers"
          description="Filter, inspect, and explicitly refresh local provider metadata. Actions here never execute prompts."
          action={<Filter size={18} className="text-muted" />}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Search</span>
            <span className="relative block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                className="field pl-9"
                placeholder="Provider, ID, capability, model"
              />
            </span>
          </label>
          <Select label="Health" value={filters.health} onChange={(value) => updateFilter('health', value as ProviderHealthFilter)} options={['All', 'Healthy', 'Degraded', 'Unavailable', 'Misconfigured', 'Disabled', 'Error', 'Not Checked', 'Unknown']} />
          <Select label="Runtime" value={filters.runtime} onChange={(value) => updateFilter('runtime', value as ProviderRuntimeFilter)} options={['All', 'Local', 'Cloud', 'Hybrid']} />
          <Select label="Enabled" value={filters.enabled} onChange={(value) => updateFilter('enabled', value as ProviderEnabledFilter)} options={['All', 'Enabled', 'Disabled']} />
          <Select label="Configured" value={filters.configured} onChange={(value) => updateFilter('configured', value as ProviderConfiguredFilter)} options={['All', 'Configured', 'Not Configured']} />
          <Select label="Attention" value={filters.attention} onChange={(value) => updateFilter('attention', value as ProviderAttentionFilter)} options={['All', 'Needs Attention', 'No Attention']} />
          <Select label="Models" value={filters.models} onChange={(value) => updateFilter('models', value as ProviderModelFilter)} options={['All', 'Has Models', 'No Models']} />
          <Select label="Sort" value={filters.sort} onChange={(value) => updateFilter('sort', value as ProviderSortMode)} options={['Updated', 'Name', 'Health', 'Model Count', 'Usage Cost']} />
        </div>

        <div className="mt-5">
          {providers.length === 0 ? (
            <EmptyState
              icon={PlugZap}
              title="No providers registered"
              copy="Provider records appear here after explicit registration. Add the built-in local Ollama provider to inspect health and model metadata without executing prompts."
              action={<button type="button" className="btn-primary" onClick={ensureLocalOllamaProvider}>Add Local Ollama Provider</button>}
            />
          ) : filteredProviders.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No providers match these filters"
              copy="Adjust provider runtime, health, model, configuration, or attention filters to inspect a different slice of local provider metadata."
            />
          ) : (
            <div className="grid gap-4">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={provider.provider.id}
                  provider={provider}
                  plan={plans[provider.provider.id]}
                  actionState={actionState?.providerId === provider.provider.id ? actionState : undefined}
                  busy={busyProviderId === provider.provider.id}
                  onHealth={() => runHealthCheck(provider)}
                  onDiscover={() => discoverModels(provider)}
                  onApplyPlan={() => applyPlan(provider)}
                  onToggle={() => toggleProvider(provider)}
                  onToggleModel={(modelRecordId, enabled, displayName) => toggleModel(provider, modelRecordId, enabled, displayName)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function ProviderCard({
  provider,
  plan,
  actionState,
  busy,
  onHealth,
  onDiscover,
  onApplyPlan,
  onToggle,
  onToggleModel,
}: {
  provider: ProviderViewModel
  plan?: ModelRegistrationPlan
  actionState?: ActionState
  busy: boolean
  onHealth: () => void
  onDiscover: () => void
  onApplyPlan: () => void
  onToggle: () => void
  onToggleModel: (modelRecordId: string, enabled: boolean, displayName: string) => void
}) {
  const ollama = isOllamaProvider(provider.provider)

  return (
    <article className="record-card">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{provider.provider.providerId} · {provider.provider.runtime} · {provider.provider.source}</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{provider.provider.name}</h3>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-muted">{provider.provider.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={provider.provider.status} tone={providerStatusTone(provider.provider.status)} />
          <StatusBadge label={provider.healthStatus} tone={providerStatusTone(provider.healthStatus)} />
          <StatusBadge label={provider.configured ? 'Configured' : 'Not Configured'} tone={provider.configured ? 'good' : 'warning'} />
          <StatusBadge label={provider.provider.enabled ? 'Enabled' : 'Disabled'} tone={provider.provider.enabled ? 'good' : 'muted'} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Info label="Endpoint" value={provider.configuration?.endpoint || 'No endpoint'} />
        <Info label="Availability" value={provider.availability} />
        <Info label="Models" value={String(provider.models.length)} />
        <Info label="Compatible Models" value={String(provider.compatibleModelCount)} />
        <Info label="Last Health Check" value={formatProviderDate(provider.health?.lastCheckedAt)} />
        <Info label="Updated" value={formatProviderDate(provider.updatedAt)} />
        <Info label="Estimated Cost" value={formatProviderMoney(provider.totalEstimatedCost)} />
        <Info label="Actual Cost" value={formatProviderMoney(provider.totalActualCost)} />
        <Info label="Recommendation Score" value={String(Math.round(provider.recommendationScore))} />
        <Info label="Timeout" value={`${provider.configuration?.connectionTimeoutMs ?? 30000} ms`} />
        <Info label="Secrets" value={provider.configuration?.apiKeyRequired ? 'Environment reference only' : 'No API key required'} />
        <Info label="Capabilities" value={provider.provider.supportedCapabilities.length ? provider.provider.supportedCapabilities.join(', ') : 'None recorded'} />
      </div>

      {provider.requiresAttention ? (
        <div className="mt-4 rounded-xl border border-[#ffcc66]/25 bg-[#ffcc66]/10 p-4">
          <p className="m-0 text-sm font-semibold text-[#ffdc8f]">Attention needed</p>
          <ul className="mb-0 mt-2 space-y-1 pl-4 text-sm leading-6 text-muted">
            {provider.attentionReasons.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
      ) : null}

      {provider.models.length > 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-white/[0.025] p-4">
          <p className="eyebrow mb-3">Registered Models</p>
          <div className="grid gap-3 md:grid-cols-2">
            {provider.models.map((model) => (
              <div key={model.id} className="rounded-xl border border-line bg-ink/35 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">{model.displayName}</p>
                    <p className="m-0 mt-1 text-xs text-muted">{model.modelName}</p>
                  </div>
                  <StatusBadge label={model.enabled ? 'Enabled' : 'Disabled'} tone={model.enabled ? 'good' : 'muted'} />
                </div>
                <p className="m-0 mt-2 text-xs leading-5 text-muted">
                  {model.supportedCapabilities.length ? model.supportedCapabilities.join(', ') : 'No capabilities recorded.'}
                </p>
                <button type="button" className="btn-secondary mt-3" onClick={() => onToggleModel(model.id, model.enabled, model.displayName)}>
                  {model.enabled ? 'Disable Model' : 'Enable Model'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {plan ? <RegistrationPlan plan={plan} /> : null}

      {actionState ? (
        <p className={`m-0 mt-4 rounded-xl border px-3 py-2 text-sm ${
          actionState.tone === 'good'
            ? 'border-lime/30 bg-lime/10 text-lime'
            : actionState.tone === 'danger'
              ? 'border-red-400/30 bg-red-400/10 text-red-200'
              : actionState.tone === 'warning'
                ? 'border-[#ffcc66]/30 bg-[#ffcc66]/10 text-[#ffdc8f]'
                : 'border-line bg-white/[0.04] text-muted'
        }`}>
          {actionState.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/providers/${provider.provider.id}`} className="btn-primary">Open Provider</Link>
        <button type="button" className="btn-secondary" onClick={onToggle}>{provider.provider.enabled ? 'Disable' : 'Enable'}</button>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={onHealth} disabled={!ollama || busy}>
          <RefreshCw size={13} /> Run Health Check
        </button>
        <button type="button" className="btn-secondary" onClick={onDiscover} disabled={!ollama || busy}>Discover Models</button>
        {plan ? <button type="button" className="btn-secondary" onClick={onApplyPlan}>Apply Registration Plan</button> : null}
      </div>
      {!ollama ? <p className="m-0 mt-3 text-xs text-muted">Health and model discovery actions are currently available only for the local Ollama adapter.</p> : null}
    </article>
  )
}

function RegistrationPlan({ plan }: { plan: ModelRegistrationPlan }) {
  return (
    <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
      <p className="m-0 text-sm font-semibold text-cyan-100">Model registration plan</p>
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        <Info label="Add" value={String(plan.addedCount)} />
        <Info label="Update" value={String(plan.updatedCount)} />
        <Info label="Unchanged" value={String(plan.unchangedCount)} />
        <Info label="Rejected" value={String(plan.rejectedCount)} />
        <Info label="Generated" value={formatProviderDate(plan.generatedAt)} />
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 truncate text-sm font-semibold text-white" title={value}>{value || 'Not recorded'}</p>
    </div>
  )
}
