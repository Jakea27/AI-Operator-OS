import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { CEO } from '@/pages/CEO'
import { Money } from '@/pages/Money'
import { Development } from '@/pages/Development'
import { ApprovalQueuePage } from '@/src/features/approval'
import { MemoryPage } from '@/src/features/memory/MemoryPage'
import { OperatorDetail } from '@/src/features/operators/OperatorDetail'
import { OperatorsPage } from '@/src/features/operators/OperatorsPage'
import { OpportunityDetailPage, OpportunityPipelinePage } from '@/src/features/opportunities'
import { Roadmap } from '@/pages/Roadmap'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="ceo" element={<CEO />} />
        <Route path="money" element={<Money />} />
        <Route path="opportunities" element={<OpportunityPipelinePage />} />
        <Route path="opportunities/:opportunityId" element={<OpportunityDetailPage />} />
        <Route path="development" element={<Development />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="operators" element={<OperatorsPage />} />
        <Route path="operators/:operatorId" element={<OperatorDetail />} />
        <Route path="approval" element={<ApprovalQueuePage />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
