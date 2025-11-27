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
import { ArrowRight, CreditCard, Leaf } from "lucide-react";
import type { Project } from "../../../../types";
import { purchaseCredits } from "@/app/api/user-service";
import { useSolanaClient } from "@/hooks/useSolanaClient";
import { toast } from "react-hot-toast";

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  preselectedProject?: Project | null;
  onPurchaseSuccess?: () => void;
}

export function PurchaseCreditsModal({
  isOpen,
  onClose,
  projects,
  preselectedProject,
  onPurchaseSuccess,
}: PurchaseCreditsModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { client, isConnected } = useSolanaClient();

  // Pre-select project when modal opens with a preselected project
  useEffect(() => {
    if (isOpen && preselectedProject) {
      setSelectedProjectId(preselectedProject.id);
    }
  }, [isOpen, preselectedProject]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const totalCost = selectedProject
    ? selectedProject.pricePerTon * quantity
    : 0;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      const maxAvailable = selectedProject?.available || selectedProject?.availableCapacity || 0;
      setQuantity(Math.min(value, maxAvailable));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!selectedProjectId || quantity <= 0) {
      setError("Please select a project and quantity");
      return;
    }

    console.log("Submitting purchase with projectId:", selectedProjectId, "quantity:", quantity);
    console.log("Selected project object:", selectedProject);

    setLoading(true);
    setError(null);

    try {
      const result = await purchaseCredits({
        projectId: selectedProjectId,
        quantity,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to purchase credits");
      }

      toast.success("Credits purchased successfully!");
      
      // Call the success callback before closing to refresh data
      if (onPurchaseSuccess) {
        try {
          // If callback is async, await it; otherwise call it directly
          const result = onPurchaseSuccess();
          if (result instanceof Promise) {
            await result;
          }
        } catch (error) {
          console.error("Error in onPurchaseSuccess callback:", error);
        }
      }
      
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to purchase credits");
      toast.error(err.message || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setSelectedProjectId("");
    setQuantity(1);
    setError(null);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black border border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {step === 1 ? "Purchase Carbon Credits" : "Confirm Purchase"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {step === 1
                ? "Select a project and the amount of carbon credits you want to purchase."
                : "Review your purchase details and confirm."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label htmlFor="project" className="text-sm font-medium">
                  Select Project
                </label>
                {projects.length === 0 ? (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-400">
                    <p className="font-medium mb-1">No projects available</p>
                    <p className="text-yellow-300/80">
                      There are currently no carbon credit projects available for purchase.
                      Please check back later or create a new project if you're an admin.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    required
                  >
                    <SelectTrigger
                      id="project"
                      className="bg-black/50 border-white/20"
                    >
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/20">
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.projectName || project.name} ({formatCurrency(project.pricePerTon)}
                          /ton)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedProject && (
                <>
                  <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
                        <Leaf className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedProject.projectName || selectedProject.name}</h3>
                        <p className="text-xs text-gray-400">
                          {selectedProject.location}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-400">Price per ton</p>
                        <p className="font-medium">
                          {formatCurrency(selectedProject.pricePerTon)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Available</p>
                        <p className="font-medium">
                          {selectedProject.available || selectedProject.availableCapacity || 0} tons
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium">
                      Quantity (tons)
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProject.available || selectedProject.availableCapacity || 0}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="bg-black/50 border-white/20"
                      required
                    />
                    <p className="text-xs text-gray-400">
                      Maximum available: {selectedProject.available || selectedProject.availableCapacity || 0}{" "}
                      tons
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Cost</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <h3 className="font-medium mb-3">Purchase Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project</span>
                    <span>{selectedProject?.projectName || selectedProject?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity</span>
                    <span>{quantity} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per ton</span>
                    <span>
                      {formatCurrency(selectedProject?.pricePerTon || 0)}
                    </span>
                  </div>
                  <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                  </div>
                  <h3 className="font-medium">Payment Method</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  You will be charged {formatCurrency(totalCost)} from your
                  account balance.
                </p>
                <div className="bg-black/50 border border-white/10 rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method</span>
                    <span>Account Balance</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-400">Amount</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-500"
              disabled={
                loading ||
                (step === 1 && (!selectedProjectId || quantity <= 0)) ||
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
                "Confirm Purchase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}