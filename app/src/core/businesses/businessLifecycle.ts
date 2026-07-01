import { BusinessStatus } from './businessTypes'

export const businessStatuses: BusinessStatus[] = [
  'Building',
  'Launching',
  'Operating',
  'Optimizing',
  'Scaling',
  'Paused',
  'Archived',
]

export function getBusinessStatusIndex(status: BusinessStatus) {
  return Math.max(0, businessStatuses.indexOf(status))
}

export function getBusinessLifecycleProgress(status: BusinessStatus) {
  const index = getBusinessStatusIndex(status)
  return Math.round((index / (businessStatuses.length - 1)) * 100)
}

