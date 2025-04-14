"use client";
import {
  ExternalLink,
  FileText,
  Leaf,
  MapPin,
  Shield,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatNumber } from "@/lib/utils";

export interface ProjectDetailsProps {
  id: string;
  name: string;
  projectId: string;
  location: string;
  type: string;
  creditsIssued: number;
  creditsAvailable: number;
  vintageYear: string;
  certification: string;
  verifier: string;
  methodology: string;
  tokenId: string;
  lastTransaction?: string;
  co2Reduction: number;
  documentation?: string;
  image: string;
  description: string;
  pricePerTon: number;
}

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetailsProps | null;
  onPurchase?: (project: ProjectDetailsProps) => void;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onPurchase,
}: ProjectDetailsModalProps) {
  console.log("ProjectDetailsModal rendered with props:", { isOpen, project });

  // Check if project is null or undefined
  if (!project) {
    console.error("ProjectDetailsModal: project is null or undefined");
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: any) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] bg-black border border-white/10 p-0 overflow-hidden">
        <div className="relative h-48">
          <Image
            src={project.image || "/placeholder.svg"}
            alt={project.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center rounded-full bg-green-600/90 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {project.type}
            </span>
          </div>
        </div>

        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="text-xl font-bold">
            {project.name}
          </DialogTitle>
          <DialogDescription className="flex items-center text-gray-400">
            <MapPin className="mr-1 h-4 w-4" />
            {project.location}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="mb-6">
            <p className="text-gray-300">{project.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Project ID</p>
                  <p className="font-medium">{project.projectId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">CO₂ Reduction</p>
                  <p className="font-medium">
                    {formatNumber(project.co2Reduction)} tonnes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Certification</p>
                  <p className="font-medium">{project.certification}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Methodology</p>
                  <p className="font-medium">{project.methodology}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Token ID</p>
                  <p className="font-medium">{project.tokenId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Verifier</p>
                  <p className="font-medium">{project.verifier}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400">Credits Issued</p>
              <p className="text-lg font-semibold">
                {formatNumber(project.creditsIssued)}
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400">Available</p>
              <p className="text-lg font-semibold">
                {formatNumber(project.creditsAvailable)}
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400">Vintage Year</p>
              <p className="text-lg font-semibold">{project.vintageYear}</p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400">Price per Ton</p>
              <p className="text-lg font-semibold">${project.pricePerTon}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {project.documentation && (
              <Button variant="outline" className="border-white/10 flex-1">
                <FileText className="mr-2 h-4 w-4" />
                View Documentation
              </Button>
            )}
            {project.lastTransaction && (
              <Button variant="outline" className="border-white/10 flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>
            )}
            <Button
              className="bg-green-600 hover:bg-green-500 flex-1"
              onClick={() => onPurchase && onPurchase(project)}
            >
              Purchase Credits
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
