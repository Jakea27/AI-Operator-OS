import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clapperboard,
  FileVideo2,
  FolderOpen,
  LoaderCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { StatusBadge } from '@/components/StatusBadge'
import {
  approveContentResult,
  contentFormatModules,
  contentProductionCoordinator,
  contentProductionStore,
  ensureContentResultApproval,
  findContentResultApproval,
  presentContentProductionJob,
  rejectContentResult,
  requestContentResultRevision,
  useContentProductionStore,
} from '@/src/core/contentProduction'
import type { ContentNarrationVoice, ContentProductionFootageReference } from '@/src/core/contentProduction'
import { useApprovalStore } from '@/src/features/approval/store/approvalStore'

const format = contentFormatModules['reddit-stories']
const stageOrder = ['Writing', 'Narrating', 'Rendering'] as const

type ReviewMode = 'revise' | 'reject'

function friendlyDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'The action could not be completed.'
}

export function ContentProductionPage() {
  const { jobs, createJob } = useContentProductionStore()
  const { approvals } = useApprovalStore()
  const currentJob = jobs[0]
  const currentResult = currentJob?.results.find((result) => result.resultId === currentJob.currentResultId)
  const approval = currentResult ? findContentResultApproval(currentResult, approvals) : undefined
  const presentation = currentJob ? presentContentProductionJob(currentJob, approval) : undefined
  const [showComposer, setShowComposer] = useState(!currentJob)
  const [topic, setTopic] = useState('')
  const [requirements, setRequirements] = useState('')
  const [footage, setFootage] = useState<ContentProductionFootageReference>()
  const [duration, setDuration] = useState(format.defaults.targetDurationSeconds)
  const [voiceId, setVoiceId] = useState('')
  const [style, setStyle] = useState('Conversational')
  const [voices, setVoices] = useState<ContentNarrationVoice[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  const [reviewMode, setReviewMode] = useState<ReviewMode>()
  const [decisionNote, setDecisionNote] = useState('')

  useEffect(() => {
    const bridge = window.operatorOS?.contentProduction
    if (!bridge) return
    let active = true
    bridge.listNarrationVoices()
      .then((availableVoices) => {
        if (active) setVoices(availableVoices)
      })
      .catch(() => {
        if (active) setMessage('Windows narration voices could not be loaded. The system default voice will be used.')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!currentJob || !currentResult || currentJob.runState !== 'Ready for Review') return
    ensureContentResultApproval(currentJob, currentResult)
  }, [currentJob, currentResult])

  const activeAttempt = currentJob?.attempts.find((attempt) => attempt.attemptId === currentJob.activeAttemptId)
  const latestAttempt = currentJob?.attempts[currentJob.attempts.length - 1]
  const media = latestAttempt?.media
  const previewUrl = currentResult && window.operatorOS?.contentProduction
    ? window.operatorOS.contentProduction.previewUrl(currentResult.outputFileName)
    : undefined

  const progressIndex = useMemo(() => {
    if (!currentJob || currentJob.runState !== 'Running') return -1
    return stageOrder.indexOf(currentJob.currentStage as typeof stageOrder[number])
  }, [currentJob])

  async function chooseFootage() {
    setMessage(undefined)
    const bridge = window.operatorOS?.contentProduction
    if (!bridge) {
      setMessage('Footage selection is available in the desktop application.')
      return
    }
    try {
      const result = await bridge.selectFootage()
      if (!result.canceled && result.footage) setFootage(result.footage)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  async function generate(event: FormEvent) {
    event.preventDefault()
    setMessage(undefined)
    if (!footage) {
      setMessage('Select prerecorded footage before generating the video.')
      return
    }
    const input = {
      topicOrSourceStory: topic,
      requirements,
      footage,
      targetDurationSeconds: duration,
      voiceId: voiceId || undefined,
      style: style || undefined,
    }
    const issues = format.validateInput(input)
    if (issues.length > 0) {
      setMessage(issues.join(' '))
      return
    }

    setBusy(true)
    try {
      const job = createJob(input)
      setShowComposer(false)
      const outcome = await contentProductionCoordinator.start(job.jobId)
      if (!outcome.success) setMessage('Video generation stopped. Review the failure below and retry when ready.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  async function retry() {
    if (!currentJob) return
    setBusy(true)
    setMessage(undefined)
    try {
      const outcome = await contentProductionCoordinator.retry(currentJob.jobId)
      if (!outcome.success) setMessage('The retry stopped before completion. The failure details remain below.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  function approve() {
    if (!approval) return
    try {
      approveContentResult(approval)
      setMessage('Video approved. Nothing was published or sent.')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  function saveDecision() {
    if (!approval || !reviewMode) return
    try {
      if (reviewMode === 'revise') {
        requestContentResultRevision(approval, decisionNote)
        setMessage('Revision instructions saved. Generate the revision when you are ready.')
      } else {
        rejectContentResult(approval, decisionNote)
        setMessage('Video rejected. The result remains preserved and nothing was published.')
      }
      setReviewMode(undefined)
      setDecisionNote('')
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  async function generateRevision() {
    if (!currentJob || approval?.status !== 'Changes Requested' || !approval.decisionNote) return
    setBusy(true)
    setMessage(undefined)
    try {
      const outcome = await contentProductionCoordinator.revise(currentJob.jobId, approval.decisionNote)
      if (!outcome.success) setMessage('The revision stopped before completion. Retry it manually when ready.')
    } catch (error) {
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  function createAnother() {
    setTopic('')
    setRequirements('')
    setFootage(undefined)
    setDuration(format.defaults.targetDurationSeconds)
    setVoiceId('')
    setStyle('Conversational')
    setMessage(undefined)
    setReviewMode(undefined)
    setDecisionNote('')
    setShowComposer(true)
  }

  async function revealOutput() {
    if (!currentResult) return
    try {
      await window.operatorOS?.contentProduction.revealOutput(currentResult.outputFileName)
    } catch (error) {
      setMessage(errorText(error))
    }
  }

  return (
    <div className="space-y-7">
      <PageIntro
        eyebrow="Create content"
        title="Reddit Stories"
        description="Give AO the story and reusable footage. It will write, narrate, caption, and render one finished vertical video for your review."
        action={currentJob && !showComposer && currentJob.runState !== 'Running'
          ? <button type="button" className="btn-secondary" onClick={createAnother}><Sparkles size={16} /> Create another video</button>
          : undefined}
      />

      {message && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-[#ffcc66]/25 bg-[#ffcc66]/[0.07] px-4 py-3 text-sm text-[#ffdc8f]">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {showComposer || !currentJob ? (
        <form className="panel overflow-hidden" onSubmit={generate}>
          <div className="border-b border-line px-6 py-5">
            <p className="eyebrow mb-2">One video · one job</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">What should AO create?</h3>
            <p className="mb-0 mt-2 text-sm leading-6 text-muted">Reddit Stories uses your source, instructions, and prerecorded footage. Nothing is published automatically.</p>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Topic or source story <span className="text-lime">*</span></span>
                <textarea className="field min-h-40 resize-y" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Paste the source story or describe the topic you want turned into a video." maxLength={12000} required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Requirements <span className="text-lime">*</span></span>
                <textarea className="field min-h-28 resize-y" value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="What should the video emphasize, avoid, or make the viewer feel?" maxLength={4000} required />
              </label>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-white">Prerecorded footage <span className="text-lime">*</span></p>
                <button type="button" className="btn-secondary w-full" onClick={chooseFootage} disabled={busy}>
                  <FileVideo2 size={16} /> {footage ? 'Change footage' : 'Select footage'}
                </button>
                <div className="mt-2 min-h-11 rounded-xl border border-line bg-ink/40 px-3 py-2 text-xs text-muted">
                  {footage ? <span className="flex items-center gap-2 text-[#dce7df]"><CheckCircle2 size={14} className="text-lime" /> {footage.displayName}</span> : 'MP4, MOV, M4V, WebM, or AVI'}
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Target duration</span>
                <div className="relative">
                  <input className="field pr-20" type="number" min={15} max={180} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">seconds</span>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Narration voice</span>
                <select className="field" value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
                  <option value="">System default</option>
                  {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name} · {voice.culture}</option>)}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-white">Style</span>
                <select className="field" value={style} onChange={(event) => setStyle(event.target.value)}>
                  <option>Conversational</option>
                  <option>Suspenseful</option>
                  <option>Fast-paced</option>
                  <option>Calm</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-line bg-ink/25 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 max-w-xl text-xs leading-5 text-muted">AO will create the script, narration, synchronized captions, footage timing, and finished MP4. You remain the final decision-maker.</p>
            <button type="submit" className="btn-primary shrink-0" disabled={busy}>
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Play size={17} fill="currentColor" />}
              Generate Video
            </button>
          </div>
        </form>
      ) : (
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow mb-2">Current video</p>
              <h3 className="m-0 font-display text-xl font-semibold text-white">{presentation?.heading}</h3>
              <p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-muted">{presentation?.statusMessage}</p>
            </div>
            {presentation && <StatusBadge label={presentation.statusLabel} tone={presentation.tone} />}
          </div>

          {currentJob.runState === 'Running' && (
            <div className="border-b border-line px-6 py-6">
              <div className="grid gap-3 md:grid-cols-3">
                {stageOrder.map((stage, index) => {
                  const complete = index < progressIndex
                  const active = index === progressIndex
                  return (
                    <div key={stage} className={`rounded-2xl border p-4 ${active ? 'border-lime/40 bg-lime/[0.07]' : complete ? 'border-mint/25 bg-mint/[0.04]' : 'border-line bg-ink/30'}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Step {index + 1}</span>
                        {complete ? <Check size={16} className="text-mint" /> : active ? <LoaderCircle size={16} className="animate-spin text-lime" /> : <span className="h-2 w-2 rounded-full bg-line" />}
                      </div>
                      <p className={`m-0 text-sm font-semibold ${active ? 'text-lime' : complete ? 'text-mint' : 'text-[#7f8b85]'}`}>{stage}</p>
                    </div>
                  )
                })}
              </div>
              <p className="mb-0 mt-4 text-center text-xs text-muted">Keep AI Operator OS open while the video is being created.</p>
            </div>
          )}

          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-ink/35 p-4">
                <p className="eyebrow mb-2">Source</p>
                <p className="m-0 line-clamp-5 text-sm leading-6 text-[#dce7df]">{currentJob.input.topicOrSourceStory}</p>
              </div>
              <div className="rounded-2xl border border-line bg-ink/35 p-4">
                <p className="eyebrow mb-2">Production setup</p>
                <dl className="m-0 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3"><dt className="text-muted">Footage</dt><dd className="m-0 truncate text-right text-white">{currentJob.input.footage.displayName}</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-muted">Target</dt><dd className="m-0 text-white">{currentJob.input.targetDurationSeconds ?? format.defaults.targetDurationSeconds} seconds</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-muted">Style</dt><dd className="m-0 text-white">{currentJob.input.style || 'Default'}</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-muted">Started</dt><dd className="m-0 text-right text-white">{friendlyDate(currentJob.createdAt)}</dd></div>
                </dl>
              </div>
              {currentJob.runState === 'Failed' && latestAttempt?.error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-400/[0.08] p-4">
                  <div className="flex items-center gap-2 text-red-200"><AlertTriangle size={16} /><strong className="text-sm">{latestAttempt.error.stage} failed</strong></div>
                  <p className="mb-0 mt-2 text-xs leading-5 text-red-100/80">{latestAttempt.error.message}</p>
                  <button type="button" className="btn-secondary mt-4" onClick={retry} disabled={busy}><RefreshCw size={16} /> Retry video</button>
                </div>
              )}
            </div>

            <div>
              {previewUrl && currentResult ? (
                <div className="space-y-4">
                  <div className="mx-auto max-w-[380px] overflow-hidden rounded-2xl border border-line bg-black shadow-glow">
                    <video key={previewUrl} className="aspect-[9/16] w-full bg-black object-contain" controls preload="metadata" src={previewUrl} aria-label={`Finished Reddit Stories video version ${currentResult.version}`} />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
                    <span>Version {currentResult.version}</span><span>·</span>
                    <span>{Math.round(currentResult.durationSeconds)} seconds</span><span>·</span>
                    <span>{currentResult.width} × {currentResult.height}</span>
                    <button type="button" className="inline-flex items-center gap-1.5 font-semibold text-lime hover:text-white" onClick={revealOutput}><FolderOpen size={14} /> Show file</button>
                  </div>
                  {currentJob.runState === 'Failed' && <p className="text-center text-xs text-[#ffdc8f]">This is the previous completed version. The latest attempt failed and remains available to retry.</p>}
                </div>
              ) : (
                <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-line bg-ink/25 px-6 text-center">
                  <div>
                    {currentJob.runState === 'Running' ? <LoaderCircle size={32} className="mx-auto animate-spin text-lime" /> : <Clapperboard size={32} className="mx-auto text-muted" />}
                    <p className="mb-0 mt-3 text-sm font-semibold text-white">{currentJob.runState === 'Running' ? activeAttempt?.stage || 'Creating video' : 'No finished preview yet'}</p>
                    <p className="mx-auto mb-0 mt-2 max-w-sm text-xs leading-5 text-muted">The finished video will appear here automatically when rendering completes.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentJob.runState === 'Ready for Review' && approval && (
            <div className="border-t border-line bg-ink/25 px-6 py-5">
              {approval.status === 'Pending' && !reviewMode && (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">What do you want to do with this version?</p>
                    <p className="mb-0 mt-1 text-xs text-muted">Your decision is saved. Approval does not publish or send the video.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-primary" onClick={approve}><CheckCircle2 size={16} /> Approve</button>
                    <button type="button" className="btn-secondary" onClick={() => setReviewMode('revise')}><RotateCcw size={16} /> Revise</button>
                    <button type="button" className="btn-danger" onClick={() => setReviewMode('reject')}><X size={16} /> Reject</button>
                  </div>
                </div>
              )}

              {reviewMode && (
                <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-panel p-5">
                  <h4 className="m-0 text-base font-semibold text-white">{reviewMode === 'revise' ? 'What should AO change?' : 'Reject this version?'}</h4>
                  <p className="mb-0 mt-2 text-xs leading-5 text-muted">{reviewMode === 'revise' ? 'Written instructions are required. Saving them does not start AI work until you choose Generate Revision.' : 'A reason is optional. The result remains preserved in history.'}</p>
                  <textarea className="field mt-4 min-h-28 resize-y" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder={reviewMode === 'revise' ? 'Describe the exact changes you need.' : 'Optional rejection reason'} />
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="btn-secondary" onClick={() => { setReviewMode(undefined); setDecisionNote('') }}>Cancel</button>
                    <button type="button" className={reviewMode === 'reject' ? 'btn-danger' : 'btn-primary'} onClick={saveDecision} disabled={reviewMode === 'revise' && !decisionNote.trim()}>{reviewMode === 'revise' ? 'Save revision request' : 'Confirm rejection'}</button>
                  </div>
                </div>
              )}

              {approval.status === 'Changes Requested' && (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="m-0 text-sm font-semibold text-white">Revision instructions</p>
                    <p className="mb-0 mt-2 text-sm leading-6 text-[#cbd5d0]">{approval.decisionNote}</p>
                  </div>
                  <button type="button" className="btn-primary shrink-0" onClick={generateRevision} disabled={busy}><RotateCcw size={16} /> Generate Revision</button>
                </div>
              )}

              {(approval.status === 'Approved' || approval.status === 'Rejected') && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">Decision saved: {approval.status}</p>
                    <p className="mb-0 mt-1 text-xs text-muted">{approval.decisionNote}</p>
                  </div>
                  <button type="button" className="btn-secondary" onClick={createAnother}><Sparkles size={16} /> Create another video</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="flex items-center justify-center gap-2 text-center text-[11px] text-muted">
        <Clapperboard size={13} /> Local production only · No publishing or external platform action
      </div>
    </div>
  )
}
