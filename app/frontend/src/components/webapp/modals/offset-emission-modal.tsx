"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Leaf, Wallet } from "lucide-react";
import type { Project } from "../../../../types";
import type { Emission } from "@/app/api/emission-service";
import { retireEmissions } from "@/app/api/retirements-service";
import { getUserPurchases } from "@/app/api/purchases-service";
import { getRetirements } from "@/app/api/retirements-service";
import { toast } from "sonner";

interface Purchase {
  id: string;
  projectId: string;
  quantity: number;
  pricePerCredit: number;
  totalCost: number;
  txHash: string;
  status: string;
  createdAt: string;
  purchasePDA?: string;
  nftMint?: string;
  project?: {
    id: string;
    projectName: string;
    location: string;
    projectImageUrl?: string;
  };
}

interface Retirement {
  id: string;
  tokenizedProjectId: string;
  quantity: number;
  retirementDate: string;
}

interface OffsetEmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  emission: Emission | null;
  projects: Project[];
  onOffsetSuccess?: () => void;
}

export function OffsetEmissionModal({
  isOpen,
  onClose,
  emission,
  projects,
  onOffsetSuccess,
}: OffsetEmissionModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);

  // Fetch purchases and retirements when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen]);

  // Pre-fill quantity with remaining emission amount
  useEffect(() => {
    if (isOpen && emission) {
      const emissionAmount = Number(emission.amount);
      const offsetAmount = Number(emission.offset);
      const remaining = Math.max(0, emissionAmount - offsetAmount);
      setQuantity(remaining > 0 ? remaining.toFixed(2) : "");
      setSelectedProjectId("");
      setSelectedPurchaseId("");
      setStep(1);
      setError(null);
    }
  }, [isOpen, emission]);

  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const [purchasesResult, retirementsResult] = await Promise.all([
        getUserPurchases(),
        getRetirements(),
      ]);

      if (purchasesResult.success) {
        setPurchases(purchasesResult.data || []);
      }

      if (retirementsResult.success) {
        setRetirements(retirementsResult.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoadingAssets(false);
    }
  };

  // Calculate available credits per purchase
  const getAvailableCreditsForPurchase = (purchase: Purchase): number => {
    const purchased = Number(purchase.quantity) || 0;
    const retired = retirements
      .filter((r) => r.tokenizedProjectId === purchase.projectId)
      .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    return Math.max(0, purchased - retired);
  };

  // Get purchases grouped by project with available credits
  const purchasesByProject = purchases.reduce((acc, purchase) => {
    const projectId = purchase.projectId;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(purchase);
    return acc;
  }, {} as Record<string, Purchase[]>);

  // Calculate total available credits per project
  const getProjectAvailableCredits = (projectId: string): number => {
    const projectPurchases = purchasesByProject[projectId] || [];
    return projectPurchases.reduce(
      (sum, purchase) => sum + getAvailableCreditsForPurchase(purchase),
      0
    );
  };

  // Get purchases for selected project that have available credits
  const availablePurchases = selectedProjectId
    ? (purchasesByProject[selectedProjectId] || []).filter(
        (p) => getAvailableCreditsForPurchase(p) > 0
      )
    : [];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId);
  const emissionAmount = emission ? Number(emission.amount) : 0;
  const offsetAmount = emission ? Number(emission.offset) : 0;
  const remainingAmount = emissionAmount - offsetAmount;
  const quantityNum = parseFloat(quantity) || 0;
  
  // Get available credits for selected project
  const projectAvailableCredits = selectedProjectId
    ? getProjectAvailableCredits(selectedProjectId)
    : 0;
  
  // Get available credits for selected purchase
  const purchaseAvailableCredits = selectedPurchase
    ? getAvailableCreditsForPurchase(selectedPurchase)
    : 0;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!selectedProjectId) {
        setError("Please select a project");
        return;
      }
      if (projectAvailableCredits <= 0) {
        setError("You don't have any available credits for this project. Please purchase credits first.");
        return;
      }
      if (!quantity || quantityNum <= 0) {
        setError("Please enter a valid quantity");
        return;
      }
      if (quantityNum > remainingAmount) {
        setError(`Cannot offset more than ${remainingAmount.toFixed(2)} tCO₂e remaining`);
        return;
      }
      if (quantityNum > projectAvailableCredits) {
        setError(`You only have ${projectAvailableCredits.toFixed(2)} tCO₂e available for this project`);
        return;
      }
      // If there's only one purchase, auto-select it
      if (availablePurchases.length === 1) {
        setSelectedPurchaseId(availablePurchases[0].id);
      } else if (availablePurchases.length > 1 && !selectedPurchaseId) {
        setError("Please select which purchase to use for offsetting");
        return;
      }
      setStep(2);
      return;
    }

    if (!emission || !selectedProjectId || quantityNum <= 0) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const result = await retireEmissions({
        projectId: selectedProjectId,
        quantity: quantityNum,
        emissionId: emission.id, // Link to emission
        purchaseId: selectedPurchaseId || undefined, // Use specific purchase if selected
      });

      if (result.success) {
        toast.success("Emission offset successfully!");
        onOffsetSuccess?.();
        handleClose();
      } else {
        setError(result.message || "Failed to offset emission");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to offset emission");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setSelectedProjectId("");
    setQuantity("");
    setError(null);
    setLoading(false);
  };

  if (!emission) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black border border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {step === 1 ? "Offset Emission" : "Confirm Offset"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {step === 1
                ? `Offset your "${emission.source}" emission using carbon credits.`
                : "Review your offset details and confirm."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6 py-4">
              {/* Emission Info */}
              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <h3 className="font-medium mb-3">Emission Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source</span>
                    <span>{emission.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Emission</span>
                    <span>{emissionAmount.toFixed(2)} tCO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Already Offset</span>
                    <span>{offsetAmount.toFixed(2)} tCO₂e</span>
                  </div>
                  <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-medium">
                    <span>Remaining</span>
                    <span>{remainingAmount.toFixed(2)} tCO₂e</span>
                  </div>
                </div>
              </div>

              {/* Project Selection */}
              <div className="space-y-2">
                <label htmlFor="project" className="text-sm font-medium">
                  Select Project <span className="text-red-500">*</span>
                </label>
                {loadingAssets ? (
                  <div className="text-sm text-gray-400">Loading your assets...</div>
                ) : purchases.length === 0 ? (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-400">
                    <p className="font-medium mb-1">No credits available</p>
                    <p className="text-yellow-300/80">
                      You need to purchase credits from a project before you can offset emissions.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={selectedProjectId}
                    onValueChange={(value) => {
                      setSelectedProjectId(value);
                      setSelectedPurchaseId(""); // Reset purchase selection when project changes
                    }}
                    required
                  >
                    <SelectTrigger
                      id="project"
                      className="bg-black/50 border-white/20"
                    >
                      <SelectValue placeholder="Select a project with available credits" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {Object.keys(purchasesByProject).map((projectId) => {
                        const project = projects.find((p) => p.id === projectId);
                        const available = getProjectAvailableCredits(projectId);
                        if (!project || available <= 0) return null;
                        return (
                          <SelectItem key={projectId} value={projectId}>
                            {project.projectName || project.name} - {available.toFixed(2)} tCO₂e available
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Purchase Selection (if multiple purchases for selected project) */}
              {selectedProjectId && availablePurchases.length > 1 && (
                <div className="space-y-2">
                  <label htmlFor="purchase" className="text-sm font-medium">
                    Select Purchase <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedPurchaseId}
                    onValueChange={setSelectedPurchaseId}
                    required
                  >
                    <SelectTrigger
                      id="purchase"
                      className="bg-black/50 border-white/20"
                    >
                      <SelectValue placeholder="Select which purchase to use" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {availablePurchases.map((purchase) => {
                        const available = getAvailableCreditsForPurchase(purchase);
                        const purchaseDate = new Date(purchase.createdAt).toLocaleDateString();
                        return (
                          <SelectItem key={purchase.id} value={purchase.id}>
                            {available.toFixed(2)} tCO₂e available (Purchased {purchaseDate})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedProject && (
                <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
                      <Leaf className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {selectedProject.projectName || selectedProject.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {selectedProject.location}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-gray-400">Your Available Credits</p>
                      <p className="font-medium text-green-500">
                        {projectAvailableCredits.toFixed(2)} tCO₂e
                      </p>
                    </div>
                    {selectedPurchase && (
                      <div>
                        <p className="text-gray-400">From This Purchase</p>
                        <p className="font-medium">
                          {purchaseAvailableCredits.toFixed(2)} tCO₂e
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedPurchase && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Wallet className="h-3 w-3" />
                        <span>
                          Purchase from {new Date(selectedPurchase.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity to Offset (tCO₂e) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="bg-black/50 border-white/20"
                  required
                />
                <p className="text-xs text-gray-400">
                  Maximum: {Math.min(remainingAmount, projectAvailableCredits).toFixed(2)} tCO₂e
                  {remainingAmount < projectAvailableCredits && (
                    <span className="text-yellow-400"> (limited by emission remaining)</span>
                  )}
                  {projectAvailableCredits < remainingAmount && (
                    <span className="text-yellow-400"> (limited by available credits)</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <h3 className="font-medium mb-3">Offset Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emission Source</span>
                    <span>{emission.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project</span>
                    <span>{selectedProject?.projectName || selectedProject?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity</span>
                    <span>{quantityNum.toFixed(2)} tCO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining After Offset</span>
                    <span>{(remainingAmount - quantityNum).toFixed(2)} tCO₂e</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-green-500" />
                  </div>
                  <h3 className="font-medium">On-Chain Offset</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  This will create an on-chain offset request, burning your carbon credits
                  and linking them to this emission record.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-white/10"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-500"
              disabled={
                loading ||
                (step === 1 && (!selectedProjectId || quantityNum <= 0)) ||
                projects.length === 0
              }
            >
              {loading ? (
                "Processing..."
              ) : step === 1 ? (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Confirm Offset"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

