"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyMetricCard } from "@/components/webapp/metrics/key-metric-card";
import { ProjectCard } from "@/components/webapp/projects/projects-card";
import { ProgressRing } from "@/components/webapp/metrics/progress-ring";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Leaf, Wallet } from "lucide-react";
import type { Project } from "../../../../types/index";
import WebappShell from "@/components/webapp/layout/webapp-shell";
import { PurchaseCreditsModal } from "@/components/webapp/modals/purchase-credits-modal";
import {
  ProjectDetailsModal,
  type ProjectDetailsProps,
} from "@/components/webapp/modals/project-details-modal";
import { OnboardingStatus } from "@/components/webapp/dashboard/onboarding-status";

// Mock data
const metrics = {
  totalOffset: 1.2,
  creditsAvailable: 3.5,
  emissionsOffset: 68,
  totalEmissions: 767,
};

const projects: Project[] = [
  {
    id: "1",
    name: "São Carlos Solar Energy Project",
    type: "Solar Energy",
    location: "São Carlos, Brazil",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    pricePerTon: 20,
    totalCapacity: 1000,
    availableCapacity: 800,
    code: "SCSE",
  },
  {
    id: "2",
    name: "Amazon Rainforest Preservation",
    type: "Preservation",
    location: "Amazonas, Brazil",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    pricePerTon: 10,
    totalCapacity: 5000,
    availableCapacity: 3000,
    code: "AMZREF",
  },
  {
    id: "3",
    name: "Atlantic Rainforest Preservation",
    type: "Preservation",
    location: "São Paulo, Brazil",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    pricePerTon: 15,
    totalCapacity: 6000,
    availableCapacity: 4500,
    code: "ATLREF",
  },
];

// Extended project details for the modal
const projectDetails: Record<string, ProjectDetailsProps> = {
  "1": {
    id: "1",
    name: "São Carlos Solar Energy Project",
    projectId: "VCS/3447",
    location: "São Carlos, Brazil",
    type: "Solar Energy",
    creditsIssued: 300000,
    creditsAvailable: 800,
    vintageYear: "2023",
    certification: "Verra VCS",
    verifier: "AENOR Internacional",
    methodology: "VM0015",
    tokenId: "CP-SCSE-2023",
    lastTransaction: "https://explorer.solana.com/tx/123",
    co2Reduction: 300000,
    documentation: "https://registry.verra.org/app/projectDetail/VCS/3447",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    description:
      "The São Carlos Solar Energy Project is a renewable energy initiative that generates clean electricity through solar power, reducing reliance on fossil fuels and cutting carbon emissions in the São Carlos region of Brazil.",
    pricePerTon: 20,
  },
  "2": {
    id: "2",
    name: "Amazon Rainforest Preservation",
    projectId: "VCS/3448",
    location: "Amazonas, Brazil",
    type: "Conservation Forest (REDD+)",
    creditsIssued: 500000,
    creditsAvailable: 120000,
    vintageYear: "2022",
    certification: "Verra VCS",
    verifier: "AENOR Internacional",
    methodology: "VM0015",
    tokenId: "CP-AMZN-2022",
    lastTransaction: "https://explorer.solana.com/tx/456",
    co2Reduction: 500000,
    documentation: "https://registry.verra.org/app/projectDetail/VCS/3448",
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    description:
      "The Amazon Rainforest Preservation project protects critical areas of the Amazon rainforest from deforestation and degradation. By preserving these vital ecosystems, the project safeguards biodiversity and prevents significant carbon emissions.",
    pricePerTon: 10,
  },
  "3": {
    id: "3",
    name: "Atlantic Rainforest Preservation",
    projectId: "VCS/3449",
    location: "São Paulo, Brazil",
    type: "Conservation Forest (REDD+)",
    creditsIssued: 450000,
    creditsAvailable: 200000,
    vintageYear: "2022",
    certification: "Verra VCS",
    verifier: "AENOR Internacional",
    methodology: "VM0015",
    tokenId: "CP-ATLF-2022",
    lastTransaction: "https://explorer.solana.com/tx/789",
    co2Reduction: 450000,
    documentation: "https://registry.verra.org/app/projectDetail/VCS/3449",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    description:
      "The Atlantic Rainforest Preservation project focuses on protecting and restoring areas of Brazil's endangered Atlantic Forest. This project helps conserve one of the world's most biodiverse and threatened forest ecosystems.",
    pricePerTon: 15,
  },
};

const recentOffsets = [
  {
    source: "Gerdau Açoa Pernambuco",
    project: "Wind Power Initiative",
    amount: 1000,
    date: "2024-03-09",
  },
  {
    source: "Gerdau Açoa Pernambuco",
    project: "Amazon Reforestation",
    amount: 3000,
    date: "2024-03-08",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectDetailsProps | null>(null);

  // Simulate wallet connection check
  useEffect(() => {
    // For demo purposes, set wallet as connected when dashboard loads
    localStorage.setItem("walletConnected", "true");
  }, []);

  // Simplified approach - directly open the modal with the project details
  const openDetailsModal = (projectId: string) => {
    console.log("Opening details modal for project ID:", projectId);
    const details = projectDetails[projectId];

    if (!details) {
      console.error("No details found for project ID:", projectId);
      return;
    }

    setSelectedProject(details);
    setIsDetailsModalOpen(true);
  };

  const handlePurchase = (project: Project | ProjectDetailsProps) => {
    setIsPurchaseModalOpen(true);
  };

  return (
    <WebappShell>
      <main className="p-8">
        <div className="space-y-8">
          {/* Test button */}
          <Button onClick={() => openDetailsModal("1")} className="mb-4">
            Test Modal
          </Button>

          {/* Onboarding Status */}
          <OnboardingStatus />

          {/* Key Metrics */}
          <section>
            <h2 className="text-xl font-semibold">Key Metrics</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KeyMetricCard
                title="of CO₂ offset"
                value={`${metrics.totalOffset} T`}
                icon={<Leaf className="h-full w-full" />}
              />
              <KeyMetricCard
                title="Credits Available"
                value={`${metrics.creditsAvailable} T`}
                icon={<Wallet className="h-full w-full" />}
                action={
                  <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5"
                    onClick={() => setIsPurchaseModalOpen(true)}
                  >
                    Manage your credits
                  </Button>
                }
              />
              <Card className="bg-black/40 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Your emissions</h3>
                    <p className="text-3xl font-bold">
                      {metrics.totalEmissions} tons
                    </p>
                    <p className="text-sm text-gray-400">
                      {metrics.totalEmissions * (metrics.emissionsOffset / 100)}{" "}
                      tons offset
                    </p>
                  </div>
                  <ProgressRing
                    progress={metrics.emissionsOffset}
                    size={100}
                    className="text-green-500"
                  >
                    <div className="text-center">
                      <span className="text-xl font-bold">
                        {metrics.emissionsOffset}%
                      </span>
                      <span className="block text-xs text-gray-400">
                        offset
                      </span>
                    </div>
                  </ProgressRing>
                </div>
                <Button
                  className="mt-4 w-full bg-green-600 hover:bg-green-500"
                  onClick={() => setIsPurchaseModalOpen(true)}
                >
                  Offset right now
                </Button>
              </Card>
            </div>
          </section>

          {/* Active Projects */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Active Carbon Offset Projects
              </h2>
              <Button variant="outline" className="border-white/10">
                View all projects
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewDetails={() => openDetailsModal(project.id)}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          </section>

          {/* Recent Offsets */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Recent offsets</h2>
            <div className="rounded-xl border border-white/10 bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                        Emission Source
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                        Credits Offset (T)
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOffsets.map((offset, index) => (
                      <tr
                        key={index}
                        className="border-b border-white/10 last:border-0"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {offset.source}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {offset.project}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          {offset.amount}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                          {offset.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Purchase Credits Modal */}
      <PurchaseCreditsModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        projects={projects}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        project={selectedProject}
        onPurchase={handlePurchase}
      />
    </WebappShell>
  );
}
