"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { StatusLabel } from "@/components/status-label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { applicationStatusClassName } from "@/lib/application-helpers"
import { applicationStatuses, statusLabel, type Application, type ApplicationStatus } from "@/lib/applications"

/** The stage pill: shows the current stage and opens a menu to change it */
export function ApplicationStatusControl({
  application,
  onStatusChange,
  size = "sm",
}: {
  application: Application
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void
  size?: "sm" | "md"
}) {
  const [open, setOpen] = useState(false)
  const sizeClassName = size === "md" ? "gap-1.5 px-3 py-1 text-sm" : "gap-1 px-2 py-0.5 text-[11px]"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Change stage for ${application.role} at ${application.company}. Current stage: ${statusLabel(application.status)}`}
            className={`inline-flex max-w-full min-w-0 items-center rounded-full border font-medium whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${sizeClassName} ${applicationStatusClassName(application.status)}`}
          />
        }
      >
        <StatusLabel status={application.status} />
        <ChevronDown aria-hidden="true" className={`${size === "md" ? "size-3.5" : "size-3"} shrink-0`} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 gap-1 p-1">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Change stage</p>
        <div role="group" aria-label={`Stages for ${application.role} at ${application.company}`} className="flex flex-col">
          {applicationStatuses.map((status) => (
            <Button
              key={status}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={application.status === status}
              className={`w-full justify-start ${application.status === status ? "bg-muted" : ""}`}
              onClick={() => {
                onStatusChange(application.id, status)
                setOpen(false)
              }}
            >
              {statusLabel(status)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
