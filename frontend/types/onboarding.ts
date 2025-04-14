export interface OnboardingFormData {
  // Personal & Company Info
  name: string;
  companyName: string;
  country: string;
  registrationNumber: string; // CNPJ or equivalent
  companySize: string;
  industry: string;
  companyDescription: string;

  // Emissions Related
  hasEmissionsHistory: boolean;
  primaryEmissionSources: string[];
  annualEmissions?: number;
  emissionsReductionGoal?: number;
  sustainabilityPrograms: string[];
  offsettingExperience: string;
}

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  isValid: (data: Partial<OnboardingFormData>) => boolean;
};
