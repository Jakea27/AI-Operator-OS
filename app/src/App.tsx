import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { CEO } from '@/pages/CEO'
import { Money } from '@/pages/Money'
import { Development } from '@/pages/Development'
import { ApprovalQueuePage } from '@/src/features/approval'
import { BusinessDetailPage, BusinessesPage } from '@/src/features/businesses'
import { CapabilityPlanDetailPage, CapabilityPlanningPage } from '@/src/features/capabilityPlanning'
import { CompanyStructurePage, DepartmentDetailPage } from '@/src/features/companyStructure'
import { MemoryPage } from '@/src/features/memory/MemoryPage'
import { OperatorDetail } from '@/src/features/operators/OperatorDetail'
import { OperatorsPage } from '@/src/features/operators/OperatorsPage'
import { OpportunityDetailPage, OpportunityPipelinePage } from '@/src/features/opportunities'
import { ProjectDetailPage, ProjectsPage } from '@/src/features/projects'
import { ProviderDashboardPage, ProviderDetailPage } from '@/src/features/providers'
import { Roadmap } from '@/pages/Roadmap'
import { Settings } from '@/pages/Settings'
import { WorkItemDetailPage } from '@/src/features/workItems/WorkItemDetailPage'
import { WorkItemsPage } from '@/src/features/workItems/WorkItemsPage'
import { ExecutionQueueDetailPage } from '@/src/features/executionQueue/ExecutionQueueDetailPage'
import { ExecutionQueuePage } from '@/src/features/executionQueue/ExecutionQueuePage'
import { ExecutionDashboardPage } from '@/src/features/execution/ExecutionDashboardPage'
import { ExecutionDetailPage } from '@/src/features/execution/ExecutionDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="ceo" element={<CEO />} />
        <Route path="money" element={<Money />} />
        <Route path="opportunities" element={<OpportunityPipelinePage />} />
        <Route path="opportunities/:opportunityId" element={<OpportunityDetailPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="businesses/:businessId" element={<BusinessDetailPage />} />
        <Route path="company-structure" element={<CompanyStructurePage />} />
        <Route path="company-structure/departments/:departmentId" element={<DepartmentDetailPage />} />
        <Route path="development" element={<Development />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="operators" element={<OperatorsPage />} />
        <Route path="operators/:operatorId" element={<OperatorDetail />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="work-items" element={<WorkItemsPage />} />
        <Route path="work-items/:workItemId" element={<WorkItemDetailPage />} />
        <Route path="execution-queue" element={<ExecutionQueuePage />} />
        <Route path="execution-queue/:queueItemId" element={<ExecutionQueueDetailPage />} />
        <Route path="executions" element={<ExecutionDashboardPage />} />
        <Route path="executions/:executionId" element={<ExecutionDetailPage />} />
        <Route path="providers" element={<ProviderDashboardPage />} />
        <Route path="providers/:providerRecordId" element={<ProviderDetailPage />} />
        <Route path="capability-planning" element={<CapabilityPlanningPage />} />
        <Route path="capability-planning/:capabilityPlanId" element={<CapabilityPlanDetailPage />} />
        <Route path="approval" element={<ApprovalQueuePage />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
