"use client"

import { useState, type DragEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Code2,
  MessageSquareText,
  PenLine,
  Trophy,
  UsersRound,
  UserRound,
} from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isInterviewStatus, interviewStatuses, type Application } from "@/lib/applications"
import { interviewPersonas } from "@/lib/interview-prep"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const personaIcons = [MessageSquareText, BriefcaseBusiness, PenLine, UsersRound, UserRound]
type InterviewStage = (typeof interviewStatuses)[number]

const interviewStages: {
  id: string
  status: InterviewStage
  title: string
  description: string
  icon: typeof MessageSquareText
}[] = [
  { id: "recruiter", status: "Recruiter screen", title: "Recruiter", description: "Recruiter screen", icon: MessageSquareText },
  { id: "hiring-manager", status: "Interviewing", title: "Hiring manager", description: "Hiring manager interview", icon: BriefcaseBusiness },
  { id: "team-technical-case", status: "Team, Technical, Case", title: "Team, Technical, Case", description: "Team, technical, or case interview", icon: Code2 },
  { id: "final-executive", status: "Final or Executive Round", title: "Final or Executive Round", description: "Final or executive round", icon: Trophy },
]

function isActiveInterview(application: Application) {
  return isInterviewStatus(application.status)
}

export function InterviewsPage() {
  const { applications, updateApplicationStatus } = useApplications()
  const [dragOverStage, setDragOverStage] = useState<InterviewStage | null>(null)
  const [announcement, setAnnouncement] = useState("")
  const interviewApplications = applications.filter(isActiveInterview)

  function moveApplication(applicationId: string, status: InterviewStage) {
    const application = interviewApplications.find((item) => item.id === applicationId)
    if (!application || application.status === status) return

    updateApplicationStatus(applicationId, status)
    const stageTitle = interviewStages.find((stage) => stage.status === status)?.title ?? status
    setAnnouncement(`${application.company} moved to ${stageTitle}.`)
  }

  function handleDrop(status: InterviewStage, event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const applicationId = event.dataTransfer.getData("text/plain")
    if (applicationId) moveApplication(applicationId, status)
    setDragOverStage(null)
  }

  function handleCardKeyDown(application: Application, event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    if (event.target instanceof HTMLElement && event.target.closest("button")) return

    event.preventDefault()
    const currentIndex = interviewStages.findIndex((stage) => stage.status === application.status)
    if (currentIndex < 0) return

    const direction = event.key === "ArrowRight" ? 1 : -1
    const destinationIndex = Math.min(Math.max(currentIndex + direction, 0), interviewStages.length - 1)
    const destination = interviewStages[destinationIndex]
    if (destination) moveApplication(application.id, destination.status)
  }

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
                Keep active conversations moving from recruiter screen through the final round.
              </p>
            </div>
            <Link href="/applications" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View applications <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </section>

          <section aria-labelledby="in-interview-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="in-interview-title" className="text-base font-medium tracking-tight">Interview pipeline</h2>
                <p className="mt-1 text-xs text-muted-foreground">Drag a job to another stage, or focus a card and use the arrow keys.</p>
              </div>
              <Badge variant="outline" className="rounded-full font-normal">
                {interviewApplications.length} {interviewApplications.length === 1 ? "active interview" : "active interviews"}
              </Badge>
            </div>

            <p id="kanban-keyboard-help" className="sr-only">Use the left and right arrow keys to move this job between interview stages.</p>
            <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              <div className="grid min-w-[840px] grid-cols-4 gap-3">
                {interviewStages.map((stage) => {
                  const stageApplications = interviewApplications.filter((application) => application.status === stage.status)
                  const StageIcon = stage.icon

                  return (
                    <section
                      key={stage.status}
                      aria-labelledby={`stage-${stage.id}`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = "move"
                      setDragOverStage(stage.status)
                    }}
                    onDragLeave={() => setDragOverStage(null)}
                    onDrop={(event) => handleDrop(stage.status, event)}
                    className={`min-w-0 rounded-xl border p-3 transition-colors sm:p-4 ${dragOverStage === stage.status ? "border-primary/50 bg-primary/[0.04]" : "border-border bg-muted/20"}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 id={`stage-${stage.id}`} className="text-sm font-semibold tracking-tight">{stage.title}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                      </div>
                      <Badge variant="secondary" className="min-w-7 justify-center rounded-full tabular-nums">
                        {stageApplications.length}
                      </Badge>
                    </div>

                    {stageApplications.length > 0 ? (
                      <ul className="flex list-none flex-col gap-2 p-0">
                        {stageApplications.map((application) => (
                          <li key={application.id}>
                            <article
                              draggable
                              tabIndex={0}
                              aria-label={`${application.role} at ${application.company}, ${stage.title} stage`}
                              aria-describedby="kanban-keyboard-help"
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", application.id)
                                event.dataTransfer.effectAllowed = "move"
                              }}
                              onDragEnd={() => setDragOverStage(null)}
                              onKeyDown={(event) => handleCardKeyDown(application, event)}
                              className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              <Card className="border-border shadow-none transition-colors group-hover:border-muted-foreground/40 group-focus-visible:border-ring">
                                <CardContent className="flex flex-col gap-3 p-3">
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <Avatar className="size-8 shrink-0 border border-border bg-muted">
                                      {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
                                      <AvatarFallback className="text-[10px] font-medium text-muted-foreground">{application.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="truncate text-sm font-semibold leading-snug">{application.role}</h4>
                                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{application.company}</p>
                                    </div>
                                  </div>
                                  <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-2.5 xl:flex-row xl:items-center xl:justify-between">
                                    <p title={application.nextStep} className="min-w-0 truncate text-[11px] text-muted-foreground">{application.nextStep}</p>
                                    <div className="flex shrink-0 items-center justify-between gap-2 xl:justify-start">
                                      {application.due !== "—" && (
                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                          <CalendarDays aria-hidden="true" className="size-3" />
                                          {application.due}
                                        </span>
                                      )}
                                      <Button type="button" variant="outline" size="xs" disabled aria-label="Practice, coming soon">
                                        Practice
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </article>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty className="min-h-48 gap-3 rounded-lg border bg-background/60 px-4 py-6">
                        <EmptyHeader className="gap-1.5">
                          <EmptyMedia variant="icon" className="mb-1 size-11 rounded-full border border-border bg-muted/60 text-muted-foreground">
                            <StageIcon aria-hidden="true" className="size-5" />
                          </EmptyMedia>
                          <EmptyTitle className="text-xs">Nothing here just yet</EmptyTitle>
                          <EmptyDescription className="max-w-44 text-[11px] leading-relaxed">
                            Drop an application here when it advances to {stage.description.toLowerCase()}.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
                  </section>
                  )
                })}
              </div>
            </div>
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
