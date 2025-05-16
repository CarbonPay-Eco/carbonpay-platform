"use client";

import type React from "react";
import { useState } from "react";
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
import { ArrowRight, Leaf } from "lucide-react";
import { createProject } from "@/app/api/project-service";
import { useWallet } from "@solana/wallet-adapter-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const { publicKey } = useWallet();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    location: "",
    certificationBody: "",
    projectRefId: "",
    methodology: "",
    verifierName: "",
    vintageYear: new Date().getFullYear(),
    standard: "",
    totalIssued: "",
    pricePerTon: "",
    documentationUrl: "",
    projectImageUrl: "",
    tags: [] as string[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, standard: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    if (step === 1) {
      setStep(2);
    } else {
      try {
        const result = await createProject(
          {
            ...formData,
            totalIssued: parseInt(formData.totalIssued),
            pricePerTon: parseFloat(formData.pricePerTon),
            vintageYear: parseInt(formData.vintageYear.toString()),
          },
          publicKey.toBase58()
        );

        if (!result.success) {
          throw new Error(result.message || "Failed to create project");
        }

        onClose();
        // Reset the form
        setStep(1);
        setFormData({
          projectName: "",
          description: "",
          location: "",
          certificationBody: "",
          projectRefId: "",
          methodology: "",
          verifierName: "",
          vintageYear: new Date().getFullYear(),
          standard: "",
          totalIssued: "",
          pricePerTon: "",
          documentationUrl: "",
          projectImageUrl: "",
          tags: [],
        });
      } catch (error) {
        console.error("Error creating project:", error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleClose = () => {
    onClose();
    // Reset the form when closing
    setStep(1);
    setFormData({
      projectName: "",
      description: "",
      location: "",
      certificationBody: "",
      projectRefId: "",
      methodology: "",
      verifierName: "",
      vintageYear: new Date().getFullYear(),
      standard: "",
      totalIssued: "",
      pricePerTon: "",
      documentationUrl: "",
      projectImageUrl: "",
      tags: [],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-black border border-white/10">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {step === 1 ? "Create New Project" : "Confirm Project Details"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {step === 1
                ? "Fill in the details to create a new carbon offset project."
                : "Review your project details and confirm."}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="standard" className="text-sm font-medium">
                  Carbon Standard
                </label>
                <Select
                  value={formData.standard}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger
                    id="standard"
                    className="bg-black/50 border-white/20"
                  >
                    <SelectValue placeholder="Select carbon standard" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    <SelectItem value="VCS">Verra VCS</SelectItem>
                    <SelectItem value="GS">Gold Standard</SelectItem>
                    <SelectItem value="CAR">Climate Action Reserve</SelectItem>
                    <SelectItem value="ACR">
                      American Carbon Registry
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="pricePerTon" className="text-sm font-medium">
                    Price per Ton ($)
                  </label>
                  <Input
                    id="pricePerTon"
                    name="pricePerTon"
                    type="number"
                    min="1"
                    value={formData.pricePerTon}
                    onChange={handleInputChange}
                    className="bg-black/50 border-white/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="totalIssued" className="text-sm font-medium">
                    Total Credits (tons)
                  </label>
                  <Input
                    id="totalIssued"
                    name="totalIssued"
                    type="number"
                    min="1"
                    value={formData.totalIssued}
                    onChange={handleInputChange}
                    className="bg-black/50 border-white/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="certificationBody"
                  className="text-sm font-medium"
                >
                  Certification Body
                </label>
                <Input
                  id="certificationBody"
                  name="certificationBody"
                  value={formData.certificationBody}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="projectRefId" className="text-sm font-medium">
                  Project Reference ID
                </label>
                <Input
                  id="projectRefId"
                  name="projectRefId"
                  value={formData.projectRefId}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="methodology" className="text-sm font-medium">
                  Methodology
                </label>
                <Input
                  id="methodology"
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="verifierName" className="text-sm font-medium">
                  Verifier Name
                </label>
                <Input
                  id="verifierName"
                  name="verifierName"
                  value={formData.verifierName}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vintageYear" className="text-sm font-medium">
                  Vintage Year
                </label>
                <Input
                  id="vintageYear"
                  name="vintageYear"
                  type="number"
                  min="2000"
                  max={new Date().getFullYear()}
                  value={formData.vintageYear}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="documentationUrl"
                  className="text-sm font-medium"
                >
                  Documentation URL
                </label>
                <Input
                  id="documentationUrl"
                  name="documentationUrl"
                  type="url"
                  value={formData.documentationUrl}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="projectImageUrl"
                  className="text-sm font-medium"
                >
                  Project Image URL
                </label>
                <Input
                  id="projectImageUrl"
                  name="projectImageUrl"
                  type="url"
                  value={formData.projectImageUrl}
                  onChange={handleInputChange}
                  className="bg-black/50 border-white/20"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <h3 className="font-medium mb-3">Project Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name</span>
                    <span>{formData.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Standard</span>
                    <span>{formData.standard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location</span>
                    <span>{formData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price per Ton</span>
                    <span>${formData.pricePerTon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Credits</span>
                    <span>{formData.totalIssued} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Certification Body</span>
                    <span>{formData.certificationBody}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project Reference ID</span>
                    <span>{formData.projectRefId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Methodology</span>
                    <span>{formData.methodology}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verifier</span>
                    <span>{formData.verifierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vintage Year</span>
                    <span>{formData.vintageYear}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-green-500" />
                  </div>
                  <h3 className="font-medium">Project Description</h3>
                </div>
                <p className="text-sm text-gray-400">{formData.description}</p>
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
                step === 1 && (!formData.projectName || !formData.standard)
              }
            >
              {step === 1 ? (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
