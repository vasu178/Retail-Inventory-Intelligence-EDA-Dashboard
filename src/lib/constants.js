/**
 * Shared analytical constants. Status names, colours and the project's inventory
 * thresholds live here so the UI and the calculations can never drift apart.
 */

export const STATUS = {
  CRITICAL: 'Critical',
  LOW_STOCK: 'Low Stock',
  HEALTHY: 'Healthy',
  OVERSTOCK: 'Overstock Candidate',
  NO_DEMAND: 'No Demand',
}

/** Display order used by every inventory-health visual. */
export const STATUS_ORDER = [
  STATUS.CRITICAL,
  STATUS.LOW_STOCK,
  STATUS.HEALTHY,
  STATUS.OVERSTOCK,
  STATUS.NO_DEMAND,
]

export const STATUS_COLORS = {
  [STATUS.CRITICAL]: '#E5737B',
  [STATUS.LOW_STOCK]: '#E0A458',
  [STATUS.HEALTHY]: '#6FBF8B',
  [STATUS.OVERSTOCK]: '#9B8FD6',
  [STATUS.NO_DEMAND]: '#8A93A0',
}

/** Short, factual explanation of each band (used in the RFC-free method notes). */
export const STATUS_RULES = {
  [STATUS.CRITICAL]: '< 3 days of cover',
  [STATUS.LOW_STOCK]: '3 to < 7 days of cover',
  [STATUS.HEALTHY]: '7 to 30 days of cover',
  [STATUS.OVERSTOCK]: '> 30 days of cover',
  [STATUS.NO_DEMAND]: 'no recorded demand',
}

/**
 * Project-defined thresholds for this portfolio dataset - not industry standards.
 */
export const THRESHOLDS = {
  criticalBelow: 3,
  lowBelow: 7,
  healthyMax: 30,
}

/** Illustrative replenishment policy: 5 day lead time plus 2 days of safety stock. */
export const POLICY = {
  leadTimeDays: 5,
  safetyStockDays: 2,
}

export const POLICY_DAYS = POLICY.leadTimeDays + POLICY.safetyStockDays

export const PAGE_SIZE = 10

export const MONTH_SHORT_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const ALL = 'all'
