import { CompanyStructureTemplate, DepartmentName } from './companyStructureTypes'

export const departmentNames: DepartmentName[] = [
  'CEO',
  'Research',
  'Development',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Customer Success',
  'Administration',
  'Content',
]

export const companyStructureTemplates: CompanyStructureTemplate[] = [
  {
    id: 'youtube-business',
    name: 'YouTube Business',
    description: 'Content-led business structure with production, growth, monetization, and operations coverage.',
    departments: ['CEO', 'Research', 'Content', 'Marketing', 'Finance', 'Operations', 'Administration'],
  },
  {
    id: 'ecommerce',
    name: 'Ecommerce',
    description: 'Commerce operating structure for product, sales, customer success, finance, and operations.',
    departments: ['CEO', 'Research', 'Marketing', 'Sales', 'Finance', 'Operations', 'Customer Success', 'Administration'],
  },
  {
    id: 'saas',
    name: 'SaaS',
    description: 'Software business structure for product development, growth, finance, support, and operations.',
    departments: ['CEO', 'Research', 'Development', 'Marketing', 'Sales', 'Finance', 'Operations', 'Customer Success', 'Administration'],
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Service business structure for sales, delivery, operations, finance, and client success.',
    departments: ['CEO', 'Research', 'Marketing', 'Sales', 'Finance', 'Operations', 'Customer Success', 'Administration'],
  },
  {
    id: 'general-business',
    name: 'General Business',
    description: 'Flexible default structure for businesses that do not yet fit a specialized template.',
    departments: ['CEO', 'Research', 'Development', 'Marketing', 'Sales', 'Finance', 'Operations', 'Administration'],
  },
]

export function getCompanyStructureTemplate(templateId: string) {
  return companyStructureTemplates.find((template) => template.id === templateId) ?? companyStructureTemplates[4]
}

