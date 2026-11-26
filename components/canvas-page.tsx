"use client"

import { useState } from "react"
import { CalendarDays, Check, Plus } from "lucide-react"

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
import { calculateJobFitScore } from "@/lib/job-fit"
import { canvasJobs, type CanvasJob } from "@/lib/canvas-jobs"

function formatPostedDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function companyInitials(company: string) {
  return company
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

function isJobAdded(job: CanvasJob, applications: { company: string; role: string }[]) {
  return applications.some(
    (application) =>
      application.company.toLowerCase() === job.company.toLowerCase() &&
      application.role.toLowerCase() === job.title.toLowerCase(),
  )
}

export function CanvasPage() {
  const { applications, addApplication } = useApplications()
  const { profile } = useJobProfile()
  const [selectedJob, setSelectedJob] = useState<CanvasJob | null>(null)
  const recommendedJobs = [...canvasJobs].sort((first, second) => second.postedAt.localeCompare(first.postedAt))
  const selectedJobIsAdded = selectedJob ? isJobAdded(selectedJob, applications) : false
  const selectedFitScore = selectedJob ? calculateJobFitScore(selectedJob, profile) : 0

  function addJobToList(job: CanvasJob) {
    if (isJobAdded(job, applications)) return

    const postedDate = formatPostedDate(job.postedAt)
    addApplication({
      company: job.company,
      role: job.title,
      logo: job.logo,
      description: `${job.summary} Posted ${postedDate}. Source: ${job.source}.`,
      status: "Interested",
      nextStep: "Review the job posting",
      due: "—",
    })
  }

  return (
    <Dialog open={selectedJob !== null} onOpenChange={(open) => { if (!open) setSelectedJob(null) }}>
      <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="canvas" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Canvas</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sample product design roles across LinkedIn, Indeed, Wellfound, Wellhub, and more.</p>
              <p className="mt-1 text-xs text-muted-foreground">Fit estimates use your profile skills and background; the sample resume is not parsed.</p>
            </div>
            <p className="text-xs text-muted-foreground">Mock data · Newest first</p>
          </section>

          <section aria-labelledby="recommended-roles-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="recommended-roles-title" className="text-base font-medium tracking-tight">Recommended roles</h2>
              <span className="text-xs text-muted-foreground">{recommendedJobs.length} roles</span>
            </div>

            <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {recommendedJobs.map((job) => {
                const isAdded = isJobAdded(job, applications)
                const postedDate = formatPostedDate(job.postedAt)
                const fitScore = calculateJobFitScore(job, profile)

                return (
                  <li key={job.id} className="min-w-0">
                    <Card className="h-full border-border shadow-none transition-colors hover:border-muted-foreground/40">
                      <CardContent className="flex h-full flex-col gap-5 p-4 sm:p-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar className="size-11 shrink-0 rounded-xl border border-border bg-background">
                            <AvatarImage src={job.logo} alt={`${job.company} logo`} className="object-contain p-2" />
                            <AvatarFallback className="rounded-xl bg-muted text-xs font-medium text-muted-foreground">
                              {companyInitials(job.company)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-muted-foreground">{job.company}</p>
                            <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{job.title}</h3>
                          </div>
                          <Badge
                            variant={fitScore >= 75 ? "secondary" : "outline"}
                            className="mt-0.5 shrink-0"
                            aria-label={`Fit Score: ${fitScore}%`}
                          >
                            {fitScore}% fit
                          </Badge>
                        </div>

                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{job.summary}</p>

                        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
                          <div className="flex flex-col gap-1.5">
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                              Posted {postedDate}
                            </p>
                            <p className="text-xs text-muted-foreground">Source: {job.source}</p>
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
                            <Button
                              type="button"
                              size="sm"
                              variant={isAdded ? "secondary" : "outline"}
                              disabled={isAdded}
                              aria-label={`${isAdded ? "Added" : "Add to list"}: ${job.title} at ${job.company}`}
                              onClick={() => addJobToList(job)}
                            >
                              {isAdded ? (
                                <Check data-icon="inline-start" aria-hidden="true" />
                              ) : (
                                <Plus data-icon="inline-start" aria-hidden="true" />
                              )}
                              {isAdded ? "Added" : "Add to list"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </section>
        </main>
      </div>
      </div>

      {selectedJob && (
        <DialogContent className="p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border px-6 py-5 pr-14">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar className="size-11 shrink-0 rounded-xl border border-border bg-background">
                <AvatarImage src={selectedJob.logo} alt={`${selectedJob.company} logo`} className="object-contain p-2" />
                <AvatarFallback className="rounded-xl bg-muted text-xs font-medium text-muted-foreground">
                  {companyInitials(selectedJob.company)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{selectedJob.company}</p>
                <DialogTitle className="mt-1 pr-2 text-base leading-snug">{selectedJob.title}</DialogTitle>
              </div>
              <Badge variant={selectedFitScore >= 75 ? "secondary" : "outline"} className="mt-0.5 shrink-0">
                {selectedFitScore}% fit
              </Badge>
            </div>
            <DialogDescription className="leading-relaxed">{selectedJob.summary}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 overflow-y-auto p-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Minimum experience</dt>
                <dd className="mt-1 text-sm font-medium">{selectedJob.minimumExperienceYears}+ years</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs text-muted-foreground">Posted</dt>
                <dd className="mt-1 text-sm font-medium">{formatPostedDate(selectedJob.postedAt)}</dd>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-muted/20 p-3 sm:col-span-1">
                <dt className="text-xs text-muted-foreground">Listing source</dt>
                <dd className="mt-1 text-sm font-medium">{selectedJob.source}</dd>
              </div>
            </dl>

            <section aria-labelledby="role-match-terms-title" className="flex flex-col gap-3">
              <h3 id="role-match-terms-title" className="text-sm font-medium">Role match terms</h3>
              <ul className="flex list-none flex-wrap gap-2 p-0">
                {selectedJob.matchTerms.map((term) => (
                  <li key={term}>
                    <Badge variant="outline" className="font-normal">{term}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
            <Button type="button" disabled={selectedJobIsAdded} onClick={() => addJobToList(selectedJob)}>
              {selectedJobIsAdded ? (
                <Check data-icon="inline-start" aria-hidden="true" />
              ) : (
                <Plus data-icon="inline-start" aria-hidden="true" />
              )}
              {selectedJobIsAdded ? "Added" : "Add to list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
