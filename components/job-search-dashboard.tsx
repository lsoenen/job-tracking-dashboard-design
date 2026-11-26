import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  LayoutDashboard,
  ListChecks,
  Target,
} from "lucide-react"

import { ApplicationActivityChart } from "@/components/application-activity-chart"
import { ActiveApplications } from "@/components/active-applications"
import { ApplicationOutcomes } from "@/components/application-outcomes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

const navigation = [
  { label: "Overview", href: "#top", icon: LayoutDashboard, active: true },
  { label: "In motion", href: "#applications", icon: ListChecks, active: false },
  { label: "Progress", href: "#insights", icon: ChartNoAxesCombined, active: false },
]

const metrics = [
  {
    label: "Applications sent",
    value: "48",
    note: "+12 this month",
    icon: BriefcaseBusiness,
    tone: "text-primary bg-primary/10",
  },
  {
    label: "Response rate",
    value: "39.6%",
    note: "19 companies replied",
    icon: ArrowUpRight,
    tone: "text-success bg-success/10",
  },
  {
    label: "In interviews",
    value: "6",
    note: "2 next week",
    icon: CalendarDays,
    tone: "text-warning bg-warning/10",
  },
  {
    label: "Offers received",
    value: "4",
    note: "1 awaiting decision",
    icon: Target,
    tone: "text-info bg-info/10",
  },
]

const nextSteps = [
  {
    company: "Vercel",
    task: "Prepare for hiring manager interview",
    date: "Tomorrow · 10:30 am",
    initials: "V",
    priority: "Soon",
  },
  {
    company: "Ramp",
    task: "Send availability to recruiter",
    date: "Tomorrow · End of day",
    initials: "R",
    priority: "Soon",
  },
  {
    company: "Figma",
    task: "Submit design exercise",
    date: "Mon, Nov 30",
    initials: "F",
    priority: "Upcoming",
  },
]

function Sidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border/70 bg-sidebar md:flex">
      <a href="#top" className="flex items-center gap-3 px-6 py-6" aria-label="Pursuit home">
        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BriefcaseBusiness aria-hidden="true" className="size-5" />
        </span>
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold tracking-tight">Pursuit</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-[0.16em] text-muted-foreground">JOB SEARCH, IN FOCUS</span>
        </span>
      </a>

      <div className="px-4 pt-4">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">WORKSPACE</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${item.active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                <Icon aria-hidden="true" className="size-[17px]" />
                {item.label}
                {item.label === "In motion" && (
                  <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">4</span>
                )}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border/70 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-9 border border-border/70">
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">AT</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Alex Taylor</p>
            <p className="truncate text-xs text-muted-foreground">Product designer</p>
          </div>
          <Bell aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  )
}

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon

  return (
    <Card className="border-border/70 shadow-sm shadow-foreground/[0.02]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-0">
        <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${metric.tone}`}>
          <Icon aria-hidden="true" className="size-[17px]" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{metric.value}</p>
        <p className="mt-2.5 text-xs text-muted-foreground">{metric.note}</p>
      </CardContent>
    </Card>
  )
}

function NextSteps() {
  return (
    <Card id="next-steps" className="border-border/70 shadow-sm shadow-foreground/[0.02]">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <h2 id="next-steps-heading" className="text-base font-semibold tracking-tight">Next steps</h2>
          <p className="mt-1 text-sm text-muted-foreground">Small actions, real momentum.</p>
        </div>
        <Badge variant="outline" className="shrink-0 rounded-full border-warning/30 bg-warning/10 text-warning">3 due soon</Badge>
      </CardHeader>
      <CardContent>
        <ol aria-labelledby="next-steps-heading" className="flex flex-col">
          {nextSteps.map((step, index) => (
            <li key={step.company} className="relative flex gap-3 pb-5 last:pb-0">
              {index < nextSteps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-border" />
              )}
              <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-semibold text-muted-foreground">
                {step.initials}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-medium text-muted-foreground">{step.company}</p>
                <p className="mt-1 text-sm font-medium leading-snug">{step.task}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {step.date}
                </p>
              </div>
              <span className={`pt-1 text-[10px] font-medium ${step.priority === "Soon" ? "text-warning" : "text-muted-foreground"}`}>
                {step.priority}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

function WeeklyFocus() {
  return (
    <Card className="border-primary/15 bg-primary/[0.035] shadow-sm shadow-foreground/[0.02]">
      <CardContent className="flex items-start gap-4 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Target aria-hidden="true" className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">This week&apos;s focus</p>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">3 of 5</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Follow up with two companies and keep your interview prep moving.</p>
          <div
            role="progressbar"
            aria-label="Weekly focus progress"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={3}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10"
          >
            <div className="h-full w-3/5 rounded-full bg-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function JobSearchDashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] items-center justify-between border-b border-border/70 bg-card/75 px-4 sm:px-6 lg:px-9">
          <a href="#top" className="flex items-center gap-2.5 md:hidden" aria-label="Pursuit home">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BriefcaseBusiness aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Pursuit</span>
          </a>
          <div className="hidden text-sm text-muted-foreground md:block">
            Workspace <span className="px-1.5 text-border">/</span> <span className="font-medium text-foreground">Overview</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-muted-foreground sm:block">Thursday, November 26</p>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <Avatar className="size-8 border border-border/70 md:hidden">
              <AvatarFallback className="bg-secondary text-[10px] font-semibold">AT</AvatarFallback>
            </Avatar>
            <span className="hidden text-xs font-medium md:block">Alex Taylor</span>
          </div>
        </header>

        <main id="top" className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9">
          <section aria-labelledby="page-title" className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-primary">JOB SEARCH / OVERVIEW</p>
              <h1 id="page-title" className="text-[26px] font-semibold tracking-tight sm:text-[32px]">Your search, in focus.</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                A clear view of what&apos;s moving, what&apos;s waiting, and what&apos;s next.
              </p>
            </div>
            <Button nativeButton={false} variant="outline" size="sm" render={<a href="#next-steps" />} className="w-fit bg-card">
              Review next steps
              <ArrowRight data-icon="inline-end" />
            </Button>
          </section>

          <section aria-label="Job search key performance indicators" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </section>

          <section aria-label="Job search progress charts" className="mb-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card id="insights" className="border-border/70 shadow-sm shadow-foreground/[0.02]">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Application outcomes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Where your 48 applications stand.</p>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-full border-border text-xs font-normal text-muted-foreground">All time</Badge>
              </CardHeader>
              <CardContent>
                <ApplicationOutcomes />
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm shadow-foreground/[0.02]">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Application pace</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Applications sent and responses received.</p>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-full border-border text-xs font-normal text-muted-foreground">Last 30 days</Badge>
              </CardHeader>
              <CardContent>
                <ApplicationActivityChart />
              </CardContent>
            </Card>
          </section>

          <section aria-label="Active applications and priorities" className="grid items-start gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <div id="applications">
              <ActiveApplications />
            </div>
            <div className="flex flex-col gap-4">
              <NextSteps />
              <WeeklyFocus />
            </div>
          </section>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><ChartNoAxesCombined aria-hidden="true" className="size-3.5" /> Your progress, without the noise.</span>
            <span>Dashboard overview · Sample data</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
