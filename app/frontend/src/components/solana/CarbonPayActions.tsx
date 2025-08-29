import React, { useState } from "react";
import { useSolanaClient } from "../../hooks/useSolanaClient";
import { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

interface ProjectFormData {
  amount: number;
  pricePerToken: number;
  carbonPayFee: number;
  uri: string;
  name: string;
  symbol: string;
}

export const CarbonPayActions: React.FC = () => {
  const { client, isConnected, publicKey } = useSolanaClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState<any[]>([]);

  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    amount: 1000,
    pricePerToken: 1,
    carbonPayFee: 5,
    uri: "https://example.com/metadata.json",
    name: "Carbon Project",
    symbol: "CARBON",
  });

  const [offsetForm, setOffsetForm] = useState({
    amount: 100,
    requestId: "",
    projectPDA: "",
  });

  const [purchaseForm, setPurchaseForm] = useState({
    amount: 50,
    projectPDA: "",
    tokenMint: "",
  });

  // Inicializar Carbon Credits
  const handleInitializeCarbonCredits = async () => {
    if (!client) return;

    setLoading(true);
    setMessage("");

    try {
      const tx = await client.initializeCarbonCredits();
      setMessage(`Carbon credits initialized! Transaction: ${tx}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo projeto
  const handleCreateProject = async () => {
    if (!client) return;

    setLoading(true);
    setMessage("");

    try {
      // Gerar novos mints para NFT e token
      const nftMint = Keypair.generate();
      const tokenMint = Keypair.generate();

      const result = await client.initializeProject({
        ...projectForm,
        nftMint: nftMint.publicKey,
        tokenMint: tokenMint.publicKey,
      });

      setMessage(
        `Project created! Transaction: ${
          result.tx
        }, Project PDA: ${result.projectPDA.toString()}`
      );
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar offset
  const handleRequestOffset = async () => {
    if (!client || !offsetForm.projectPDA) return;

    setLoading(true);
    setMessage("");

    try {
      const projectPDA = new PublicKey(offsetForm.projectPDA);
      const requestId = offsetForm.requestId || `offset_${Date.now()}`;

      const tx = await client.requestOffset({
        amount: offsetForm.amount,
        requestId,
        projectPDA,
      });

      setMessage(`Offset requested! Transaction: ${tx}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Comprar carbon credits
  const handlePurchaseCredits = async () => {
    if (!client || !purchaseForm.projectPDA || !purchaseForm.tokenMint) return;

    setLoading(true);
    setMessage("");

    try {
      const projectPDA = new PublicKey(purchaseForm.projectPDA);
      const tokenMint = new PublicKey(purchaseForm.tokenMint);

      const tx = await client.purchaseCarbonCredits({
        amount: purchaseForm.amount,
        projectPDA,
        tokenMint,
      });

      setMessage(`Credits purchased! Transaction: ${tx}`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Buscar todos os projetos
  const handleFetchProjects = async () => {
    if (!client) return;

    setLoading(true);
    setMessage("");

    try {
      const allProjects = await client.getAllProjects();
      setProjects(allProjects);
      setMessage(`Found ${allProjects.length} projects`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800">
          Wallet Not Connected
        </h3>
        <p className="text-yellow-600">
          Please connect your wallet to interact with CarbonPay programs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-blue-900 mb-4">
          CarbonPay Program Integration
        </h2>
        <p className="text-blue-700">Connected: {publicKey?.toString()}</p>
      </div>

      {message && (
        <div className="p-4 bg-gray-100 border rounded-lg">
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Initialize Carbon Credits */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">
          1. Initialize Carbon Credits
        </h3>
        <button
          onClick={handleInitializeCarbonCredits}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Initializing..." : "Initialize Carbon Credits"}
        </button>
      </div>

      {/* Create Project */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">2. Create New Project</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={projectForm.amount}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  amount: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Price per Token
            </label>
            <input
              type="number"
              value={projectForm.pricePerToken}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  pricePerToken: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Carbon Pay Fee (%)
            </label>
            <input
              type="number"
              value={projectForm.carbonPayFee}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  carbonPayFee: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Symbol</label>
            <input
              type="text"
              value={projectForm.symbol}
              onChange={(e) =>
                setProjectForm({ ...projectForm, symbol: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm({ ...projectForm, name: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">URI</label>
            <input
              type="text"
              value={projectForm.uri}
              onChange={(e) =>
                setProjectForm({ ...projectForm, uri: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        <button
          onClick={handleCreateProject}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </div>

      {/* Request Offset */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">3. Request Offset</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={offsetForm.amount}
              onChange={(e) =>
                setOffsetForm({ ...offsetForm, amount: Number(e.target.value) })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Request ID</label>
            <input
              type="text"
              value={offsetForm.requestId}
              onChange={(e) =>
                setOffsetForm({ ...offsetForm, requestId: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="Auto-generated if empty"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Project PDA
            </label>
            <input
              type="text"
              value={offsetForm.projectPDA}
              onChange={(e) =>
                setOffsetForm({ ...offsetForm, projectPDA: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="Enter project PDA address"
            />
          </div>
        </div>
        <button
          onClick={handleRequestOffset}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Requesting..." : "Request Offset"}
        </button>
      </div>

      {/* Purchase Credits */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">
          4. Purchase Carbon Credits
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={purchaseForm.amount}
              onChange={(e) =>
                setPurchaseForm({
                  ...purchaseForm,
                  amount: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Project PDA
            </label>
            <input
              type="text"
              value={purchaseForm.projectPDA}
              onChange={(e) =>
                setPurchaseForm({ ...purchaseForm, projectPDA: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="Enter project PDA address"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Token Mint</label>
            <input
              type="text"
              value={purchaseForm.tokenMint}
              onChange={(e) =>
                setPurchaseForm({ ...purchaseForm, tokenMint: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              placeholder="Enter token mint address"
            />
          </div>
        </div>
        <button
          onClick={handlePurchaseCredits}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? "Purchasing..." : "Purchase Credits"}
        </button>
      </div>

      {/* Fetch Projects */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">5. Fetch All Projects</h3>
        <button
          onClick={handleFetchProjects}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Projects"}
        </button>

        {projects.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Found Projects:</h4>
            <div className="space-y-2">
              {projects.map((project, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <p>
                    <strong>Owner:</strong> {project.account.owner.toString()}
                  </p>
                  <p>
                    <strong>Amount:</strong> {project.account.amount.toString()}
                  </p>
                  <p>
                    <strong>Remaining:</strong>{" "}
                    {project.account.remainingAmount.toString()}
                  </p>
                  <p>
                    <strong>Price:</strong>{" "}
                    {project.account.pricePerToken.toString()}
                  </p>
                  <p>
                    <strong>Active:</strong>{" "}
                    {project.account.isActive ? "Yes" : "No"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
