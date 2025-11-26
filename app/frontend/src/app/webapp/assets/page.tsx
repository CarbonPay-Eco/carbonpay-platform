"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowUpRight, Download, BarChart, Leaf } from "lucide-react";
import type { Project } from "../../../../types";
import WebappShell from "@/components/webapp/layout/webapp-shell";
import { PurchaseCreditsModal } from "@/components/webapp/modals/purchase-credits-modal";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getUserPurchases } from "@/app/api/purchases-service";
import { getRetirements } from "@/app/api/retirements-service";
import { getProjects } from "@/app/api/project-service";

interface Purchase {
  id: string;
  projectId: string;
  quantity: number;
  pricePerCredit: number;
  totalCost: number;
  txHash: string;
  status: string;
  createdAt: string;
  project?: {
    id: string;
    projectName: string;
    location: string;
    projectImageUrl?: string;
    description?: string;
  };
}

export default function AssetsPage() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [retirements, setRetirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [purchasesResult, retirementsResult, projectsResult] =
          await Promise.all([
            getUserPurchases(),
            getRetirements(),
            getProjects(),
          ]);

        if (purchasesResult.success) {
          setPurchases(purchasesResult.data || []);
        } else {
          setError(purchasesResult.message || "Failed to load purchases");
        }

        if (retirementsResult.success) {
          setRetirements(retirementsResult.data || []);
        }

        if (projectsResult.success) {
          setProjects(projectsResult.data || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals
  const totalCredits = purchases.reduce(
    (sum, purchase) => {
      const qty = Number(purchase.quantity) || 0;
      return sum + qty;
    },
    0
  );

  const totalRetired = retirements.reduce(
    (sum, retirement) => {
      const qty = Number(retirement.quantity) || 0;
      return sum + qty;
    },
    0
  );

  const availableCredits = totalCredits - totalRetired;

  return (
    <ProtectedRoute>
      <WebappShell>
        <main className="p-8">
          <div className="space-y-8">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Your Carbon Credits</h1>
                <p className="text-gray-400">
                  Manage and track your carbon credit portfolio
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-white/10">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-500"
                  onClick={() => setIsPurchaseModalOpen(true)}
                >
                  Purchase Credits
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/40">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Total Credits</h3>
                    <Leaf className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold">
                    {loading ? "..." : (Number(totalCredits) || 0).toFixed(2)} T
                  </p>
                </CardContent>
                <CardFooter className="border-t border-white/10 py-3 text-sm text-gray-400">
                  From {purchases.length} different {purchases.length === 1 ? "purchase" : "purchases"}
                </CardFooter>
              </Card>

              <Card className="bg-black/40">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Available</h3>
                    <BarChart className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold">
                    {loading ? "..." : (Number(availableCredits) || 0).toFixed(2)} T
                  </p>
                </CardContent>
                <CardFooter className="border-t border-white/10 py-3 text-sm text-gray-400">
                  Ready to be used for offsetting
                </CardFooter>
              </Card>

              <Card className="bg-black/40">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Used Credits</h3>
                    <Leaf className="h-5 w-5 text-gray-500" />
                  </div>
                  <p className="text-3xl font-bold">
                    {loading ? "..." : (Number(totalRetired) || 0).toFixed(2)} T
                  </p>
                </CardContent>
                <CardFooter className="border-t border-white/10 py-3 text-sm text-gray-400">
                  Already retired for offsetting
                </CardFooter>
              </Card>
            </div>

            {/* Credits Table */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Your Credit Portfolio
              </h2>
              {loading ? (
                <div className="text-center py-8 text-gray-400">
                  Loading your credits...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-400">
                  {error}
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-4">You haven't purchased any credits yet.</p>
                  <Button
                    className="bg-green-600 hover:bg-green-500"
                    onClick={() => setIsPurchaseModalOpen(true)}
                  >
                    Purchase Credits
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/40">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                            Purchase ID
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">
                            Project
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Quantity (T)
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Available (T)
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Used (T)
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Price per Ton
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Purchase Date
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((purchase) => {
                          // Calculate used credits for this purchase (from retirements)
                          // Retirement has tokenizedProjectId which should match purchase.projectId
                          const projectRetirements = retirements.filter(
                            (r) =>
                              r.tokenizedProjectId === purchase.projectId ||
                              r.projectId === purchase.projectId
                          );
                          const usedForThisProject = projectRetirements.reduce(
                            (sum, r) => {
                              const qty = Number(r.quantity) || 0;
                              return sum + qty;
                            },
                            0
                          );
                          const purchaseQty = Number(purchase.quantity) || 0;
                          const availableForThisPurchase = Math.max(
                            0,
                            purchaseQty - usedForThisProject
                          );

                          return (
                            <tr
                              key={purchase.id}
                              className="border-b border-white/10 last:border-0"
                            >
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-mono">
                                #{purchase.id.substring(0, 8)}...
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm">
                                {purchase.project?.projectName || "Unknown Project"}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                {(Number(purchase.quantity) || 0).toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-green-400">
                                {(Number(availableForThisPurchase) || 0).toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                                {(Number(usedForThisProject) || 0).toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                                ${(Number(purchase.pricePerCredit) || 0).toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                ${(Number(purchase.totalCost) || 0).toFixed(2)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                                {new Date(
                                  purchase.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    purchase.status === "completed"
                                      ? "bg-green-500/20 text-green-400"
                                      : purchase.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}
                                >
                                  {purchase.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Purchase Credits Modal */}
        <PurchaseCreditsModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          projects={projects}
        />
      </WebappShell>
    </ProtectedRoute>
  );
}
