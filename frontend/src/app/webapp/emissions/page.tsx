"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressRing } from "@/components/webapp/metrics/progress-ring"
import { ArrowUpRight, Plus, Download, BarChart2 } from "lucide-react"
import type { Emission, Project } from "../../../../types"
import WebappShell from "@/components/webapp/layout/webapp-shell"
import { useState } from "react"
import { PurchaseCreditsModal } from "@/components/webapp/modals/purchase-credits-modal"

// Mock data
const emissions: Emission[] = [
  {
    id: "1",
    source: "Office Energy Consumption",
    amount: 250,
    date: new Date("2024-03-01"),
    offset: 200,
    projectName: "São Carlos Solar Energy",
  },
  {
    id: "2",
    source: "Business Travel",
    amount: 175,
    date: new Date("2024-02-15"),
    offset: 100,
    projectName: "Amazon Rainforest",
  },
  {
    id: "3",
    source: "Manufacturing Process",
    amount: 342,
    date: new Date("2024-01-20"),
    offset: 200,
    projectName: "Atlantic Rainforest",
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

export default function EmissionsPage() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

  // Calculate total emissions and offsets
  const totalEmissions = emissions.reduce((acc, emission) => acc + emission.amount, 0)
  const totalOffset = emissions.reduce((acc, emission) => acc + emission.offset, 0)
  const offsetPercentage = Math.round((totalOffset / totalEmissions) * 100)

  return (
    <WebappShell>
      <main className="p-8">
        <div className="space-y-8">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Your Carbon Emissions</h1>
              <p className="text-gray-400">Track and offset your carbon footprint</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-white/10">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" className="border-white/10">
                <Plus className="mr-2 h-4 w-4" />
                Add Emission
              </Button>
              <Button className="bg-green-600 hover:bg-green-500" onClick={() => setIsPurchaseModalOpen(true)}>
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
                  <h2 className="text-xl font-semibold mb-4">Emissions Overview</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400">Total Emissions</p>
                      <p className="text-3xl font-bold">{totalEmissions} tCO₂e</p>
                      <p className="text-sm text-gray-400 mt-1">Year to date</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Offset</p>
                      <p className="text-3xl font-bold">{totalOffset} tCO₂e</p>
                      <p className="text-sm text-gray-400 mt-1">{totalEmissions - totalOffset} tCO₂e remaining</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Largest Source</p>
                      <p className="text-xl font-bold">Manufacturing</p>
                      <p className="text-sm text-gray-400 mt-1">{Math.round((342 / totalEmissions) * 100)}% of total</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Monthly Average</p>
                      <p className="text-xl font-bold">{Math.round(totalEmissions / 3)} tCO₂e</p>
                      <p className="text-sm text-gray-400 mt-1">Last 3 months</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <ProgressRing progress={offsetPercentage} size={160} className="mb-4">
                    <div className="text-center">
                      <span className="text-3xl font-bold">{offsetPercentage}%</span>
                      <span className="block text-sm text-gray-400">offset</span>
                    </div>
                  </ProgressRing>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-500"
                    onClick={() => setIsPurchaseModalOpen(true)}
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
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Source</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Emissions (tCO₂e)</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Offset (tCO₂e)</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Offset %</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Offset Project</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Date</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emissions.map((emission) => (
                      <tr key={emission.id} className="border-b border-white/10 last:border-0">
                        <td className="whitespace-nowrap px-6 py-4 text-sm">{emission.source}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">{emission.amount}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">{emission.offset}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          {Math.round((emission.offset / emission.amount) * 100)}%
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">{emission.projectName}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-400">
                          {emission.date.toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10"
                            onClick={() => setIsPurchaseModalOpen(true)}
                          >
                            Offset
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

