"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useApplications } from "@/components/applications-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { applicationStatusClassName, getTrackedApplications } from "@/lib/application-helpers"
import { statusLabel } from "@/lib/applications"
import { StatusLabel } from "@/components/status-label"

export function ActiveApplications() {
  const [query, setQuery] = useState("")
  const { applications } = useApplications()
  const activeApplications = useMemo(
    () => getTrackedApplications(applications).filter((application) => application.status !== "Not moving forward"),
    [applications],
  )
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return activeApplications

    return activeApplications.filter((application) =>
      [application.company, application.role, statusLabel(application.status), application.nextStep]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [activeApplications, query])

  return (
    <Card className="h-full border-border shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="applications-heading" className="text-base font-medium tracking-tight">Active applications</h2>
          <CardDescription className="mt-1">Your next moves, ordered by date.</CardDescription>
        </div>
        <Link href="/applications" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground hover:underline">
          View all {activeApplications.length} <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
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

        <div className="hidden grid-cols-[minmax(130px,1fr)_minmax(100px,0.65fr)_minmax(150px,1.1fr)] gap-3 bg-muted px-2 py-3 text-xs font-medium text-foreground sm:grid">
          <span>Company &amp; role</span>
          <span>Stage</span>
          <span>Next step</span>
        </div>
        {filteredApplications.length > 0 ? (
          <ul aria-labelledby="applications-heading" className="divide-y divide-border">
            {filteredApplications.map((application) => (
              <li key={application.company} className="grid gap-3 py-3 first:pt-3 sm:grid-cols-[minmax(130px,1fr)_minmax(100px,0.65fr)_minmax(150px,1.1fr)] sm:items-center sm:px-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8 rounded-full border-0 bg-transparent after:hidden">
                    <AvatarImage
                      src={application.logo}
                      alt={`${application.company} logo`}
                      className="rounded-full object-contain"
                    />
                    <AvatarFallback className="rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {application.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{application.company}</p>
                    <p className="truncate text-xs text-muted-foreground">{application.role}</p>
                  </div>
                </div>

                <Badge variant="outline" className={`w-fit rounded-full px-2.5 py-1 text-xs font-normal ${applicationStatusClassName(application.status)}`}>
                  <StatusLabel status={application.status} />
                </Badge>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{application.nextStep}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{application.due}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p role="status" className="py-10 text-center text-sm text-muted-foreground">
            No active applications match “{query}”.
          </p>
        )}
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Showing {filteredApplications.length} of {activeApplications.length} in-progress applications
        </p>
      </CardContent>
    </Card>
  )
}
