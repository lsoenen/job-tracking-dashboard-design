"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
} from "lucide-react"

import { ApplicationActivityChart } from "@/components/application-activity-chart"
import { useApplications } from "@/components/applications-provider"
import { useJobProfile } from "@/components/job-profile-provider"
import {
  dashboardRanges,
  getApplicationMetrics,
  getAppliedThisWeek,
  getUpcomingSteps,
  responseWindowDays,
  type DashboardRange,
} from "@/lib/dashboard-metrics"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ActiveApplications } from "@/components/active-applications"
import { ApplicationOutcomes } from "@/components/application-outcomes"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
  benchmarkTitle?: string
  status?: string
  tone?: "success" | "neutral" | "destructive"
}

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
            title={metric.benchmarkTitle}
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
  const { applications } = useApplications()
  const { steps, dueSoonCount } = getUpcomingSteps(applications)
  const visibleSteps = steps.slice(0, 3)

  return (
    <Card id="next-steps" className="border-border shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium tracking-tight">Next steps</h2>
            <CardDescription className="mt-1">Small actions. Real forward movement.</CardDescription>
          </div>
          {dueSoonCount > 0 && <Badge variant="outline" className="shrink-0">{dueSoonCount} due soon</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {visibleSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No next steps yet. Add a next step and due date to an application to see it here.
          </p>
        ) : (
          <ol aria-label="Upcoming job-search tasks" className="flex flex-col divide-y divide-border">
            {visibleSteps.map(({ application, dueLabel, isOverdue }, index) => (
              <li key={application.id} className={`flex gap-3 py-4 first:pt-0 last:pb-0 ${index === 0 ? "-mx-2 rounded-md bg-primary/[0.04] px-2" : ""}`}>
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-[11px] font-medium text-muted-foreground">
                  {application.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/applications/${application.id}`} className="text-sm font-medium leading-snug hover:underline">
                    {application.nextStep}
                  </Link>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                    <span>{application.company}</span>
                    <span aria-hidden="true">·</span>
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    <span className={isOverdue ? "text-destructive" : undefined}>{dueLabel}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <a href="#applications" className={`${buttonVariants({ variant: "link", size: "sm" })} mt-5 h-auto px-0 text-foreground`}>
          View active applications
          <ArrowRight data-icon="inline-end" />
        </a>
      </CardContent>
    </Card>
  )
}

export function JobSearchDashboard() {
  const { applications, statusEvents } = useApplications()
  const { profile } = useJobProfile()
  const [range, setRange] = useState<DashboardRange>("all")
  const appliedThisWeek = getAppliedThisWeek(applications)
  const firstName = profile.fullName.trim().split(/\s+/)[0]
  const stats = getApplicationMetrics(applications, statusEvents, range)
  // The pipeline chart shows where things stand right now, regardless of range
  const pipelineActive = applications.filter(
    (application) => application.status !== "Interested" && application.status !== "Not moving forward",
  ).length
  const rangeLabel = dashboardRanges.find((item) => item.id === range)?.label ?? "All time"

  // Remember the chosen range on this device
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("dashboard-range")
      if (dashboardRanges.some((item) => item.id === saved)) setRange(saved as DashboardRange)
    } catch {}
  }, [])

  function chooseRange(next: DashboardRange) {
    setRange(next)
    try {
      window.localStorage.setItem("dashboard-range", next)
    } catch {}
  }

  const formatRate = (rate: number | null) => (rate === null ? "—" : `${rate.toFixed(rate >= 10 || rate === 0 ? 0 : 1)}%`)
  const tooRecentNote =
    stats.tooRecent > 0 ? ` · ${stats.tooRecent} too recent to count` : ""
  const notEnoughYet = `No applications ${responseWindowDays}+ days old yet${tooRecentNote}`
  const interviewRate = stats.interviewRate
  const metrics: DashboardMetric[] = [
    {
      label: "Total applications",
      value: String(stats.sent),
      note: `${stats.active} active · ${stats.rejected} in graveyard`,
    },
    {
      label: "Response rate",
      value: formatRate(stats.responseRate),
      note:
        stats.responseRate === null
          ? notEnoughYet
          : `${stats.responded} of ${stats.eligible} heard back${tooRecentNote}`,
      benchmark: "Any reply, including rejections",
      benchmarkTitle: `Share of applications at least ${responseWindowDays} days old that got any response: an interview, take-home, offer, or rejection.`,
    },
    {
      label: "Interview rate",
      value: formatRate(interviewRate),
      note:
        interviewRate === null
          ? notEnoughYet
          : `${stats.interviewed} of ${stats.eligible} reached an interview${
              stats.rejectedAfterInterview > 0 ? ` (incl. ${stats.rejectedAfterInterview} rejected after)` : ""
            } · ${stats.interviewingNow} interviewing now`,
      benchmark: "Good is typically 3–5% for cold applications",
      benchmarkTitle:
        "Directional estimate only. Reported interview rates vary by role, seniority, industry, and channel; referrals usually convert much higher than cold applications.",
      ...(interviewRate === null
        ? {}
        : {
            status: interviewRate > 5 ? "Excellent" : interviewRate >= 3 ? "Good" : interviewRate >= 2 ? "Typical" : "Low",
            tone: interviewRate >= 3 ? ("success" as const) : interviewRate >= 2 ? ("neutral" as const) : ("destructive" as const),
          }),
    },
    {
      label: "Offers received",
      value: String(stats.offers),
      note: range === "all" ? "Current pipeline" : `From applications sent in the ${rangeLabel.toLowerCase()}`,
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
                Applications submitted this week:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {appliedThisWeek}{profile.weeklyApplicationGoal > 0 ? `/${profile.weeklyApplicationGoal}` : ""}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Time range for key metrics" className="flex h-9 items-center gap-0.5 rounded-md border border-border p-0.5">
                <CalendarDays aria-hidden="true" className="ml-2 mr-1 size-4 text-muted-foreground" />
                {dashboardRanges.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    size="sm"
                    variant={range === item.id ? "secondary" : "ghost"}
                    aria-pressed={range === item.id}
                    className="h-7 px-2.5 font-normal"
                    onClick={() => chooseRange(item.id)}
                  >
                    {item.id === "all" ? item.label : item.label.replace("Last ", "")}
                  </Button>
                ))}
              </div>
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
                <CardDescription>Where your {pipelineActive} active applications stand right now.</CardDescription>
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
            <span>Dashboard overview</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
