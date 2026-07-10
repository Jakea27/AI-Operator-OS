export type CapabilityCatalogItem = {
  name: string
  category: string
}

export const capabilityCatalog: CapabilityCatalogItem[] = [
  { name: 'Reasoning', category: 'AI' },
  { name: 'Writing', category: 'AI' },
  { name: 'Coding', category: 'AI' },
  { name: 'Web Search', category: 'Research' },
  { name: 'Browser', category: 'Research' },
  { name: 'Vision', category: 'AI' },
  { name: 'Image Generation', category: 'Creative' },
  { name: 'Voice', category: 'Media' },
  { name: 'Email', category: 'Communication' },
  { name: 'PDF', category: 'Documents' },
  { name: 'Spreadsheet', category: 'Documents' },
  { name: 'File System', category: 'System' },
  { name: 'Terminal', category: 'System' },
  { name: 'GitHub', category: 'Development' },
  { name: 'Maps', category: 'Location' },
  { name: 'CRM', category: 'Sales' },
  { name: 'Calendar', category: 'Operations' },
  { name: 'Database', category: 'Data' },
  { name: 'Payment Processing', category: 'Finance' },
]

export const permissionCatalog = [
  'Internet Access',
  'Local File Access',
  'Repository Access',
  'Email Sending',
  'Calendar Access',
  'Payment Access',
  'External Account Access',
]

export const operatorRoleCatalog = [
  'Research Operator',
  'Writing Operator',
  'Coding Operator',
  'Website Builder Operator',
  'Sales Operator',
  'Review Operator',
]
