"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, Check, ExternalLink, LoaderCircle, MapPin, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { useApplications } from "@/components/applications-provider"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useJobProfile } from "@/components/job-profile-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { companyInitials } from "@/lib/data"
import { calculateJobFit } from "@/lib/job-fit"
import { companyLogoUrl } from "@/lib/jobs/sources"
import { sourceLabels, type CanvasJob } from "@/lib/jobs/types"
import { createClient } from "@/lib/supabase/client"

const pageSize = 24

function formatPostedDate(value?: string) {
  if (!value) return "Date not listed"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

function getFitPresentation(score: number) {
  if (score >= 70) return { label: "Strong fit", className: "border-success/20 bg-success/5 text-success" }
  if (score >= 45) return { label: "Possible fit", className: "border-border bg-muted text-muted-foreground" }
  return { label: "Low fit", className: "border-warning/20 bg-warning/5 text-warning" }
}

function isJobAdded(job: CanvasJob, applications: { company: string; role: string; canvasJobId?: string }[]) {
  return applications.some(
    (application) =>
      application.canvasJobId === job.id ||
      (application.company.toLowerCase() === job.company.toLowerCase() &&
        application.role.toLowerCase() === job.title.toLowerCase()),
  )
}

function shortLocation(job: CanvasJob) {
  const first = job.location?.split("•")[0]?.trim()
  if (!first) return job.isRemote ? "Remote" : undefined
  const more = (job.location?.split("•").length ?? 1) - 1
  return `${first}${more > 0 ? ` +${more}` : ""}${job.isRemote && !/remote/i.test(first) ? " · Remote" : ""}`
}

function CompanyLogo({ job }: { job: CanvasJob }) {
  return (
    <Avatar className="size-11 shrink-0 rounded-xl border border-border bg-background">
      <AvatarImage src={companyLogoUrl(job.companyDomain)} alt={`${job.company} logo`} className="object-contain p-2" />
      <AvatarFallback className="rounded-xl bg-muted text-xs font-medium text-muted-foreground">
        {companyInitials(job.company)}
      </AvatarFallback>
    </Avatar>
  )
}

/** Renders plain-text job descriptions: blank lines split paragraphs, "• " lines become bullets */
function JobDescription({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim())
        const bullets = lines.filter((line) => line.startsWith("• "))
        const intro = lines.filter((line) => !line.startsWith("• "))

        return (
          <div key={blockIndex} className="flex flex-col gap-2">
            {intro.map((line, lineIndex) => {
              const isHeading = line.length < 70 && !/[.!?]$/.test(line) && (bullets.length > 0 || lines.length === 1)
              return isHeading ? (
                <h4 key={lineIndex} className="font-medium text-foreground">{line}</h4>
              ) : (
                <p key={lineIndex}>{line}</p>
              )
            })}
            {bullets.length > 0 && (
              <ul className="flex list-disc flex-col gap-1.5 pl-5">
                {bullets.map((line, lineIndex) => <li key={lineIndex}>{line.slice(2)}</li>)}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CanvasPage({
  jobs,
  familyLabels,
  headlineMatched,
  loadFailed,
}: {
  jobs: CanvasJob[]
  familyLabels: string[]
  headlineMatched: boolean
  loadFailed: boolean
}) {
  const { applications, addApplication } = useApplications()
  const { profile } = useJobProfile()
  const [selectedJob, setSelectedJob] = useState<CanvasJob | null>(null)
  const [description, setDescription] = useState<{ jobId: string; text: string | null } | null>(null)
  const [query, setQuery] = useState("")
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [sort, setSort] = useState<"fit" | "newest">("fit")
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [addingId, setAddingId] = useState<string | null>(null)

  const scoredJobs = useMemo(
    () => jobs.map((job) => ({ job, fit: calculateJobFit(job, profile) })),
    [jobs, profile],
  )

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const rows = scoredJobs.filter(({ job }) => {
      if (remoteOnly && !job.isRemote) return false
      if (!normalizedQuery) return true
      return [job.title, job.company, job.location ?? "", job.department ?? ""].join(" ").toLowerCase().includes(normalizedQuery)
    })

    return rows.sort((left, right) =>
      sort === "fit"
        ? right.fit.score - left.fit.score || (right.job.postedAt ?? "").localeCompare(left.job.postedAt ?? "")
        : (right.job.postedAt ?? "").localeCompare(left.job.postedAt ?? ""),
    )
  }, [scoredJobs, query, remoteOnly, sort])

  const companyCount = useMemo(() => new Set(jobs.map((job) => job.company)).size, [jobs])
  const visibleJobs = filteredJobs.slice(0, visibleCount)
  const selectedFit = selectedJob ? calculateJobFit(selectedJob, profile) : null
  const selectedFitPresentation = selectedFit ? getFitPresentation(selectedFit.score) : null
  const selectedJobIsAdded = selectedJob ? isJobAdded(selectedJob, applications) : false

  // Load the full description only when someone opens a job
  useEffect(() => {
    if (!selectedJob || description?.jobId === selectedJob.id) return
    let cancelled = false

    createClient()
      .from("jobs")
      .select("description")
      .eq("id", selectedJob.id)
      .maybeSingle()
      .then(({ data }: { data: { description?: string } | null }) => {
        if (!cancelled) setDescription({ jobId: selectedJob.id, text: data?.description ?? "" })
      })

    return () => {
      cancelled = true
    }
  }, [selectedJob, description?.jobId])

  async function addJobToList(job: CanvasJob) {
    if (isJobAdded(job, applications)) return

    setAddingId(job.id)
    const created = await addApplication({
      company: job.company,
      role: job.title,
      logo: companyLogoUrl(job.companyDomain),
      description: job.summary,
      sourceUrl: job.url,
      status: "Interested",
      canvasJobId: job.id,
      nextStep: "",
    })
    setAddingId(null)

    if (created) {
      toast("Added to application tracker", {
        style: { background: "#000", color: "#fff", border: "1px solid #000" },
      })
    }
  }

  function AddButton({ job, variant }: { job: CanvasJob; variant: "card" | "dialog" }) {
    const isAdded = isJobAdded(job, applications)
    const isAdding = addingId === job.id

    return (
      <Button
        type="button"
        size={variant === "card" ? "sm" : "default"}
        variant={variant === "dialog" ? "default" : isAdded ? "secondary" : "outline"}
        disabled={isAdded || isAdding}
        aria-label={`${isAdded ? "Already tracked" : "I'm interested"}: ${job.title} at ${job.company}`}
        onClick={() => addJobToList(job)}
      >
        {isAdding ? (
          <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
        ) : isAdded ? (
          <Check data-icon="inline-start" aria-hidden="true" />
        ) : (
          <Plus data-icon="inline-start" aria-hidden="true" />
        )}
        {isAdded ? "Already tracked" : "I'm interested"}
      </Button>
    )
  }

  return (
    <Dialog open={selectedJob !== null} onOpenChange={(open) => { if (!open) setSelectedJob(null) }}>
      <div className="flex min-h-screen bg-background text-foreground">
        <DashboardSidebar activePage="canvas" />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
            <section aria-labelledby="page-title" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Canvas</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Open {familyLabels.join(" and ").toLowerCase()} roles from {companyCount || "top"} companies&apos; own job boards,
                  refreshed daily. Add interesting roles straight to your tracker.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fit scores compare each role with your headline, skills, and experience.{" "}
                  <Link href="/account" className="underline-offset-4 hover:text-foreground hover:underline">Update your profile</Link>
                </p>
              </div>
            </section>

            {!headlineMatched && (
              <p role="status" className="mb-5 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                Canvas currently covers {familyLabels.join(", ").toLowerCase()} roles. Add a headline like &quot;Product
                designer&quot; on your <Link href="/account" className="font-medium underline-offset-4 hover:underline">Account</Link>{" "}
                page for better matches.
              </p>
            )}

            <section aria-labelledby="recommended-roles-title">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-baseline gap-3">
                  <h2 id="recommended-roles-title" className="text-base font-medium tracking-tight">Recommended roles</h2>
                  <span className="text-xs text-muted-foreground">{filteredJobs.length} roles</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 sm:w-72">
                    <Search aria-hidden="true" className="size-4 shrink-0" />
                    <span className="sr-only">Search roles</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setVisibleCount(pageSize)
                      }}
                      placeholder="Search title, company, or location"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={remoteOnly ? "default" : "outline"}
                      aria-pressed={remoteOnly}
                      onClick={() => {
                        setRemoteOnly((current) => !current)
                        setVisibleCount(pageSize)
                      }}
                    >
                      Remote only
                    </Button>
                    <div role="group" aria-label="Sort roles" className="flex rounded-lg border border-border p-0.5">
                      {(["fit", "newest"] as const).map((option) => (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={sort === option ? "secondary" : "ghost"}
                          aria-pressed={sort === option}
                          className="h-7"
                          onClick={() => setSort(option)}
                        >
                          {option === "fit" ? "Best fit" : "Newest"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {jobs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  {loadFailed
                    ? "Roles couldn't be loaded right now. Refresh to try again."
                    : "No roles yet. They'll appear after the next daily refresh."}
                </p>
              ) : filteredJobs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No roles match those filters.
                </p>
              ) : (
                <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleJobs.map(({ job, fit }) => {
                    const fitPresentation = getFitPresentation(fit.score)
                    const location = shortLocation(job)

                    return (
                      <li key={job.id} className="min-w-0">
                        <Card className="h-full border-border shadow-none transition-colors hover:border-muted-foreground/40">
                          <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
                            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:flex">
                              <CompanyLogo job={job} />
                              <div className="min-w-0 sm:flex-1">
                                <h3 className="text-sm font-medium leading-snug sm:line-clamp-2">{job.title}</h3>
                                <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{job.company}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={`col-span-2 mt-0.5 w-fit ${fitPresentation.className} sm:shrink-0`}
                                aria-label={`${fitPresentation.label}: ${fit.score}%`}
                              >
                                {fitPresentation.label} · {fit.score}%
                              </Badge>
                            </div>

                            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{job.summary}</p>

                            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
                              <div className="flex min-w-0 flex-col gap-1.5">
                                {location && (
                                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                                    <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                                    <span className="truncate">{location}</span>
                                  </p>
                                )}
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                                  Posted {formatPostedDate(job.postedAt)}
                                </p>
                              </div>
                              <div className="flex gap-2 sm:shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  aria-haspopup="dialog"
                                  aria-label={`View details: ${job.title} at ${job.company}`}
                                  onClick={() => setSelectedJob(job)}
                                >
                                  View details
                                </Button>
                                <AddButton job={job} variant="card" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    )
                  })}
                </ul>
              )}

              {filteredJobs.length > visibleCount && (
                <div className="mt-5 flex justify-center">
                  <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + pageSize)}>
                    Show more ({filteredJobs.length - visibleCount} left)
                  </Button>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {selectedJob && selectedFit && selectedFitPresentation && (
        <DialogContent className="p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-5 pr-14">
            <div className="flex min-w-0 items-start gap-3">
              <CompanyLogo job={selectedJob} />
              <div className="min-w-0 flex-1">
                <DialogTitle className="pr-2 text-base leading-snug">{selectedJob.title}</DialogTitle>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{selectedJob.company}</p>
              </div>
              <Badge
                variant="outline"
                className={`mt-0.5 shrink-0 ${selectedFitPresentation.className}`}
                aria-label={`${selectedFitPresentation.label}: ${selectedFit.score}%`}
              >
                {selectedFitPresentation.label} · {selectedFit.score}%
              </Badge>
            </div>
            <DialogDescription className="leading-relaxed">{selectedJob.summary}</DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd className="mt-1 text-sm font-medium">
                  {selectedJob.location || "Not listed"}
                  {selectedJob.isRemote && !/remote/i.test(selectedJob.location ?? "") ? " · Remote" : ""}
                </dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Posted</dt>
                <dd className="mt-1 text-sm font-medium">{formatPostedDate(selectedJob.postedAt)}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Typical experience</dt>
                <dd className="mt-1 text-sm font-medium">{selectedJob.minYears === 0 ? "Entry level" : `${selectedJob.minYears}+ years`}</dd>
              </div>
            </dl>

            {selectedFit.matchedSkills.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Your skills this role mentions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFit.matchedSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="font-normal">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            <section aria-labelledby="role-description-title" className="flex flex-col gap-3">
              <h3 id="role-description-title" className="text-sm font-medium">About the role</h3>
              {description?.jobId === selectedJob.id ? (
                description.text ? (
                  <JobDescription text={description.text} />
                ) : (
                  <p className="text-sm text-muted-foreground">No description available. View the full posting for details.</p>
                )
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Loading description…
                </p>
              )}
            </section>
          </div>

          <DialogFooter className="sm:justify-between">
            <a
              href={selectedJob.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View posting on {sourceLabels[selectedJob.source]}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
            <div className="flex gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
              <AddButton job={selectedJob} variant="dialog" />
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
