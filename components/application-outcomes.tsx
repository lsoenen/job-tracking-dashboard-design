"use client"

import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const outcomes = [
  { key: "noResponse", label: "No response yet", value: 29 },
  { key: "rejected", label: "Not moving forward", value: 9 },
  { key: "interviewing", label: "Interviewing", value: 6 },
  { key: "offer", label: "Offer received", value: 4 },
]

const chartConfig = {
  noResponse: { label: "No response yet", color: "var(--chart-5)" },
  rejected: { label: "Not moving forward", color: "var(--chart-3)" },
  interviewing: { label: "Interviewing", color: "var(--chart-2)" },
  offer: { label: "Offer received", color: "var(--chart-1)" },
} satisfies ChartConfig

const totalApplications = outcomes.reduce((total, outcome) => total + outcome.value, 0)

export function ApplicationOutcomes() {
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(190px,0.9fr)_1fr]">
      <div className="relative mx-auto w-full max-w-[250px]">
        <ChartContainer config={chartConfig} className="aspect-square h-[230px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={outcomes}
              dataKey="value"
              nameKey="key"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={3}
              stroke="none"
            >
              {outcomes.map((outcome) => (
                <Cell
                  key={outcome.key}
                  fill={`var(--color-${outcome.key})`}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{totalApplications}</span>
          <span className="mt-1 text-xs text-muted-foreground">applications</span>
        </div>
      </div>

      <ul aria-label="Application outcome breakdown" className="flex flex-col gap-4">
        {outcomes.map((outcome) => {
          const percentage = Math.round((outcome.value / totalApplications) * 100)

          return (
            <li key={outcome.key} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--color-${outcome.key})` }}
                />
                <span className="truncate text-sm text-muted-foreground">{outcome.label}</span>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {outcome.value} <span className="font-normal text-muted-foreground">· {percentage}%</span>
              </span>
            </li>
          )
        })}
        <li className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Response rate</span>
          <span className="font-semibold tabular-nums">39.6%</span>
        </li>
      </ul>
    </div>
  )
}
