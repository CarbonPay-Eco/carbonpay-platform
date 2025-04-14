export interface Project {
  id: string
  name: string
  type: "Solar Energy" | "Preservation" | string
  location: string
  image: string
  pricePerTon: number
  totalCapacity?: number
  availableCapacity: number
  code: string
  description?: string
}

export interface CarbonCredit {
  id: string
  projectId: string
  totalAmount: number
  availableAmount: number
  usedAmount: number
  purchaseDate: Date
}

export interface Emission {
  id: string
  source: string
  amount: number
  date: Date
  offset: number
  projectName: string
}

export interface KeyMetrics {
  totalOffset: number
  creditsAvailable: number
  emissionsOffset: number
  totalEmissions: number
}

