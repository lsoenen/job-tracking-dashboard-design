"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useApplications } from "@/components/applications-provider"
import { getWeeklyActivity } from "@/lib/dashboard-metrics"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  applications: { label: "Applications sent", color: "var(--chart-5)" },
  responses: { label: "Responses received", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ApplicationActivityChart() {
  const { applications, statusEvents } = useApplications()
  const activity = useMemo(() => getWeeklyActivity(applications, statusEvents), [applications, statusEvents])
  const isEmpty = activity.every((week) => week.applications === 0 && week.responses === 0)

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[230px] w-full aspect-auto">
        <BarChart accessibilityLayer data={activity} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Bar dataKey="applications" fill="var(--color-applications)" radius={[2, 2, 0, 0]} maxBarSize={28} />
          <Bar dataKey="responses" fill="var(--color-responses)" radius={[2, 2, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ChartContainer>
      {isEmpty && (
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing here yet. Set an applied date on an application and it will show up in the chart.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Chart legend">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-chart-5" />
          Applications sent
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-chart-1" />
          Responses received
        </span>
      </div>
    </div>
  )
}
