"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowUpRight, Download, BarChart, Leaf } from "lucide-react"
import type { CarbonCredit, Project } from "../../../../types"
import WebappShell from "@/components/webapp/layout/webapp-shell"
import { PurchaseCreditsModal } from "@/components/webapp/modals/purchase-credits-modal"
import { useState } from "react"

// Mock data
const credits: CarbonCredit[] = [
  {
    id: "1",
    projectId: "1",
    totalAmount: 1000,
    availableAmount: 800,
    usedAmount: 200,
    purchaseDate: new Date("2024-02-15"),
  },
  {
    id: "2",
    projectId: "2",
    totalAmount: 500,
    availableAmount: 300,
    usedAmount: 200,
    purchaseDate: new Date("2024-01-20"),
  },
  {
    id: "3",
    projectId: "3",
    totalAmount: 2000,
    availableAmount: 1500,
    usedAmount: 500,
    purchaseDate: new Date("2024-03-01"),
  },
]

// Mock projects data
const projects: Project[] = [
  {
    id: "1",
    name: "São Carlos Solar Energy Project",
    type: "Solar Energy",
    location: "São Carlos, Brazil",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
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
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    pricePerTon: 15,
    totalCapacity: 6000,
    availableCapacity: 4500,
    code: "ATLREF",
  },
]

export default function AssetsPage() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

  return (
    <WebappShell>
      <main className="p-8">
        <div className="space-y-8">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Your Carbon Credits</h1>
              <p className="text-gray-400">Manage and track your carbon credit portfolio</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-white/10">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button className="bg-green-600 hover:bg-green-500" onClick={() => setIsPurchaseModalOpen(true)}>
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
                <p className="text-3xl font-bold">{credits.reduce((acc, credit) => acc + credit.totalAmount, 0)} T</p>
              </CardContent>
              <CardFooter className="border-t border-white/10 py-3 text-sm text-gray-400">
                From {credits.length} different projects
              </CardFooter>
            </Card>

            <Card className="bg-black/40">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Available</h3>
                  <BarChart className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold">
                  {credits.reduce((acc, credit) => acc + credit.availableAmount, 0)} T
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
                <p className="text-3xl font-bold">{credits.reduce((acc, credit) => acc + credit.usedAmount, 0)} T</p>
              </CardContent>
              <CardFooter className="border-t border-white/10 py-3 text-sm text-gray-400">
                Already retired for offsetting
              </CardFooter>
            </Card>
          </div>

          {/* Credits Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Credit Portfolio</h2>
            <div className="rounded-xl border border-white/10 bg-black/40">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Credit ID</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Project</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Total (T)</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Available (T)</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Used (T)</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Purchase Date</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map((credit) => (
                      <tr key={credit.id} className="border-b border-white/10 last:border-0">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-mono">#{credit.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {credit.projectId === "1"
                            ? "São Carlos Solar Energy"
                            : credit.projectId === "2"
                              ? "Amazon Rainforest"
                              : "Atlantic Rainforest"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">{credit.totalAmount}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">{credit.availableAmount}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">{credit.usedAmount}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                          {credit.purchaseDate.toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <Button variant="outline" size="sm" className="border-white/10">
                            Use Credits
                          </Button>
                        </td>
                      </tr>
                    ))}
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
        onClose={() => setIsPurchaseModalOpen(false)}
        projects={projects}
      />
    </WebappShell>
  )
}

