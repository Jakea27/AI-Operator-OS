import { ArrowLeft, Bot, Database, FileWarning, History, PlugZap, RefreshCw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { SectionHeader } from '@/components/SectionHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { ollamaAdapter } from '@/src/core/providers/adapters/ollama'
import { ModelRegistrationPlan } from '@/src/core/providers/modelDiscoveryTypes'
import { providerStore, useProviderStore } from '@/src/core/providers/providerStore'
import {
  ProviderViewModel,
  buildProviderViewModels,
  formatProviderDate,
  formatProviderMoney,
  isOllamaProvider,
  providerStatusTone,
} from './providerDashboardUtils'

type ActionState = {
  message: string
  tone: 'good' | 'warning' | 'danger' | 'neutral'
}

export function ProviderDetailPage() {
  const { providerRecordId } = useParams()
  const providerState = useProviderStore()
  const provider = useMemo(() => buildProviderViewModels(providerState).find((item) => item.provider.id === providerRecordId || item.provider.providerId === providerRecordId), [providerRecordId, providerState])
  const [plan, setPlan] = useState<ModelRegistrationPlan | undefined>()
  const [actionState, setActionState] = useState<ActionState | undefined>()
  const [busy, setBusy] = useState(false)

  if (!provider) {
    return (
      <div className="space-y-6">
        <Link to="/providers" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Provider Dashboard
        </Link>
        <section className="panel">
          <EmptyState
            icon={FileWarning}
            title="Provider record not found"
            copy="The requested provider record does not exist in the local Provider Store. The record may have been removed or the link may be stale."
            action={<Link to="/providers" className="btn-primary">Open Provider Dashboard</Link>}
          />
        </section>
      </div>
    )
  }

  const providerView = provider
  const ollama = isOllamaProvider(providerView.provider)
  const endpoint = providerView.configuration?.endpoint || ollamaAdapter.defaultEndpoint
  const timeoutMs = providerView.configuration?.connectionTimeoutMs

  async function runHealthCheck() {
    if (!ollama) return
    setBusy(true)
    try {
      const result = await ollamaAdapter.checkHealth({ endpoint, timeoutMs })
      ollamaAdapter.recordHealth(providerView.provider.id, result)
      setActionState({
        tone: result.status === 'Healthy' ? 'good' : 'warning',
        message: result.message || `Health check completed with status ${result.status}.`,
      })
    } catch (error) {
      setActionState({ tone: 'danger', message: error instanceof Error ? error.message : 'Health check failed safely.' })
    } finally {
      setBusy(false)
    }
  }

  async function discoverModels() {
    if (!ollama) return
    setBusy(true)
    try {
      const result = await ollamaAdapter.createRegistrationPlan(providerView.provider.id, { endpoint, timeoutMs })
      setPlan(result.plan)
      setActionState({
        tone: result.plan.failureCount > 0 ? 'warning' : 'good',
        message: `${result.discovery.message} Registration plan is ready for review.`,
      })
    } catch (error) {
      setActionState({ tone: 'danger', message: error instanceof Error ? error.message : 'Model discovery failed safely.' })
    } finally {
      setBusy(false)
    }
  }

  function applyPlan() {
    if (!plan) return
    const result = ollamaAdapter.applyRegistrationPlan(providerView.provider.id, plan)
    setPlan(undefined)
    setActionState({
      tone: result.rejected.length > 0 ? 'warning' : 'good',
      message: `Registration plan applied: ${result.added.length} added, ${result.updated.length} updated, ${result.skipped.length} skipped, ${result.rejected.length} rejected.`,
    })
  }

  function toggleProvider() {
    if (providerView.provider.enabled) {
      providerStore.disableProvider(providerView.provider.id)
      setActionState({ tone: 'neutral', message: `${providerView.provider.name} disabled. No provider execution was triggered.` })
      return
    }

    providerStore.enableProvider(providerView.provider.id)
    setActionState({ tone: 'good', message: `${providerView.provider.name} enabled. This only changes stored availability metadata.` })
  }

  function toggleModel(modelRecordId: string, enabled: boolean, displayName: string) {
    if (enabled) {
      providerStore.disableModel(modelRecordId)
      setActionState({ tone: 'neutral', message: `${displayName} disabled. No provider execution was triggered.` })
      return
    }

    providerStore.enableModel(modelRecordId)
    setActionState({ tone: 'good', message: `${displayName} enabled for provider recommendations. No prompt was executed.` })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/providers" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Provider Dashboard
        </Link>
        <p className="eyebrow mb-2">Provider Detail · {providerView.provider.providerId}</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{providerView.provider.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">
              Read-only provider inspection with explicit local metadata refresh actions. This page does not execute prompts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={providerView.provider.status} tone={providerStatusTone(providerView.provider.status)} />
            <StatusBadge label={providerView.healthStatus} tone={providerStatusTone(providerView.healthStatus)} />
            <StatusBadge label={providerView.provider.enabled ? 'Enabled' : 'Disabled'} tone={providerView.provider.enabled ? 'good' : 'muted'} />
          </div>
        </div>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <SectionHeader
          eyebrow="Executive summary"
          title="Provider readiness"
          action={<Bot size={18} className="text-lime" />}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Info label="Provider ID" value={providerView.provider.providerId} />
          <Info label="Runtime" value={providerView.provider.runtime} />
          <Info label="Availability" value={providerView.availability} />
          <Info label="Configured" value={providerView.configured ? 'Yes' : 'No'} />
          <Info label="Models" value={String(providerView.models.length)} />
          <Info label="Updated" value={formatProviderDate(providerView.updatedAt)} />
        </div>
      </section>

      <section className="panel p-5">
        <SectionHeader
          eyebrow="Explicit actions"
          title="Safe provider operations"
          description="These actions update local provider metadata only. They do not execute prompts or contact cloud providers."
          action={<ShieldCheck size={18} className="text-muted" />}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={toggleProvider}>{providerView.provider.enabled ? 'Disable Provider' : 'Enable Provider'}</button>
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={runHealthCheck} disabled={!ollama || busy}>
            <RefreshCw size={13} /> Run Health Check
          </button>
          <button type="button" className="btn-secondary" onClick={discoverModels} disabled={!ollama || busy}>Discover Models</button>
          {plan ? <button type="button" className="btn-primary" onClick={applyPlan}>Apply Registration Plan</button> : null}
        </div>
        {!ollama ? <p className="m-0 mt-3 text-sm text-muted">Only the local Ollama adapter currently supports live health and discovery metadata refresh.</p> : null}
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
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <Section title="Configuration" eyebrow="Local metadata">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Info label="Endpoint" value={providerView.configuration?.endpoint || 'No endpoint'} />
              <Info label="Local Host" value={providerView.configuration?.localHost || 'Not recorded'} />
              <Info label="Validation" value={providerView.configuration?.validationStatus || 'Not recorded'} />
              <Info label="Timeout" value={`${providerView.configuration?.connectionTimeoutMs ?? 30000} ms`} />
              <Info label="API Key" value={providerView.configuration?.apiKeyRequired ? 'Environment variable reference only' : 'Not required'} />
              <Info label="Preferred Model" value={providerView.configuration?.preferredModelId || 'Not selected'} />
            </div>
            <p className="m-0 mt-4 text-sm leading-6 text-muted">{providerView.configuration?.notes || 'No configuration notes recorded.'}</p>
          </Section>

          <Section title="Models" eyebrow="Registered model metadata">
            {providerView.models.length > 0 ? (
              <div className="grid gap-3">
                {providerView.models.map((model) => (
                  <div key={model.id} className="rounded-xl border border-line bg-ink/35 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="eyebrow mb-1">{model.modelId} · {model.runtime}</p>
                        <h4 className="m-0 text-sm font-semibold text-white">{model.displayName}</h4>
                        <p className="m-0 mt-1 text-xs text-muted">{model.modelName}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge label={model.enabled ? 'Enabled' : 'Disabled'} tone={model.enabled ? 'good' : 'muted'} />
                          <StatusBadge label={model.availability} tone={providerStatusTone(model.availability)} />
                          <StatusBadge label={model.health} tone={providerStatusTone(model.health)} />
                        </div>
                        <button type="button" className="btn-secondary" onClick={() => toggleModel(model.id, model.enabled, model.displayName)}>
                          {model.enabled ? 'Disable Model' : 'Enable Model'}
                        </button>
                      </div>
                    </div>
                    <p className="m-0 mt-3 text-sm leading-6 text-muted">
                      {model.supportedCapabilities.length ? model.supportedCapabilities.join(', ') : 'No capabilities recorded.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Database} title="No models registered" copy="Run Discover Models and review the registration plan to add local model metadata." />
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Health" eyebrow="Latest check">
            <div className="grid gap-3">
              <Info label="Status" value={providerView.healthStatus} />
              <Info label="Availability" value={providerView.health?.availability || providerView.availability} />
              <Info label="Response Time" value={providerView.health?.responseTimeMs === undefined ? 'Not recorded' : `${providerView.health.responseTimeMs} ms`} />
              <Info label="Last Checked" value={formatProviderDate(providerView.health?.lastCheckedAt)} />
              <Info label="Last Success" value={formatProviderDate(providerView.health?.lastSuccessfulCheckAt)} />
              <Info label="Failures" value={String(providerView.health?.consecutiveFailures ?? 0)} />
            </div>
            <p className="m-0 mt-4 text-sm leading-6 text-muted">{providerView.health?.notes || providerView.health?.lastError || 'No health notes recorded.'}</p>
          </Section>

          <Section title="Usage and Cost" eyebrow="Stored summaries">
            <div className="grid gap-3">
              <Info label="Usage Records" value={String(providerView.usage.length)} />
              <Info label="Estimated Cost" value={formatProviderMoney(providerView.totalEstimatedCost)} />
              <Info label="Actual Cost" value={formatProviderMoney(providerView.totalActualCost)} />
            </div>
            <p className="m-0 mt-4 text-sm leading-6 text-muted">
              Usage records are stored summaries only. Task 7 does not add prompt execution, billing, or external provider calls.
            </p>
          </Section>

          <Section title="Registration Plan" eyebrow="Pending local review">
            {plan ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="Add" value={String(plan.addedCount)} />
                  <Info label="Update" value={String(plan.updatedCount)} />
                  <Info label="Unchanged" value={String(plan.unchangedCount)} />
                  <Info label="Rejected" value={String(plan.rejectedCount)} />
                </div>
                <p className="m-0 text-sm leading-6 text-muted">Generated {formatProviderDate(plan.generatedAt)} from {plan.source}.</p>
              </div>
            ) : (
              <EmptyState icon={PlugZap} title="No pending registration plan" copy="Discover models to create a local registration plan before applying model metadata changes." />
            )}
          </Section>

          <Section title="Validation" eyebrow="Provider Manager">
            {providerView.validationIssues.length > 0 ? (
              <div className="space-y-2">
                {providerView.validationIssues.map((issue) => (
                  <div key={`${issue.severity}-${issue.message}`} className="rounded-xl border border-line bg-ink/35 p-3">
                    <StatusBadge label={issue.severity} tone={issue.severity === 'Error' ? 'danger' : issue.severity === 'Warning' ? 'warning' : 'info'} />
                    <p className="m-0 mt-2 text-sm leading-6 text-muted">{issue.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ShieldCheck} title="No validation issues" copy="Provider Manager validation currently reports no issues for this provider record." />
            )}
          </Section>

          <Section title="Recent Activity" eyebrow="Local timestamps">
            <Timeline items={[
              { id: 'created', title: 'Provider Created', meta: formatProviderDate(providerView.provider.createdAt), copy: providerView.provider.description },
              { id: 'updated', title: 'Provider Updated', meta: formatProviderDate(providerView.provider.updatedAt), copy: `Provider status is ${providerView.provider.status}.` },
              ...(providerView.health ? [{ id: providerView.health.id, title: 'Health Recorded', meta: formatProviderDate(providerView.health.lastCheckedAt), copy: providerView.health.notes || providerView.health.lastError || 'Health metadata recorded.' }] : []),
              ...providerView.models.slice(0, 5).map((model) => ({ id: model.id, title: `Model Registered · ${model.displayName}`, meta: formatProviderDate(model.updatedAt), copy: model.supportedCapabilities.join(', ') || 'No capabilities recorded.' })),
            ]} />
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <SectionHeader eyebrow={eyebrow} title={title} />
      {children}
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 break-words text-sm font-semibold text-white">{value || 'Not recorded'}</p>
    </div>
  )
}

function Timeline({ items }: { items: Array<{ id: string; title: string; meta: string; copy: string }> }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-line bg-ink/35 p-4">
          <div className="mb-2 flex items-center gap-2">
            <History size={14} className="text-muted" />
            <p className="m-0 text-sm font-semibold text-white">{item.title}</p>
          </div>
          <p className="m-0 text-xs text-muted">{item.meta}</p>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">{item.copy}</p>
        </div>
      ))}
    </div>
  )
}

