"use client"

import { useMemo, useState, type ReactNode } from "react"
import { format, parseISO } from "date-fns"
import { Building2, CircleDollarSign, ExternalLink, FileSearch, MapPin, Pencil, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { EditJobDetailsSheet, ExcitementPicker } from "@/components/edit-job-details-sheet"
import { StatusLabel } from "@/components/status-label"
import { useApplicationDetails } from "@/components/use-application-details"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { applicationStatusClassName, safeExternalUrl } from "@/lib/application-helpers"
import type { Application } from "@/lib/applications"
import { formatSalary, missingFromPosting, type JobDetails } from "@/lib/job-details"

const fieldNames: Partial<Record<keyof JobDetails, string>> = {
  salaryMin: "salary",
  location: "location",
  workArrangement: "work arrangement",
  employmentType: "employment type",
  level: "level",
  team: "team",
  equity: "equity",
  industry: "industry",
  companyWebsite: "website",
  source: "source",
}

function formatDate(value?: string) {
  return value ? format(parseISO(value), "MMM d, yyyy") : undefined
}

function Row({ label, value, href }: { label: string; value?: ReactNode; href?: string }) {
  const empty = value === undefined || value === null || value === ""
  return (
    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words text-sm ${empty ? "text-muted-foreground/60" : ""}`}>
        {empty ? (
          "—"
        ) : href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline">
            <span className="truncate">{value}</span>
            <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span className="whitespace-pre-line">{value}</span>
        )}
      </dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col divide-y divide-border">{children}</dl>
      </CardContent>
    </Card>
  )
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

export function ApplicationOverview({ application }: { application: Application }) {
  const { details, suggested, status, saveDetails } = useApplicationDetails(application)
  const [editing, setEditing] = useState(false)
  const [dismissedFill, setDismissedFill] = useState(false)
  const fill = useMemo(() => missingFromPosting(details, suggested), [details, suggested])
  const fillNames = [...new Set(Object.keys(fill).map((key) => fieldNames[key as keyof JobDetails]).filter(Boolean))] as string[]
  const salary = formatSalary(details)
  const postingUrl = safeExternalUrl(application.sourceUrl)
  const website = safeExternalUrl(details.companyWebsite)

  async function applyFill() {
    if (await saveDetails({ ...details, ...fill })) toast.success(`Filled in ${fillNames.length} detail${fillNames.length === 1 ? "" : "s"} from the posting`)
  }

  if (status === "loading") {
    return (
      <div aria-label="Loading details" className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-muted/60" />)}
      </div>
    )
  }

  if (status === "error") {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        Details couldn&apos;t be loaded. If you just set up the app, make sure the latest database script has been run, then refresh.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {fillNames.length > 0 && !dismissedFill && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <FileSearch aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm">
              Found in the posting: <span className="font-medium">{fillNames.join(", ")}</span>.
              <span className="block text-xs text-muted-foreground">Only empty fields are filled. Check them, especially salary.</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setDismissedFill(true)} aria-label="Dismiss">
              <X aria-hidden="true" />
            </Button>
            <Button type="button" size="sm" onClick={() => void applyFill()}>
              <Sparkles data-icon="inline-start" aria-hidden="true" />
              Fill from posting
            </Button>
          </div>
        </div>
      )}

      <section aria-label="At a glance" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Glance icon={<CircleDollarSign aria-hidden="true" className="size-3.5" />} label="Salary">
          {salary ?? <span className="text-muted-foreground/60">Not listed</span>}
        </Glance>
        <Glance icon={<MapPin aria-hidden="true" className="size-3.5" />} label="Location">
          <span className="block truncate" title={details.location}>
            {details.location || details.workArrangement || <span className="text-muted-foreground/60">Not set</span>}
          </span>
          {details.location && details.workArrangement && (
            <span className="text-xs font-normal text-muted-foreground">{details.workArrangement}</span>
          )}
        </Glance>
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

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium tracking-tight">Job details</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil data-icon="inline-start" aria-hidden="true" />
          Edit details
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Section title="Compensation">
          <Row label="Salary" value={salary} />
          <Row label="Equity" value={details.equity} />
          <Row label="Bonus" value={details.bonus} />
          <Row label="Benefits" value={details.benefits} />
        </Section>

        <Section title="Role">
          <Row label="Location" value={details.location} />
          <Row label="Work arrangement" value={details.workArrangement} />
          <Row label="Employment type" value={details.employmentType} />
          <Row label="Level" value={details.level} />
          <Row label="Team" value={details.team} />
        </Section>

        <Section title="Company">
          <Row label="Industry" value={details.industry} />
          <Row label="Stage" value={details.companyStage} />
          <Row label="Employees" value={details.companySize} />
          <Row label="Website" value={website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} href={website} />
        </Section>

        <Section title="Your take">
          <Row label="Excitement" value={details.excitement ? `${details.excitement} of 5` : undefined} />
          <Row label="What excites you" value={details.pros} />
          <Row label="Concerns" value={details.concerns} />
        </Section>

        <Section title="Posting & dates">
          <Row label="Job posting" value={postingUrl ? "View posting" : undefined} href={postingUrl} />
          <Row label="Found via" value={details.source} />
          <Row label="Referred by" value={details.referredBy} />
          <Row label="Applied" value={formatDate(application.appliedDate)} />
          <Row label="Deadline" value={formatDate(details.deadline)} />
        </Section>

        <Section title="Other details">
          {details.custom && details.custom.length > 0 ? (
            details.custom.map((field) => <Row key={field.id} label={field.label || "Untitled"} value={field.value} />)
          ) : (
            <div className="py-1 text-sm text-muted-foreground">
              Anything else worth tracking: visa sponsorship, interview format, team size…{" "}
              <button type="button" onClick={() => setEditing(true)} className="font-medium text-primary underline-offset-4 hover:underline">
                Add a field
              </button>
            </div>
          )}
        </Section>
      </div>

      <EditJobDetailsSheet
        open={editing}
        details={details}
        company={application.company}
        role={application.role}
        onOpenChange={setEditing}
        onSave={async (next) => {
          const saved = await saveDetails(next)
          if (saved) toast.success("Details saved")
          return saved
        }}
      />
    </div>
  )
}
