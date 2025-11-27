"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/webapp/metrics/progress-ring";
import { ArrowUpRight, Plus, Download, BarChart2 } from "lucide-react";
import type { Project } from "../../../../types";
import type { Emission } from "@/app/api/emission-service";
import WebappShell from "@/components/webapp/layout/webapp-shell";
import { useState, useEffect } from "react";
import { PurchaseCreditsModal } from "@/components/webapp/modals/purchase-credits-modal";
import { AddEmissionModal } from "@/components/webapp/modals/add-emission-modal";
import { OffsetEmissionModal } from "@/components/webapp/modals/offset-emission-modal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getProjects } from "@/app/api/project-service";
import {
  getEmissions,
  getEmissionStats,
  type EmissionStats,
} from "@/app/api/emission-service";

// Mock projects data - REMOVED, now fetching from API
// const projects: Project[] = [
//   {
//     id: "1",
//     name: "São Carlos Solar Energy Project",
//     type: "Solar Energy",
//     location: "São Carlos, Brazil",
//     image:
//       "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
//     pricePerTon: 20,
//     totalCapacity: 1000,
//     availableCapacity: 800,
//     code: "SCSE",
//   },
//   {
//     id: "2",
//     name: "Amazon Rainforest Preservation",
//     type: "Preservation",
//     location: "Amazonas, Brazil",
//     image:
//       "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
//     pricePerTon: 10,
//     totalCapacity: 5000,
//     availableCapacity: 3000,
//     code: "AMZREF",
//   },
//   {
//     id: "3",
//     name: "Atlantic Rainforest Preservation",
//     type: "Preservation",
//     location: "São Paulo, Brazil",
//     image:
//       "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
//     pricePerTon: 15,
//     totalCapacity: 6000,
//     availableCapacity: 4500,
//     code: "ATLREF",
//   },
// ];

export default function EmissionsPage() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAddEmissionModalOpen, setIsAddEmissionModalOpen] = useState(false);
  const [isOffsetModalOpen, setIsOffsetModalOpen] = useState(false);
  const [selectedEmission, setSelectedEmission] = useState<Emission | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [stats, setStats] = useState<EmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [preselectedPurchaseProject, setPreselectedPurchaseProject] =
    useState<Project | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsResult, emissionsResult, statsResult] = await Promise.all([
        getProjects(),
        getEmissions(),
        getEmissionStats(),
      ]);

      if (projectsResult.success) {
        setProjects(projectsResult.data || []);
      }

      if (emissionsResult.success) {
        setEmissions(emissionsResult.data || []);
      }

      if (statsResult.success) {
        setStats(statsResult.data || null);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats from emissions if stats API fails
  const totalEmissions = stats?.totalEmissions || emissions.reduce(
    (acc, emission) => acc + Number(emission.amount),
    0
  );
  const totalOffset = stats?.totalOffset || emissions.reduce(
    (acc, emission) => acc + Number(emission.offset),
    0
  );
  const offsetPercentage = stats?.offsetPercentage || (totalEmissions > 0
    ? Math.round((totalOffset / totalEmissions) * 100)
    : 0);

  // Find largest source
  const largestSource = emissions.length > 0
    ? emissions.reduce((max, e) =>
        Number(e.amount) > Number(max.amount) ? e : max
      )
    : null;
  const largestSourcePercentage = largestSource && totalEmissions > 0
    ? Math.round((Number(largestSource.amount) / totalEmissions) * 100)
    : 0;

  // Calculate monthly average (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentEmissions = emissions.filter(
    (e) => new Date(e.date) >= threeMonthsAgo
  );
  const monthlyAverage =
    recentEmissions.length > 0
      ? Math.round(
          recentEmissions.reduce(
            (sum, e) => sum + Number(e.amount),
            0
          ) / 3
        )
      : 0;

  return (
    <ProtectedRoute>
      <WebappShell>
        <main className="p-8">
          <div className="space-y-8">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Your Carbon Emissions</h1>
                <p className="text-gray-400">
                  Track and offset your carbon footprint
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-white/10">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10"
                  onClick={() => setIsAddEmissionModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Emission
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-500"
                  onClick={() => {
                    // If there's an emission with remaining amount, select it
                    const emissionWithRemaining = emissions.find((e) => {
                      const amount = Number(e.amount);
                      const offset = Number(e.offset);
                      return amount > offset;
                    });
                    if (emissionWithRemaining) {
                      setSelectedEmission(emissionWithRemaining);
                      setIsOffsetModalOpen(true);
                    } else {
                      // Otherwise, open purchase modal to buy credits first
                      setIsPurchaseModalOpen(true);
                    }
                  }}
                >
                  Offset Emissions
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-black/40">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <h2 className="text-xl font-semibold mb-4">
                      Emissions Overview
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-400">Total Emissions</p>
                        <p className="text-3xl font-bold">
                          {totalEmissions} tCO₂e
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Year to date
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Offset</p>
                        <p className="text-3xl font-bold">
                          {totalOffset} tCO₂e
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {totalEmissions - totalOffset} tCO₂e remaining
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Largest Source</p>
                        <p className="text-xl font-bold">
                          {largestSource?.source || "N/A"}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {largestSourcePercentage}% of total
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Monthly Average</p>
                        <p className="text-xl font-bold">
                          {monthlyAverage} tCO₂e
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Last 3 months
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <ProgressRing
                      progress={offsetPercentage}
                      size={160}
                      className="mb-4"
                    >
                      <div className="text-center">
                        <span className="text-3xl font-bold">
                          {offsetPercentage}%
                        </span>
                        <span className="block text-sm text-gray-400">
                          offset
                        </span>
                      </div>
                    </ProgressRing>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-500"
                      onClick={() => {
                        // If there's an emission with remaining amount, select it
                        const emissionWithRemaining = emissions.find((e) => {
                          const amount = Number(e.amount);
                          const offset = Number(e.offset);
                          return amount > offset;
                        });
                        if (emissionWithRemaining) {
                          setSelectedEmission(emissionWithRemaining);
                          setIsOffsetModalOpen(true);
                        } else {
                          // Otherwise, open purchase modal to buy credits first
                          setIsPurchaseModalOpen(true);
                        }
                      }}
                    >
                      Offset More
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emissions Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Emission Sources</h2>
                <Button variant="outline" size="sm" className="border-white/10">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                          Source
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                          Emissions (tCO₂e)
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                          Offset (tCO₂e)
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                          Offset %
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                          Offset Project
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                            Loading emissions...
                          </td>
                        </tr>
                      ) : emissions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                            No emissions recorded yet. Click "Add Emission" to get started.
                          </td>
                        </tr>
                      ) : (
                        emissions.map((emission) => {
                          const emissionAmount = Number(emission.amount);
                          const offsetAmount = Number(emission.offset);
                          const offsetPercentage =
                            emissionAmount > 0
                              ? Math.round((offsetAmount / emissionAmount) * 100)
                              : 0;
                          const emissionDate = new Date(emission.date);

                          return (
                            <tr
                              key={emission.id}
                              className="border-b border-white/10 last:border-0"
                            >
                              <td className="whitespace-nowrap px-6 py-4 text-sm">
                                {emission.source}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                {emissionAmount.toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                {offsetAmount.toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                {offsetPercentage}%
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm">
                                {emission.offsetProject?.projectName || "Not offset"}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                                {emissionDate.toLocaleDateString()}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-white/10"
                                  onClick={() => {
                                    setSelectedEmission(emission);
                                    setIsOffsetModalOpen(true);
                                  }}
                                  disabled={offsetAmount >= emissionAmount}
                                >
                                  {offsetAmount >= emissionAmount ? "Fully Offset" : "Offset"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Purchase Credits Modal */}
        <PurchaseCreditsModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setPreselectedPurchaseProject(null);
          }}
          projects={projects}
          preselectedProject={preselectedPurchaseProject}
          onPurchaseSuccess={() => {
            // Refresh projects list after purchase (in case availability changed)
            fetchData();
          }}
        />

        {/* Add Emission Modal */}
        <AddEmissionModal
          isOpen={isAddEmissionModalOpen}
          onClose={() => setIsAddEmissionModalOpen(false)}
          onEmissionCreated={() => {
            fetchData(); // Refresh emissions list
          }}
        />

        {/* Offset Emission Modal */}
        <OffsetEmissionModal
          isOpen={isOffsetModalOpen}
          onClose={() => {
            setIsOffsetModalOpen(false);
            setSelectedEmission(null);
          }}
          emission={selectedEmission}
          projects={projects}
          onOffsetSuccess={() => {
            fetchData(); // Refresh emissions list and stats
          }}
        />
      </WebappShell>
    </ProtectedRoute>
  );
}
