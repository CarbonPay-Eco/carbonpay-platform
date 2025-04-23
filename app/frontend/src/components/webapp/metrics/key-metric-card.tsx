import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KeyMetricCardProps {
  title: string
  value: string
  icon?: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function KeyMetricCard({ title, value, icon, className, action }: KeyMetricCardProps) {
  return (
    <Card className={cn("bg-black/40", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon && <div className="h-12 w-12 rounded-full bg-green-600/20 p-2.5 text-green-500">{icon}</div>}
        </div>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  )
}

