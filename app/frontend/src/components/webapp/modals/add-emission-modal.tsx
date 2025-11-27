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
import { Textarea } from "@/components/ui/textarea";
import { createEmission } from "@/app/api/emission-service";
import { toast } from "sonner";

interface AddEmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmissionCreated?: () => void;
}

const EMISSION_CATEGORIES = [
  "Scope 1",
  "Scope 2",
  "Scope 3",
  "Other",
];

const COMMON_SOURCES = [
  "Office Energy Consumption",
  "Business Travel",
  "Manufacturing Process",
  "Transportation",
  "Waste Management",
  "Supply Chain",
  "Other",
];

export function AddEmissionModal({
  isOpen,
  onClose,
  onEmissionCreated,
}: AddEmissionModalProps) {
  // Pre-filled mock values
  const [source, setSource] = useState<string>("Office Energy Consumption");
  const [amount, setAmount] = useState<string>("250.00");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState<string>("Scope 2");
  const [description, setDescription] = useState<string>(
    "Monthly office electricity consumption from grid power. Includes lighting, HVAC, and office equipment usage."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to mock values when modal opens
  useEffect(() => {
    if (isOpen) {
      setSource("Office Energy Consumption");
      setAmount("250.00");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("Scope 2");
      setDescription(
        "Monthly office electricity consumption from grid power. Includes lighting, HVAC, and office equipment usage."
      );
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!source || !amount || !date) {
      setError("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    setLoading(true);

    try {
      const result = await createEmission({
        source,
        amount: amountNum,
        date,
        category: category || undefined,
        description: description || undefined,
      });

      if (result.success) {
        toast.success("Emission recorded successfully");
        onEmissionCreated?.();
        handleClose();
      } else {
        setError(result.message || "Failed to create emission");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black border border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Add Carbon Emission
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Record a new carbon emission to track your environmental impact
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6 py-4">
            {/* Source */}
            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-medium">
                Emission Source <span className="text-red-500">*</span>
              </label>
              <Select value={source} onValueChange={setSource} required>
                <SelectTrigger
                  id="source"
                  className="bg-black/50 border-white/20"
                >
                  <SelectValue placeholder="Select emission source" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  {COMMON_SOURCES.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!COMMON_SOURCES.includes(source) && source && (
                <Input
                  id="source-custom"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Enter custom source"
                  className="bg-black/50 border-white/20 mt-2"
                />
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (tCO₂e) <span className="text-red-500">*</span>
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-black/50 border-white/20"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-black/50 border-white/20"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className="bg-black/50 border-white/20"
                >
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  {EMISSION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about this emission..."
                className="bg-black/50 border-white/20"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-500"
            >
              {loading ? "Creating..." : "Add Emission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

