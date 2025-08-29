"use client";

import { CarbonPayActions } from "../../../components/solana/CarbonPayActions";
import { useProjects, useCarbonCredits } from "../../../lib/solana-hooks";

export default function SolanaPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: carbonCredits, isLoading: carbonLoading } = useCarbonCredits();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solana Integration
          </h1>
          <p className="text-gray-600">
            Direct integration with CarbonPay Solana programs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Total Projects
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {projectsLoading ? "..." : projects?.length || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Carbon Credits
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {carbonLoading
                ? "..."
                : carbonCredits?.totalCredits?.toString() || "0"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Active Projects
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {projectsLoading
                ? "..."
                : projects?.filter((p) => p.account.isActive).length || 0}
            </p>
          </div>
        </div>

        {/* Projects List */}
        {!projectsLoading && projects && projects.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Recent Projects
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((project, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {project.account.name || `Project ${index + 1}`}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          project.account.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {project.account.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Amount:</strong>{" "}
                        {project.account.amount.toString()}
                      </p>
                      <p>
                        <strong>Remaining:</strong>{" "}
                        {project.account.remainingAmount.toString()}
                      </p>
                      <p>
                        <strong>Price:</strong>{" "}
                        {project.account.pricePerToken.toString()} SOL
                      </p>
                      <p>
                        <strong>Owner:</strong>{" "}
                        {project.account.owner.toString().slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CarbonPay Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Program Actions
            </h2>
            <p className="text-gray-600 mt-1">
              Interact directly with CarbonPay smart contracts
            </p>
          </div>
          <div className="p-6">
            <CarbonPayActions />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How Direct Integration Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">✅ Advantages</h4>
              <ul className="space-y-1 text-sm">
                <li>• No backend required</li>
                <li>• Real-time blockchain interaction</li>
                <li>• Direct transaction signing</li>
                <li>• Automatic state synchronization</li>
                <li>• Reduced latency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔧 Technical Features</h4>
              <ul className="space-y-1 text-sm">
                <li>• Anchor program integration</li>
                <li>• React Query for caching</li>
                <li>• TypeScript type safety</li>
                <li>• Error handling & retries</li>
                <li>• Transaction monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
