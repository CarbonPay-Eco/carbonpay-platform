"use client";

import { CarbonPayActions } from "../../components/solana/CarbonPayActions";

export default function SolanaIntegrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Solana Program Integration
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              CarbonPay Program Direct Integration
            </h2>
            <p className="text-gray-600">
              This page demonstrates direct integration with Solana programs
              using Anchor. Connect your wallet to interact with the CarbonPay
              smart contracts.
            </p>
          </div>

          <CarbonPayActions />
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            How it works:
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              • <strong>SolanaClient:</strong> Direct program interaction using
              Anchor
            </li>
            <li>
              • <strong>useSolanaClient Hook:</strong> React hook for wallet and
              connection management
            </li>
            <li>
              • <strong>CarbonPayActions Component:</strong> UI for all program
              operations
            </li>
            <li>
              • <strong>Real-time Transactions:</strong> Direct blockchain
              interaction without backend
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
