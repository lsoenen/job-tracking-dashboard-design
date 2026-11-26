"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

const applications = [
  {
    company: "Vercel",
    role: "Senior Product Designer",
    initials: "V",
    status: "Interviewing",
    nextStep: "Hiring manager interview",
    due: "Tomorrow",
    tone: "bg-primary/10 text-primary",
  },
  {
    company: "Figma",
    role: "Product Designer, Growth",
    initials: "F",
    status: "Take-home",
    nextStep: "Submit design exercise",
    due: "Nov 30",
    tone: "bg-warning/10 text-warning",
  },
  {
    company: "Linear",
    role: "Product Designer",
    initials: "L",
    status: "Applied",
    nextStep: "Follow up with recruiter",
    due: "Dec 2",
    tone: "bg-muted text-muted-foreground",
  },
  {
    company: "Ramp",
    role: "Staff Product Designer",
    initials: "R",
    status: "Recruiter screen",
    nextStep: "Share availability",
    due: "Nov 27",
    tone: "bg-info/10 text-info",
  },
]

export function ActiveApplications() {
  const [query, setQuery] = useState("")
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return applications

    return applications.filter((application) =>
      [application.company, application.role, application.status, application.nextStep]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query])

  return (
    <Card className="h-full border-border/70 shadow-sm shadow-foreground/[0.02]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="applications-heading" className="text-base font-semibold tracking-tight">In motion</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your active applications and what to do next.</p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full px-2.5 py-1 text-xs">4 active</Badge>
      </CardHeader>
      <CardContent>
        <label className="mb-3 flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only">Filter active applications</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by company, role, or next step"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        {filteredApplications.length > 0 ? (
          <ul aria-labelledby="applications-heading" className="divide-y divide-border/70">
            {filteredApplications.map((application) => (
              <li key={application.company} className="grid gap-3 py-4 first:pt-3 last:pb-1 md:grid-cols-[minmax(145px,1fr)_minmax(145px,1.1fr)_auto] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10 rounded-xl border border-border/70 bg-background">
                    <AvatarFallback className={`rounded-xl text-sm font-semibold ${application.tone}`}>
                      {application.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{application.company}</p>
                    <p className="truncate text-xs text-muted-foreground">{application.role}</p>
                  </div>
                </div>

                <div className="min-w-0 md:pl-2">
                  <p className="truncate text-sm">{application.nextStep}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Next step · {application.due}</p>
                </div>

                <Badge variant="outline" className="w-fit rounded-full border-border px-2.5 py-1 text-xs font-medium">
                  {application.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p role="status" className="py-10 text-center text-sm text-muted-foreground">
            No active applications match “{query}”.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
