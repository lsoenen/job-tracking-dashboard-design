import {
  ArrowRight,
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
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

const responseRate = 39.6

const navigation = [
  { label: "Overview", href: "#top", icon: LayoutDashboard, count: undefined },
  { label: "Applications", href: "#applications", icon: BriefcaseBusiness, count: "48" },
  { label: "Next steps", href: "#next-steps", icon: ListChecks, count: "3" },
]

const metrics = [
  {
    label: "Total applications",
    value: "48",
    note: "+12 this month",
  },
  {
    label: "Response rate",
    value: `${responseRate.toFixed(1)}%`,
    note: "19 companies replied",
    benchmark: "Good is typically 3–5% for cold applications",
    status: responseRate > 5 ? "Excellent" : responseRate >= 3 ? "Good" : responseRate >= 2 ? "Typical" : "Low",
    tone: responseRate >= 3 ? "success" : responseRate >= 2 ? "neutral" : "destructive",
  },
  {
    label: "In interviews",
    value: "6",
    note: "2 scheduled next week",
  },
  {
    label: "Offers received",
    value: "4",
    note: "1 awaiting decision",
    tone: "success",
  },
]

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

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[224px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <a href="#top" className="flex items-center gap-3 px-6 py-6" aria-label="Pursuit home">
        <BriefcaseBusiness aria-hidden="true" className="size-7 stroke-[1.6]" />
        <span className="flex flex-col">
          <span className="text-sm font-medium tracking-tight">Pursuit</span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">Job search</span>
        </span>
      </a>

      <div className="px-4 pt-4">
        <p className="px-3 pb-2 text-[11px] font-medium text-muted-foreground">WORKSPACE</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {navigation.map((item, index) => {
            const Icon = item.icon
            const active = index === 0

            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${active ? "bg-accent font-medium text-foreground" : "text-foreground hover:bg-accent"}`}
              >
                <Icon aria-hidden="true" className="size-[17px]" />
                {item.label}
                {item.count && <span className="ml-auto text-xs text-muted-foreground">{item.count}</span>}
              </a>
            )
          })}
        </nav>
      </div>

      <Card className="mx-4 mt-6 border-success/15 bg-success/[0.04] shadow-none">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium">A little closer, every day.</p>
            <span className="text-xs tabular-nums text-muted-foreground">3/5</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Weekly focus actions</p>
          <div
            role="progressbar"
            aria-label="Weekly focus progress"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={3}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-success/15"
          >
            <div className="h-full w-3/5 rounded-full bg-success" />
          </div>
          <p className="mt-2 text-xs text-success">2 more to reach your goal</p>
        </CardContent>
      </Card>

      <div className="mt-auto px-6 pb-5 pt-8">
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">AT</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Alex Taylor</p>
            <p className="truncate text-[11px] text-muted-foreground">Product designer</p>
          </div>
        </div>
        <p className="mt-5 text-[11px] text-muted-foreground">Your search, on your terms.</p>
      </div>
    </aside>
  )
}

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
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
            <li key={step.company} className={`flex gap-3 py-4 first:pt-0 last:pb-0 ${index === 0 ? "-mx-2 rounded-md bg-success/[0.04] px-2" : ""}`}>
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
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 md:hidden" aria-label="Pursuit home">
            <BriefcaseBusiness aria-hidden="true" className="size-6 stroke-[1.6]" />
            <span className="text-sm font-medium tracking-tight">Pursuit</span>
          </a>
          <div className="hidden text-sm text-muted-foreground md:block">
            Workspace <span className="px-1.5 text-border">/</span> <span className="text-foreground">Overview</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-muted-foreground sm:block">Thursday, November 26</p>
            <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell aria-hidden="true" data-icon="inline-start" />
            </Button>
          </div>
        </header>

        <nav aria-label="Mobile navigation" className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {navigation.map((item, index) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={index === 0 ? "page" : undefined}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2 py-2 text-xs ${index === 0 ? "bg-accent font-medium text-foreground" : "text-muted-foreground"}`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {item.label}
                {item.count && <span className="text-[10px] text-muted-foreground">{item.count}</span>}
              </a>
            )
          })}
        </nav>

        <main id="top" className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Your search, in focus.</h1>
              <p className="mt-2 text-sm text-muted-foreground">See what&apos;s moving. Know what&apos;s next.</p>
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
                <CardDescription>Where your 48 applications stand right now.</CardDescription>
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
