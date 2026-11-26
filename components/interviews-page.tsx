"use client"

import Link from "next/link"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  MessageSquareText,
  PenLine,
  UsersRound,
  UserRound,
} from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Application } from "@/lib/applications"
import { getInterviewPersona, interviewPersonas } from "@/lib/interview-prep"

const personaIcons = [MessageSquareText, BriefcaseBusiness, PenLine, UsersRound, UserRound]

function getPersonaSlug(application: Application) {
  const nextStep = application.nextStep.toLowerCase()

  if (/(recruiter screen|recruiter interview|interview with recruiter)/.test(nextStep)) return "recruiter"
  if (/(design|take-home|exercise|portfolio|craft)/.test(nextStep)) return "design-lead"
  if (/(cross-functional|team|partner|collaboration)/.test(nextStep)) return "cross-functional"
  if (/(executive|leadership|final)/.test(nextStep)) return "executive"

  return "hiring-manager"
}

export function InterviewsPage() {
  const { applications, interviewProgress } = useApplications()
  const interviewApplications = applications.filter((application) => application.status === "Interviewing")

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="interview" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Your preparation space</p>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Interview prep</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Focus on the conversations that are already in motion. Your next step is always one click away.
              </p>
            </div>
            <Link href="/applications" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View applications <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </section>

          <section aria-labelledby="in-interview-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="in-interview-title" className="text-base font-medium tracking-tight">In interview</h2>
                <p className="mt-1 text-xs text-muted-foreground">A focused prep plan for each active interview process. Progress lasts for this session.</p>
              </div>
              <Badge variant="outline" className="rounded-full font-normal">
                {interviewApplications.length} {interviewApplications.length === 1 ? "company" : "companies"}
              </Badge>
            </div>

            {interviewApplications.length > 0 ? (
              <ul className="grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
                {interviewApplications.map((application) => {
                  const personaSlug = getPersonaSlug(application)
                  const persona = getInterviewPersona(personaSlug)
                  const totalSteps = persona?.questions.length ?? 4
                  const completedSteps = Math.min(interviewProgress[`${application.id}:${personaSlug}`]?.length ?? 0, totalSteps)

                  return (
                    <li key={application.id} className="min-w-0">
                      <Link
                        href={`/interviews/${personaSlug}?applicationId=${encodeURIComponent(application.id)}`}
                        aria-label={`Prepare for ${application.company}, ${completedSteps} of ${totalSteps} steps complete`}
                        className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <Card className="h-full border-border shadow-none transition-colors group-hover:border-muted-foreground/40">
                          <CardContent className="flex h-full flex-col p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <Avatar className="size-10 shrink-0 border border-border bg-muted">
                                {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
                                <AvatarFallback className="text-xs font-medium text-muted-foreground">{application.initials}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{application.company}</p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">{application.role}</p>
                              </div>
                              <ArrowRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-3">
                              <Badge variant="secondary" className="font-normal">{persona?.label ?? "Hiring manager"}</Badge>
                              {application.due !== "—" && (
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CalendarDays aria-hidden="true" className="size-3.5" />
                                  {application.due}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 truncate text-xs text-muted-foreground">Next: {application.nextStep}</p>

                            <div className="mt-auto pt-5">
                              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                <span className="font-medium">Preparation progress</span>
                                <span className="tabular-nums text-muted-foreground">{completedSteps} of {totalSteps} steps</span>
                              </div>
                              <div
                                role="progressbar"
                                aria-label={`${application.company} interview preparation`}
                                aria-valuemin={0}
                                aria-valuemax={totalSteps}
                                aria-valuenow={completedSteps}
                                className="flex gap-1.5"
                              >
                                {Array.from({ length: totalSteps }, (_, index) => (
                                  <span
                                    key={index}
                                    aria-hidden="true"
                                    className={`h-1.5 flex-1 rounded-full ${index < completedSteps ? "bg-primary" : "bg-muted"}`}
                                  />
                                ))}
                              </div>
                              <p className="mt-4 text-xs font-medium text-foreground group-hover:text-primary">
                                Continue preparation <span aria-hidden="true">→</span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Card className="border-dashed border-border bg-transparent shadow-none">
                <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="text-sm font-medium">Nothing in interview yet</h3>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                      When an application moves to Interviewing, its prep card will show up here automatically.
                    </p>
                  </div>
                  <Link href="/applications" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Update an application <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          <details className="group mt-8 rounded-xl border border-border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5">
              <span>
                <span className="block text-sm font-medium">Practice by interviewer</span>
                <span className="mt-1 block text-xs text-muted-foreground">Browse question sets outside an active interview.</span>
              </span>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-4 sm:p-5">
              <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                {interviewPersonas.map((persona, index) => {
                  const Icon = personaIcons[index]
                  if (!Icon) return null

                  return (
                    <li key={persona.slug} className="min-w-0">
                      <Link
                        href={`/interviews/${persona.slug}`}
                        aria-label={`Practice with a ${persona.label.toLowerCase()}: ${persona.title}`}
                        className="group/persona block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <Card className="h-full border-border shadow-none transition-colors group-hover/persona:border-muted-foreground/40">
                          <CardContent className="flex h-full items-start gap-3 p-4">
                            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{persona.label}</span>
                                <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/persona:translate-x-0.5" />
                              </span>
                              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{persona.focus}</span>
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </details>
        </main>
      </div>
    </div>
  )
}
