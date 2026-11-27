"use client"

import { Cell, Pie, PieChart } from "recharts"

import { useApplications } from "@/components/applications-provider"
import { getApplicationStatusCounts } from "@/lib/application-helpers"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  applications: { label: "Awaiting response", color: "var(--status-applied)" },
  interviewing: { label: "Interviewing", color: "var(--status-interviewing)" },
  takeHome: { label: "Take-home", color: "var(--status-take-home)" },
  offer: { label: "Offer received", color: "var(--status-offer)" },
} satisfies ChartConfig

export function ApplicationOutcomes() {
  const { applications } = useApplications()
  const statusCounts = getApplicationStatusCounts(applications)
  const outcomes = [
    { key: "applications", label: "Awaiting response", value: statusCounts.Applied },
    { key: "interviewing", label: "Interviewing", value: statusCounts.Interviewing },
    { key: "takeHome", label: "Take-home", value: statusCounts["Take-home"] },
    { key: "offer", label: "Offer received", value: statusCounts.Offer },
  ]
  const totalApplications = outcomes.reduce((total, outcome) => total + outcome.value, 0)

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(180px,0.9fr)_1fr]">
      <div className="relative mx-auto w-full max-w-[250px]">
        <ChartContainer config={chartConfig} className="aspect-square h-[220px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={outcomes}
              dataKey="value"
              nameKey="key"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {outcomes.map((outcome) => (
                <Cell key={outcome.key} fill={`var(--color-${outcome.key})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-medium tracking-tight tabular-nums">{totalApplications}</span>
          <span className="mt-1 text-xs text-muted-foreground">applications</span>
        </div>
      </div>

      <ul aria-label="Active application status breakdown" className="flex flex-col gap-3.5">
        {outcomes.map((outcome) => {
          const percentage = totalApplications === 0 ? 0 : Math.round((outcome.value / totalApplications) * 100)

          return (
            <li key={outcome.key} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--color-${outcome.key})` }}
                />
                <span className="truncate text-sm">{outcome.label}</span>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {outcome.value} <span className="font-normal text-muted-foreground">· {percentage}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
