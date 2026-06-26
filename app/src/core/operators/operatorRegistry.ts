import { AIOperator } from './operatorTypes'

const createdAt = '2026-06-26T00:00:00.000Z'

export const initialOperators: AIOperator[] = [
  {
    id: 'cto',
    name: 'CTO Operator',
    role: 'Technology and architecture operator',
    mission: 'Keep AI Operator OS technically reliable, coherent, and ready for safe automation.',
    responsibilities: [
      'Maintain architecture quality',
      'Track technical risks',
      'Translate roadmap items into implementation tasks',
      'Protect the one-codebase rule',
    ],
    availableTools: ['Business Memory', 'Sprint Tasks', 'Project Records', 'Daily Briefing', 'Approval Queue'],
    memoryAccess: {
      canReadBusinessMemory: true,
      preferredTypes: ['Architecture', 'Decision', 'Bug', 'Sprint', 'SOP'],
      preferredCategories: ['Development', 'Automation', 'AI', 'Product'],
      notes: 'Reads architecture decisions, bugs, sprint notes, and development SOPs.',
    },
    approvalLevel: 'CEO Required',
    currentStatus: 'Idle',
    currentTask: null,
    taskQueue: [
      {
        id: 'cto-task-architecture-review',
        title: 'Review AO-004 architecture boundaries',
        description: 'Confirm operator framework remains local-first and does not duplicate app state.',
        priority: 'High',
        status: 'queued',
        createdAt,
        source: 'system',
        requiresApproval: false,
      },
    ],
    recommendationHistory: [
      {
        id: 'cto-rec-001',
        title: 'Shared-context operator architecture',
        summary: 'Keep operators as shared-context domain workers, not isolated chatbots.',
        rationale: 'The OS needs reusable business operators that consume the same Money, Memory, Dashboard, and Briefing services.',
        createdAt,
        source: 'AO-004.1 framework design',
        status: 'Draft',
        confidence: 'High',
        riskLevel: 'Low',
        requiresApproval: false,
      },
    ],
  },
  {
    id: 'cfo',
    name: 'CFO Operator',
    role: 'Finance and unit economics operator',
    mission: 'Protect cash flow, watch profitability, and surface financial decisions that need CEO approval.',
    responsibilities: [
      'Monitor revenue and expenses',
      'Flag margin or cost risks',
      'Review financial approvals',
      'Summarize money performance for briefing',
    ],
    availableTools: ['Money Metrics', 'Approval Queue', 'Daily Briefing', 'Business Memory'],
    memoryAccess: {
      canReadBusinessMemory: true,
      preferredTypes: ['Decision', 'Business Rule', 'Research', 'Knowledge'],
      preferredCategories: ['Finance', 'Strategy', 'Operations'],
      notes: 'Reads finance rules, pricing decisions, cost constraints, and financial research.',
    },
    approvalLevel: 'CEO Required',
    currentStatus: 'Idle',
    currentTask: null,
    taskQueue: [
      {
        id: 'cfo-task-monthly-watch',
        title: 'Watch monthly profit margin',
        description: 'Use local Money Department records to flag negative margin or unusual cost growth.',
        priority: 'High',
        status: 'queued',
        createdAt,
        source: 'system',
        requiresApproval: false,
      },
    ],
    recommendationHistory: [],
  },
  {
    id: 'cmo',
    name: 'CMO Operator',
    role: 'Marketing and growth operator',
    mission: 'Turn business context into local-first marketing priorities without sending outreach automatically.',
    responsibilities: [
      'Track marketing ideas',
      'Prepare campaign recommendations',
      'Connect customer research to offers',
      'Send high-impact campaigns to approval first',
    ],
    availableTools: ['Business Memory', 'Approval Queue', 'Local Research Notes', 'Daily Briefing'],
    memoryAccess: {
      canReadBusinessMemory: true,
      preferredTypes: ['Idea', 'Research', 'Decision', 'Business Rule'],
      preferredCategories: ['Marketing', 'Sales', 'Product', 'Research'],
      notes: 'Reads marketing ideas, research, sales notes, and product positioning decisions.',
    },
    approvalLevel: 'CEO Required',
    currentStatus: 'Waiting',
    currentTask: null,
    taskQueue: [
      {
        id: 'cmo-task-offer-context',
        title: 'Collect offer and audience context',
        description: 'Wait for memory entries that define target market, offer, and positioning.',
        priority: 'Medium',
        status: 'waiting',
        createdAt,
        source: 'system',
        requiresApproval: false,
      },
    ],
    recommendationHistory: [],
  },
  {
    id: 'coo',
    name: 'COO Operator',
    role: 'Operations and execution operator',
    mission: 'Keep projects, tasks, approvals, and operating cadence moving through the local OS.',
    responsibilities: [
      'Monitor sprint progress',
      'Track blocked tasks',
      'Coordinate approval queue visibility',
      'Convert operating rules into repeatable SOPs',
    ],
    availableTools: ['Sprint Tasks', 'Project Records', 'Approval Queue', 'Business Memory', 'Daily Briefing'],
    memoryAccess: {
      canReadBusinessMemory: true,
      preferredTypes: ['SOP', 'Sprint', 'Business Rule', 'Issue'],
      preferredCategories: ['Operations', 'Development', 'Automation', 'Strategy'],
      notes: 'Reads SOPs, sprint notes, operating issues, and durable process rules.',
    },
    approvalLevel: 'Medium',
    currentStatus: 'Idle',
    currentTask: null,
    taskQueue: [
      {
        id: 'coo-task-approval-visibility',
        title: 'Keep approval queue visible',
        description: 'Surface pending approvals and blocked work before execution expands.',
        priority: 'High',
        status: 'queued',
        createdAt,
        source: 'system',
        requiresApproval: false,
      },
    ],
    recommendationHistory: [],
  },
  {
    id: 'research',
    name: 'Research Operator',
    role: 'Research and opportunity operator',
    mission: 'Organize local research, questions, and evidence so future AI work starts with context.',
    responsibilities: [
      'Collect research questions',
      'Summarize local research memories',
      'Identify evidence gaps',
      'Prepare research briefs for CEO review',
    ],
    availableTools: ['Business Memory', 'Local Research Notes', 'Daily Briefing', 'Approval Queue'],
    memoryAccess: {
      canReadBusinessMemory: true,
      preferredTypes: ['Research', 'Idea', 'Knowledge', 'Decision'],
      preferredCategories: ['Research', 'Product', 'Marketing', 'AI', 'Strategy'],
      notes: 'Reads research notes, knowledge entries, ideas, and evidence-linked decisions.',
    },
    approvalLevel: 'Low',
    currentStatus: 'Idle',
    currentTask: null,
    taskQueue: [
      {
        id: 'research-task-gap-map',
        title: 'Map open research gaps',
        description: 'Use local Business Memory to identify unanswered questions before AO-004 reasoning is added.',
        priority: 'Medium',
        status: 'queued',
        createdAt,
        source: 'system',
        requiresApproval: false,
      },
    ],
    recommendationHistory: [],
  },
]

export function getRegisteredOperators() {
  return initialOperators
}

export function getOperatorById(id: string) {
  return initialOperators.find((operator) => operator.id === id)
}
