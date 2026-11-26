"use client"

import { CalendarDays, Check, Plus } from "lucide-react"

import { useApplications } from "@/components/applications-provider"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { canvasJobs } from "@/lib/canvas-jobs"

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

export function CanvasPage() {
  const { applications, addApplication } = useApplications()
  const recommendedJobs = [...canvasJobs].sort((first, second) => second.postedAt.localeCompare(first.postedAt))

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="canvas" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Canvas</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sample product design roles across LinkedIn, Indeed, Wellfound, Wellhub, and more.</p>
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
                const isAdded = applications.some(
                  (application) =>
                    application.company.toLowerCase() === job.company.toLowerCase() &&
                    application.role.toLowerCase() === job.title.toLowerCase(),
                )
                const postedDate = formatPostedDate(job.postedAt)

                return (
                  <li key={job.id} className="min-w-0">
                    <Card className="h-full border-border shadow-none transition-colors hover:border-muted-foreground/40">
                      <CardContent className="flex h-full flex-col gap-5 p-4 sm:p-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-11 shrink-0 rounded-xl border border-border bg-background">
                            <AvatarImage src={job.logo} alt={`${job.company} logo`} className="object-contain p-2" />
                            <AvatarFallback className="rounded-xl bg-muted text-xs font-medium text-muted-foreground">
                              {companyInitials(job.company)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-muted-foreground">{job.company}</p>
                            <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{job.title}</h3>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                          <div className="flex flex-col gap-1.5">
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                              Posted {postedDate}
                            </p>
                            <p className="text-xs text-muted-foreground">Source: {job.source}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={isAdded ? "secondary" : "outline"}
                            disabled={isAdded}
                            aria-label={`${isAdded ? "Added" : "Add to list"}: ${job.title} at ${job.company}`}
                            onClick={() =>
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
                          >
                            {isAdded ? (
                              <Check data-icon="inline-start" aria-hidden="true" />
                            ) : (
                              <Plus data-icon="inline-start" aria-hidden="true" />
                            )}
                            {isAdded ? "Added" : "Add to list"}
                          </Button>
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
  )
}
