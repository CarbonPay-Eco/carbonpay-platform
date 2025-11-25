"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Building2,
  Briefcase,
  BarChart2,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPANY_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
  EMISSION_SOURCES,
  SUSTAINABILITY_PROGRAMS,
  onboardingSteps,
} from "@/lib/onboarding-config";
import type { OnboardingFormData } from "../../../../types/onboarding";
import {
  registerUserDraft,
  completeUserRegistration,
  loginUser,
} from "../../api/user-service";
import { useAuth } from "../../context/AuthContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const draftTokenRef = useRef<string | null>(null);

  const currentStepConfig = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isStepValid = currentStepConfig.isValid(formData);

  const handleInputChange = (
    field: keyof OnboardingFormData,
    value: string | string[] | boolean | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = async () => {
    if (isAnimating || !isStepValid) return;

    console.log("=== ONBOARDING DEBUG ===");
    console.log("Current step:", currentStep);
    console.log("Form data:", formData);
    console.log("Is last step:", isLastStep);

    // Registration step - create draft user
    if (currentStep === 0) {
      try {
        console.log("Creating draft user with:", {
          email: formData.email,
          password: "***",
        });

        const regResult = await registerUserDraft({
          email: formData.email!,
          password: formData.password!,
        });

        console.log("Draft registration result:", regResult);

        if (!regResult.success) {
          console.error("Registration error:", regResult.message);
          alert(`Registration failed: ${regResult.message}`);
          return;
        }
        // Salva o token retornado do draft
        draftTokenRef.current =
          regResult.data?.data?.token || regResult.data?.token;
        // Draft user created successfully, continue to next step
      } catch (err) {
        console.error("Registration error:", err);
        alert(`Registration failed: ${err}`);
        return;
      }
    }

    if (isLastStep) {
      try {
        console.log("Completing registration with data:", {
          email: formData.email,
          fullName: formData.name,
          companyName: formData.companyName,
          country: formData.country,
          registrationNumber: formData.registrationNumber,
          industryType: formData.industry,
          companySize: formData.companySize,
          description: formData.companyDescription,
          tracksEmissions: formData.hasEmissionsHistory,
          emissionSources: formData.primaryEmissionSources,
          sustainabilityCertifications: formData.sustainabilityPrograms,
          priorOffsetting: formData.offsettingExperience === "extensive",
          contactEmail: formData.contactEmail,
          websiteUrl: formData.websiteUrl,
          acceptedTerms: !!formData.acceptedTerms,
        });

        // Complete the user registration with all data
        const result = await completeUserRegistration(
          {
            email: formData.email!,
            fullName: formData.name!,
            companyName: formData.companyName!,
            country: formData.country!,
            registrationNumber: formData.registrationNumber,
            industryType: formData.industry,
            companySize: formData.companySize,
            description: formData.companyDescription,
            tracksEmissions: formData.hasEmissionsHistory,
            emissionSources: formData.primaryEmissionSources,
            sustainabilityCertifications: formData.sustainabilityPrograms,
            priorOffsetting: formData.offsettingExperience !== "never",
            contactEmail: formData.contactEmail,
            websiteUrl: formData.websiteUrl,
            acceptedTerms: !!formData.acceptedTerms,
          },
          draftTokenRef.current || undefined
        );

        console.log("Complete registration result:", result);

        if (result.success) {
          // Use auth context to log in the user after successful registration
          const token = result.data?.token || result.data?.data?.token;
          console.log("Token received:", token);

          if (token) {
            login(token);
            router.push("/webapp/dashboard");
          } else {
            console.error("No token received after registration completion");
            alert(
              "Registration completed but no login token received. Please try logging in manually."
            );
          }
        } else {
          console.error("Error completing registration:", result.message);
          alert(`Registration failed: ${result.message}`);
        }
      } catch (error) {
        console.error("Error during registration completion:", error);
        alert(`Registration failed: ${error}`);
      }
      return;
    }

    setIsAnimating(true);
    setCurrentStep((prev) => prev + 1);
    scrollToTop();
  };

  const handleBack = () => {
    if (isAnimating || currentStep === 0) return;
    setIsAnimating(true);
    setCurrentStep((prev) => prev - 1);
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(50% 50% at 50% 0%, #05A94F 0%, transparent 100%)`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 py-8">
        {/* Progress indicator with topic icons */}
        <div className="fixed right-8 top-1/2 -translate-y-1/2 space-y-6">
          {onboardingSteps.map((step, index) => {
            // Select icon based on step ID
            let StepIcon = User;
            let tooltipText = "Personal Information";

            if (step.id === "company") {
              StepIcon = Building2;
              tooltipText = "Company Details";
            } else if (step.id === "company-context") {
              StepIcon = Briefcase;
              tooltipText = "Company Context";
            } else if (step.id === "emissions-basic") {
              StepIcon = BarChart2;
              tooltipText = "Emissions Overview";
            } else if (step.id === "emissions-detail") {
              StepIcon = Leaf;
              tooltipText = "Emissions Details";
            }

            return (
              <div key={step.id} className="relative group">
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "bg-green-600 ring-2 ring-green-300 ring-opacity-50"
                      : index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-800 hover:bg-gray-700"
                  )}
                >
                  <StepIcon
                    className={cn(
                      "h-5 w-5",
                      index === currentStep || index < currentStep
                        ? "text-white"
                        : "text-gray-400"
                    )}
                  />
                </div>

                {/* Tooltip */}
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {tooltipText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div ref={containerRef} className="mx-auto max-w-2xl">
          <AnimatePresence
            mode="wait"
            onExitComplete={() => setIsAnimating(false)}
          >
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-black/60 backdrop-blur-md">
                <div className="p-6">
                  <h2 className="text-2xl font-bold">
                    {currentStepConfig.title}
                  </h2>
                  <p className="mt-2 text-gray-400">
                    {currentStepConfig.description}
                  </p>

                  <div className="mt-8 space-y-6">
                    {/* Step 0: Registration */}
                    {currentStep === 0 && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password || ""}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "confirmPassword",
                                e.target.value
                              )
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Confirm your password"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="acceptedTerms"
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id="acceptedTerms"
                              checked={!!formData.acceptedTerms}
                              onCheckedChange={(checked) =>
                                handleInputChange("acceptedTerms", !!checked)
                              }
                              className="mr-2"
                            />
                            <span>I accept the terms and conditions</span>
                          </Label>
                        </div>
                        <div className="pt-2">
                          <span className="text-sm text-gray-400">
                            Already have an account?{" "}
                          </span>
                          <a
                            href="/webapp/login"
                            className="text-green-400 hover:underline"
                          >
                            Login
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">What's your name?</Label>
                          <Input
                            id="name"
                            value={formData.name || ""}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={formData.contactEmail || ""}
                            onChange={(e) =>
                              handleInputChange("contactEmail", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your contact email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="websiteUrl">Website URL</Label>
                          <Input
                            id="websiteUrl"
                            type="url"
                            value={formData.websiteUrl || ""}
                            onChange={(e) =>
                              handleInputChange("websiteUrl", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your website URL"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Company Details */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName || ""}
                            onChange={(e) =>
                              handleInputChange("companyName", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your company name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country || ""}
                            onChange={(e) =>
                              handleInputChange("country", e.target.value)
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your country"
                          />
                        </div>
                        <div>
                          <Label htmlFor="registrationNumber">
                            Company Registration Number (CNPJ)
                          </Label>
                          <Input
                            id="registrationNumber"
                            value={formData.registrationNumber || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "registrationNumber",
                                e.target.value
                              )
                            }
                            className="mt-2 bg-black/50 border-white/20"
                            placeholder="Enter your CNPJ"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Company Context */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="industry">Industry</Label>
                          <Select
                            value={formData.industry}
                            onValueChange={(value) =>
                              handleInputChange("industry", value)
                            }
                          >
                            <SelectTrigger className="mt-2 bg-black/50 border-white/20">
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRY_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="companySize">Company Size</Label>
                          <Select
                            value={formData.companySize}
                            onValueChange={(value) =>
                              handleInputChange("companySize", value)
                            }
                          >
                            <SelectTrigger className="mt-2 bg-black/50 border-white/20">
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_SIZE_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="companyDescription">
                            Brief description of your company's activities
                          </Label>
                          <Textarea
                            id="companyDescription"
                            value={formData.companyDescription || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "companyDescription",
                                e.target.value
                              )
                            }
                            className="mt-2 bg-black/50 border-white/20 min-h-[100px]"
                            placeholder="Describe your company's main activities..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 4: Emissions Overview */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div>
                          <Label className="mb-4 block">
                            Do you track your carbon emissions?
                          </Label>
                          <RadioGroup
                            value={formData.hasEmissionsHistory?.toString()}
                            onValueChange={(value) =>
                              handleInputChange(
                                "hasEmissionsHistory",
                                value === "true"
                              )
                            }
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="emissions-yes" />
                              <Label htmlFor="emissions-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="emissions-no" />
                              <Label htmlFor="emissions-no">No</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="mb-4 block">
                            What are your primary sources of emissions?
                          </Label>
                          <div className="space-y-3">
                            {EMISSION_SOURCES.map((source) => (
                              <div
                                key={source}
                                className="flex items-center space-x-2"
                              >
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    id={source}
                                    checked={formData.primaryEmissionSources?.includes(
                                      source
                                    )}
                                    onCheckedChange={(checked) => {
                                      const current =
                                        formData.primaryEmissionSources || [];
                                      const updated = checked
                                        ? [...current, source]
                                        : current.filter(
                                            (s: string) => s !== source
                                          );
                                      handleInputChange(
                                        "primaryEmissionSources",
                                        updated
                                      );
                                    }}
                                  />
                                </div>
                                <Label htmlFor={source}>{source}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Emissions Details */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <div>
                          <Label className="mb-4 block">
                            Which sustainability programs or certifications do
                            you participate in?
                          </Label>
                          <div className="space-y-3">
                            {SUSTAINABILITY_PROGRAMS.map((program) => (
                              <div
                                key={program}
                                className="flex items-center space-x-2"
                              >
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    id={program}
                                    checked={formData.sustainabilityPrograms?.includes(
                                      program
                                    )}
                                    onCheckedChange={(checked) => {
                                      const current =
                                        formData.sustainabilityPrograms || [];
                                      const updated = checked
                                        ? [...current, program]
                                        : current.filter(
                                            (p: string) => p !== program
                                          );
                                      handleInputChange(
                                        "sustainabilityPrograms",
                                        updated
                                      );
                                    }}
                                  />
                                </div>
                                <Label htmlFor={program}>{program}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="offsettingExperience">
                            Have you previously participated in carbon
                            offsetting?
                          </Label>
                          <Select
                            value={formData.offsettingExperience}
                            onValueChange={(value) =>
                              handleInputChange("offsettingExperience", value)
                            }
                          >
                            <SelectTrigger className="mt-2 bg-black/50 border-white/20">
                              <SelectValue placeholder="Select your experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">
                                Never participated
                              </SelectItem>
                              <SelectItem value="occasional">
                                Occasional participation
                              </SelectItem>
                              <SelectItem value="regular">
                                Regular participation
                              </SelectItem>
                              <SelectItem value="extensive">
                                Extensive experience
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="border-t border-white/10 p-6">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="border-white/10"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid}
                      className="bg-green-600 hover:bg-green-500"
                    >
                      {isLastStep ? (
                        <>
                          Complete
                          <Check className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
