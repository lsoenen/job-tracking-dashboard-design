"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { format, parseISO } from "date-fns"
import { Building2, CircleDollarSign, MapPin, Pencil, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useApplications } from "@/components/applications-provider"
import { ExcitementPicker } from "@/components/edit-job-details-sheet"
import { ImportPostingDialog } from "@/components/import-posting-dialog"
import { JobDescriptionCard } from "@/components/job-description-card"
import { StatusLabel } from "@/components/status-label"
import { useApplicationDetails } from "@/components/use-application-details"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { applicationStatusClassName } from "@/lib/application-helpers"
import type { Application } from "@/lib/applications"
import { jobBoards } from "@/lib/jobs/sources"
import {
  detailsFromPosting,
  formatSalary,
  missingFromPosting,
  salaryPeriods,
  workArrangements,
  type JobDetails,
} from "@/lib/job-details"

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/** The fields the top cards show, which are filled from the description when empty */
const autoKeys = ["salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod", "location", "workArrangement"] as const

function formatDate(value?: string) {
  return value ? format(parseISO(value), "MMM d, yyyy") : undefined
}

function Glance({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="min-w-0 text-base font-medium">{children}</div>
    </div>
  )
}

/** A top card you can click to correct its value */
function EditableGlance({
  icon,
  label,
  editLabel,
  children,
  editor,
}: {
  icon: ReactNode
  label: string
  editLabel: string
  children: ReactNode
  editor: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={editLabel}
            className="group flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
          <Pencil aria-hidden="true" className="ml-auto size-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </span>
        <span className="block min-w-0 text-base font-medium">{children}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {editor(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

function SalaryEditor({ details, onSave, onDone }: { details: JobDetails; onSave: (patch: Partial<JobDetails>) => Promise<boolean>; onDone: () => void }) {
  const [min, setMin] = useState(details.salaryMin ? String(details.salaryMin) : "")
  const [max, setMax] = useState(details.salaryMax ? String(details.salaryMax) : "")
  const [period, setPeriod] = useState(details.salaryPeriod ?? "year")
  const [error, setError] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    const low = min ? Number(min) : undefined
    const high = max ? Number(max) : undefined
    if ((low !== undefined && !(low >= 0)) || (high !== undefined && !(high >= 0))) return setError("Enter numbers only.")
    if (low && high && low > high) return setError("The minimum is higher than the maximum.")
    if (await onSave({ salaryMin: low, salaryMax: high, salaryPeriod: low || high ? period : undefined, salaryCurrency: low || high ? details.salaryCurrency ?? "USD" : undefined })) onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-sm font-medium">Salary</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From
          <Input type="number" inputMode="numeric" min={0} step={1000} value={min} onChange={(event) => setMin(event.target.value)} autoFocus />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To
          <Input type="number" inputMode="numeric" min={0} step={1000} value={max} onChange={(event) => setMax(event.target.value)} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Per
        <select className={selectClassName} value={period} onChange={(event) => setPeriod(event.target.value as (typeof salaryPeriods)[number])}>
          {salaryPeriods.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm">Save</Button>
    </form>
  )
}

function LocationEditor({ details, onSave, onDone }: { details: JobDetails; onSave: (patch: Partial<JobDetails>) => Promise<boolean>; onDone: () => void }) {
  const [location, setLocation] = useState(details.location ?? "")
  const [arrangement, setArrangement] = useState(details.workArrangement ?? "")

  async function submit(event: FormEvent) {
    event.preventDefault()
    const saved = await onSave({
      location: location.trim() || undefined,
      workArrangement: (arrangement || undefined) as JobDetails["workArrangement"],
    })
    if (saved) onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-sm font-medium">Location</p>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        City or region
        <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Chicago, IL" maxLength={120} autoFocus />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Work arrangement
        <select className={selectClassName} value={arrangement} onChange={(event) => setArrangement(event.target.value)}>
          <option value="">Not set</option>
          {workArrangements.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <Button type="submit" size="sm">Save</Button>
    </form>
  )
}

export function ApplicationOverview({ application }: { application: Application }) {
  const { details, suggested, status, saveDetails, fallbackDescription } = useApplicationDetails(application)
  const { updateApplication } = useApplications()
  const [importing, setImporting] = useState(false)
  const descriptionText = details.postingText ?? fallbackDescription?.text
  const descriptionSource = details.postingText ? ("imported" as const) : fallbackDescription?.source

  // What the description says about the top cards. Structured posting data (e.g. a Canvas
  // job's location) fills gaps the text leaves.
  const fromDescription = useMemo<JobDetails>(() => {
    if (!descriptionText) return {}
    const known = jobBoards.find((board) => board.company.toLowerCase() === application.company.toLowerCase())
    const text = detailsFromPosting({ company: application.company, title: application.role, description: descriptionText, industry: known?.industry })
    const result: JobDetails = {}
    for (const key of autoKeys) {
      const value = text[key] ?? suggested[key]
      if (value !== undefined) (result as Record<string, unknown>)[key] = value
    }
    return result
  }, [descriptionText, suggested, application.company, application.role])

  // Fill the top cards from the description whenever they're empty, once per description
  const filledFor = useRef<string | null>(null)
  useEffect(() => {
    if (status !== "ready" || !descriptionText || filledFor.current === descriptionText) return
    filledFor.current = descriptionText
    const missing = missingFromPosting(details, fromDescription)
    if (Object.keys(missing).length > 0) void saveDetails({ ...details, ...missing })
  }, [status, descriptionText, details, fromDescription, saveDetails])

  async function savePatch(patch: Partial<JobDetails>) {
    const saved = await saveDetails({ ...details, ...patch })
    if (saved) toast.success("Saved")
    return saved
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-5">
        <div aria-label="Loading details" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-muted/60" />)}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  if (status === "error") {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        Details couldn&apos;t be loaded. Refresh the page to try again.
      </p>
    )
  }

  const salary = formatSalary(details)

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="At a glance" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EditableGlance
          icon={<CircleDollarSign aria-hidden="true" className="size-3.5" />}
          label="Salary"
          editLabel={`Salary: ${salary ?? "not listed"}. Edit`}
          editor={(close) => <SalaryEditor details={details} onSave={savePatch} onDone={close} />}
        >
          {salary ?? <span className="text-muted-foreground/60">Not listed</span>}
        </EditableGlance>

        <EditableGlance
          icon={<MapPin aria-hidden="true" className="size-3.5" />}
          label="Location"
          editLabel={`Location: ${details.location || details.workArrangement || "not set"}. Edit`}
          editor={(close) => <LocationEditor details={details} onSave={savePatch} onDone={close} />}
        >
          <span className="block truncate" title={details.location}>
            {details.location || details.workArrangement || <span className="text-muted-foreground/60">Not set</span>}
          </span>
          {details.location && details.workArrangement && (
            <span className="block text-xs font-normal text-muted-foreground">{details.workArrangement}</span>
          )}
        </EditableGlance>

        <Glance icon={<Sparkles aria-hidden="true" className="size-3.5" />} label="Excitement">
          <ExcitementPicker size="sm" value={details.excitement} onChange={(excitement) => void saveDetails({ ...details, excitement })} />
        </Glance>

        <Glance icon={<Building2 aria-hidden="true" className="size-3.5" />} label="Stage">
          <Badge variant="outline" className={`font-normal ${applicationStatusClassName(application.status)}`}>
            <StatusLabel status={application.status} />
          </Badge>
          <span className="block text-xs font-normal text-muted-foreground">
            {application.appliedDate ? `Applied ${formatDate(application.appliedDate)}` : "Not applied yet"}
          </span>
        </Glance>
      </section>

      <JobDescriptionCard
        text={descriptionText}
        source={descriptionSource}
        onImport={() => setImporting(true)}
        onSave={async (text) => {
          const saved = await saveDetails({ ...details, postingText: text || undefined })
          if (saved) toast.success(text ? "Description saved" : "Description removed")
          return saved
        }}
      />

      <ImportPostingDialog
        open={importing}
        application={application}
        details={details}
        onOpenChange={setImporting}
        onApply={async (next, postingUrl) => {
          const saved = await saveDetails(next)
          if (!saved) return false
          if (postingUrl) await updateApplication(application.id, { sourceUrl: postingUrl })
          toast.success("Posting imported")
          return true
        }}
      />
    </div>
  )
}
