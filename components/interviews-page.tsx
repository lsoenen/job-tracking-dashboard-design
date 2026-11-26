"use client"

import Link from "next/link"
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  MessageSquareText,
  PenLine,
  UsersRound,
  UserRound,
} from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useApplications } from "@/components/applications-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Application } from "@/lib/applications"
import { interviewPersonas } from "@/lib/interview-prep"

const interviewStages: {
  title: string
  description: string
  personaSlug: string
  actionLabel: string
  matches: (application: Application) => boolean
  icon: typeof MessageSquareText
}[] = [
  {
    title: "Recruiter screen",
    description: "Your story, role fit, and the first conversation.",
    personaSlug: "recruiter",
    actionLabel: "Practice recruiter questions",
    matches: (application) => application.status === "Recruiter screen",
    icon: MessageSquareText,
  },
  {
    title: "Hiring manager",
    description: "Ownership, judgment, and how you work through problems.",
    personaSlug: "hiring-manager",
    actionLabel: "Practice with a hiring manager",
    matches: (application) =>
      application.status === "Interviewing" && application.nextStep.toLowerCase().includes("hiring manager"),
    icon: UserRound,
  },
  {
    title: "Skills & craft",
    description: "Case studies, practical exercises, and your decision-making.",
    personaSlug: "design-lead",
    actionLabel: "Practice design questions",
    matches: (application) => application.status === "Take-home",
    icon: PenLine,
  },
  {
    title: "Team & final rounds",
    description: "Collaboration, cross-functional work, and bigger-picture fit.",
    personaSlug: "cross-functional",
    actionLabel: "Practice team questions",
    matches: (application) =>
      application.status === "Interviewing" && !application.nextStep.toLowerCase().includes("hiring manager"),
    icon: UsersRound,
  },
]

const personaIcons = [MessageSquareText, BriefcaseBusiness, PenLine, UsersRound, Building2]

export function InterviewsPage() {
  const { applications } = useApplications()
  const activeStageCount = applications.filter((application) =>
    ["Recruiter screen", "Interviewing", "Take-home"].includes(application.status),
  ).length

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="interview" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Your preparation space</p>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Interview</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Get ready for the people, questions, and decisions behind each conversation.
              </p>
            </div>
            <Link href="#personas" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Choose a persona <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </section>

          <Card className="mb-8 overflow-hidden border-primary/15 bg-primary/[0.035] shadow-none">
            <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquareText className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">A little practice goes a long way</p>
                  <h2 className="mt-1 text-lg font-medium tracking-tight">Start with who&apos;s across the table.</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Pick an interviewer persona to see common questions, understand what they are listening for, and shape a clear answer.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/75 px-4 py-3 lg:min-w-40">
                <span className="text-2xl font-semibold tracking-tight">{activeStageCount}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">active interview<br />stages</span>
              </div>
            </CardContent>
          </Card>

          <section aria-labelledby="stages-title" className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 id="stages-title" className="text-base font-medium tracking-tight">Your interview stages</h2>
                <p className="mt-1 text-xs text-muted-foreground">Use the buckets to focus on the next kind of conversation.</p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">Based on your application pipeline</span>
            </div>

            <ol className="grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
              {interviewStages.map((stage, index) => {
                const Icon = stage.icon
                const stageApplications = applications.filter(stage.matches)

                return (
                  <li key={stage.title} className="min-w-0">
                    <Card className="h-full border-border shadow-none transition-colors hover:border-muted-foreground/40">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline">Stage {String(index + 1).padStart(2, "0")}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {stageApplications.length} {stageApplications.length === 1 ? "application" : "applications"}
                          </span>
                        </div>
                        <CardTitle className="flex items-center gap-2 pt-2 text-base">
                          <Icon aria-hidden="true" className="size-4 text-primary" />
                          {stage.title}
                        </CardTitle>
                        <CardDescription>{stage.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex h-full flex-col gap-4">
                        {stageApplications.length > 0 ? (
                          <ul className="flex flex-col gap-2">
                            {stageApplications.map((application) => (
                              <li key={application.id} className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                                  {application.initials}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{application.company}</p>
                                  <p className="truncate text-xs text-muted-foreground">{application.nextStep}</p>
                                  {application.due !== "—" && <p className="mt-1 text-[11px] text-muted-foreground">Due {application.due}</p>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                            No applications in this stage yet. You can still practice ahead.
                          </p>
                        )}
                        <Link
                          href={`/interviews/${stage.personaSlug}`}
                          className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-auto w-full justify-between`}
                        >
                          {stage.actionLabel}<ArrowRight data-icon="inline-end" aria-hidden="true" />
                        </Link>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ol>
          </section>

          <section id="personas" aria-labelledby="personas-title" className="scroll-mt-6">
            <div className="mb-4">
              <h2 id="personas-title" className="text-base font-medium tracking-tight">Choose an interviewer persona</h2>
              <p className="mt-1 text-xs text-muted-foreground">Each one opens a dedicated question set and practice space.</p>
            </div>
            <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {interviewPersonas.map((persona, index) => {
                const Icon = personaIcons[index]
                if (!Icon) return null

                return (
                  <li key={persona.slug} className="min-w-0">
                    <Link
                      href={`/interviews/${persona.slug}`}
                      aria-label={`Practice with a ${persona.label.toLowerCase()}: ${persona.title}`}
                      className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <Card className="h-full border-border shadow-none transition-colors group-hover:border-primary/40">
                        <CardContent className="flex h-full items-start gap-3 p-4">
                          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                            <Icon className="size-[18px]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-medium">{persona.label}</span>
                              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
          </section>
        </main>
      </div>
    </div>
  )
}
