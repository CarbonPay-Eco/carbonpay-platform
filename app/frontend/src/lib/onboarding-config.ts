import type { OnboardingStep } from "../../types/onboarding"

export const COMPANY_SIZE_OPTIONS = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
]

export const INDUSTRY_OPTIONS = [
  "Technology",
  "Manufacturing",
  "Energy",
  "Transportation",
  "Agriculture",
  "Construction",
  "Healthcare",
  "Retail",
  "Financial Services",
  "Other",
]

export const EMISSION_SOURCES = [
  "Electricity consumption",
  "Transportation fleet",
  "Manufacturing processes",
  "Business travel",
  "Supply chain",
  "Waste management",
  "Building operations",
  "Employee commuting",
]

export const SUSTAINABILITY_PROGRAMS = [
  "ISO 14001 certification",
  "Carbon disclosure project (CDP)",
  "Science-based targets initiative",
  "Internal sustainability programs",
  "Green building certification",
  "Renewable energy procurement",
  "None currently",
]

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Let's start with your basic information",
    isValid: (data) => Boolean(data.name),
  },
  {
    id: "company",
    title: "Company Details",
    description: "Tell us about your company",
    isValid: (data) => Boolean(data.companyName && data.country && data.registrationNumber),
  },
  {
    id: "company-context",
    title: "Company Context",
    description: "Help us understand your business better",
    isValid: (data) => Boolean(data.industry && data.companySize && data.companyDescription),
  },
  {
    id: "emissions-basic",
    title: "Emissions Overview",
    description: "Let's understand your current emissions situation",
    isValid: (data) => data.hasEmissionsHistory !== undefined && Boolean(data.primaryEmissionSources?.length),
  },
  {
    id: "emissions-detail",
    title: "Emissions Details",
    description: "More specific information about your emissions",
    isValid: (data) => Boolean(data.sustainabilityPrograms?.length && data.offsettingExperience),
  },
]

