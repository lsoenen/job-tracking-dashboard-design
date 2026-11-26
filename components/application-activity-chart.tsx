"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const activity = [
  { week: "Nov 1", applications: 9, responses: 3 },
  { week: "Nov 8", applications: 11, responses: 4 },
  { week: "Nov 15", applications: 13, responses: 5 },
  { week: "Nov 22", applications: 15, responses: 7 },
]

const chartConfig = {
  applications: { label: "Applications sent", color: "var(--chart-1)" },
  responses: { label: "Responses received", color: "var(--chart-2)" },
} satisfies ChartConfig

export function ApplicationActivityChart() {
  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[230px] w-full aspect-auto">
        <BarChart accessibilityLayer data={activity} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
          <Bar dataKey="applications" fill="var(--color-applications)" radius={[4, 4, 0, 0]} maxBarSize={25} />
          <Bar dataKey="responses" fill="var(--color-responses)" radius={[4, 4, 0, 0]} maxBarSize={25} />
        </BarChart>
      </ChartContainer>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Chart legend">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-chart-1" />
          Applications sent
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-chart-2" />
          Responses received
        </span>
      </div>
    </div>
  )
}
