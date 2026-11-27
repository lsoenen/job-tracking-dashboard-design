"use client"

import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
} from "lucide-react"

import { ApplicationActivityChart } from "@/components/application-activity-chart"
import { useApplications } from "@/components/applications-provider"
import { useJobProfile } from "@/components/job-profile-provider"
import { getApplicationStatusCounts, getTrackedApplications } from "@/lib/application-helpers"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ActiveApplications } from "@/components/active-applications"
import { ApplicationOutcomes } from "@/components/application-outcomes"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

type DashboardMetric = {
  label: string
  value: string
  note: string
  benchmark?: string
  status?: string
  tone?: "success" | "neutral" | "destructive"
}

const nextSteps = [
  {
    company: "Vercel",
    task: "Prepare for hiring manager interview",
    date: "Tomorrow · 10:30 am",
    initials: "V",
  },
  {
    company: "Ramp",
    task: "Send availability to recruiter",
    date: "Tomorrow · End of day",
    initials: "R",
  },
  {
    company: "Figma",
    task: "Submit design exercise",
    date: "Mon, Nov 30",
    initials: "F",
  },
]

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const statusTone = metric.tone === "success"
    ? "border-success/20 bg-success/5 text-success"
    : metric.tone === "destructive"
      ? "border-destructive/20 bg-destructive/5 text-destructive"
      : "border-border bg-muted text-muted-foreground"

  return (
    <Card className="min-h-[126px] border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
        {metric.status && (
          <Badge variant="outline" className={`shrink-0 ${statusTone}`}>
            {metric.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-[28px] font-medium leading-none tracking-tight tabular-nums">{metric.value}</p>
        <p className={`mt-2.5 text-xs ${metric.tone === "success" ? "text-success" : "text-muted-foreground"}`}>
          {metric.note}
        </p>
        {metric.benchmark && (
          <p
            title="Directional estimate only. Reported rates vary by role, industry, channel, and whether the metric counts any reply or interviews."
            className="mt-1 text-[11px] text-muted-foreground"
          >
            {metric.benchmark}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function NextSteps() {
  return (
    <Card id="next-steps" className="border-border shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium tracking-tight">Next steps</h2>
            <CardDescription className="mt-1">Small actions. Real forward movement.</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">3 due soon</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol aria-label="Upcoming job-search tasks" className="flex flex-col divide-y divide-border">
          {nextSteps.map((step, index) => (
            <li key={step.company} className={`flex gap-3 py-4 first:pt-0 last:pb-0 ${index === 0 ? "-mx-2 rounded-md bg-primary/[0.04] px-2" : ""}`}>
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-[11px] font-medium text-muted-foreground">
                {step.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{step.task}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                  <span>{step.company}</span>
                  <span aria-hidden="true">·</span>
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {step.date}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <a href="#applications" className={`${buttonVariants({ variant: "link", size: "sm" })} mt-5 h-auto px-0 text-foreground`}>
          View active applications
          <ArrowRight data-icon="inline-end" />
        </a>
      </CardContent>
    </Card>
  )
}

export function JobSearchDashboard() {
  const { applications } = useApplications()
  const { profile } = useJobProfile()
  const firstName = profile.fullName.trim().split(/\s+/)[0]
  const trackedApplications = getTrackedApplications(applications)
  const statusCounts = getApplicationStatusCounts(applications)
  const totalApplications = trackedApplications.length
  const rejectedCount = statusCounts["Not moving forward"]
  const activeCount = totalApplications - rejectedCount
  const interviewCount = statusCounts.Interviewing
  const offerCount = statusCounts.Offer
  const repliedCount = totalApplications - statusCounts.Applied
  const responseRate = totalApplications === 0 ? 0 : (repliedCount / totalApplications) * 100
  const metrics: DashboardMetric[] = [
    {
      label: "Total applications",
      value: String(totalApplications),
      note: `${activeCount} active · ${rejectedCount} in graveyard`,
    },
    {
      label: "Response rate",
      value: `${responseRate.toFixed(1)}%`,
      note: repliedCount === 1 ? "1 company replied" : `${repliedCount} companies replied`,
      benchmark: "Good is typically 3–5% for cold applications",
      status: responseRate > 5 ? "Excellent" : responseRate >= 3 ? "Good" : responseRate >= 2 ? "Typical" : "Low",
      tone: responseRate >= 3 ? "success" : responseRate >= 2 ? "neutral" : "destructive",
    },
    {
      label: "In interviews",
      value: String(interviewCount),
      note: "Current Interviewing status",
    },
    {
      label: "Offers received",
      value: String(offerCount),
      note: "Current pipeline",
      tone: "success",
    },
  ]

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="overview" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="top" className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">
                Welcome{firstName ? `, ${firstName}` : ""}.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">See what&apos;s moving. Know what&apos;s next.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Applications submitted this week: <span className="font-medium tabular-nums text-foreground">2/5</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-9 gap-2 rounded-md px-3 text-sm font-normal text-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                All time
              </Badge>
              <a href="#next-steps" className={buttonVariants({ variant: "default", size: "sm" })}>
                Review next steps
                <ArrowRight data-icon="inline-end" />
              </a>
            </div>
          </section>

          <section aria-label="Job search key performance indicators" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </section>

          <section aria-label="Job search progress charts" className="mb-5 grid gap-4 xl:grid-cols-2">
            <Card id="insights" className="border-border shadow-none">
              <CardHeader>
                <h2 className="text-base font-medium tracking-tight">Application pipeline</h2>
                <CardDescription>Where your {activeCount} active applications stand right now.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationOutcomes />
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <h2 className="text-base font-medium tracking-tight">Application activity</h2>
                <CardDescription>Applications sent and replies received · last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationActivityChart />
              </CardContent>
            </Card>
          </section>

          <section aria-label="Active applications and next steps" className="grid items-start gap-4 xl:grid-cols-[1.45fr_0.85fr]">
            <div id="applications">
              <ActiveApplications />
            </div>
            <NextSteps />
          </section>

          <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><ChartNoAxesCombined aria-hidden="true" className="size-3.5" /> Your progress, without the noise.</span>
            <span>Dashboard overview · Sample data</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
