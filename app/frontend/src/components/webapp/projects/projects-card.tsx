import Image from "next/image";
import { Info, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "../../../../types";
import { Button } from "@/components/ui/button";

// Export the interface so we can import it elsewhere
export interface ProjectCardProps {
  project: Project;
  onPurchase?: (project: Project) => void;
  onViewDetails?: (project: Project) => void;
}

export function ProjectCard({
  project,
  onPurchase,
  onViewDetails,
}: ProjectCardProps) {
  return (
    <Card className="overflow-hidden bg-black/40">
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
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <p className="mt-1 flex items-center text-sm text-gray-400">
          <MapPin className="mr-1 h-4 w-4" />
          {project.location}
        </p>
      </CardContent>
      <CardFooter className="border-t border-white/10 p-6">
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Price per ton</p>
              <p className="font-semibold">
                {formatCurrency(project.pricePerTon)}/T
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm text-gray-400">Available</p>
              <p className="font-semibold">{project.availableCapacity}T</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-white/10"
              onClick={() => {
                console.log("Details button clicked");
                // Add a direct alert to see if the button click is working
                if (onViewDetails) {
                  console.log("Calling onViewDetails function");
                  onViewDetails(project);
                } else {
                  console.error("onViewDetails function is not defined");
                }
              }}
            >
              <Info className="mr-2 h-4 w-4" />
              Details
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-500"
              onClick={() => onPurchase && onPurchase(project)}
            >
              Purchase
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
