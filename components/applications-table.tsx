"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ExternalLink, Search } from "lucide-react"

import { AddApplicationSheet } from "@/components/add-application-sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { applications } from "@/lib/applications"
import type { Application, ApplicationStatus, NewApplication } from "@/lib/applications"

function statusClassName(status: ApplicationStatus) {
  if (status === "Offer") return "border-success/20 bg-success/5 text-success"
  if (status === "Not moving forward") return "border-destructive/20 bg-destructive/5 text-destructive"
  return "border-border bg-muted text-foreground"
}

function companyInitials(company: string) {
  return company
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

function safeExternalUrl(value?: string) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const [applicationRows, setApplicationRows] = useState(applications)
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return applicationRows

    return applicationRows.filter((application) =>
      [
        application.company,
        application.role,
        application.description ?? "",
        application.sourceUrl ?? "",
        application.status,
        application.nextStep,
        application.due,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [applicationRows, query])

  function addApplication(application: NewApplication) {
    const newApplication: Application = {
      ...application,
      id: crypto.randomUUID(),
      initials: companyInitials(application.company),
    }
    setApplicationRows((current) => [newApplication, ...current])
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <CardTitle className="text-base">All active applications</CardTitle>
              <CardDescription className="mt-1">Every application, stage, and upcoming next step.</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full font-normal">{applicationRows.length} tracked</Badge>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 sm:w-[260px]">
              <Search aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">Search applications</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applications"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <AddApplicationSheet onAdd={addApplication} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground sm:hidden">
          Scroll horizontally to see all columns.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Active job applications with their stage, next step, and due date.</caption>
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="w-[32%] px-5 py-3 font-medium">Company and role</th>
                <th scope="col" className="w-[18%] px-5 py-3 font-medium">Stage</th>
                <th scope="col" className="w-[34%] px-5 py-3 font-medium">Next step</th>
                <th scope="col" className="w-[16%] px-5 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <tr key={application.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9 rounded-full border-0 bg-transparent after:hidden">
                          {application.logo && (
                            <AvatarImage
                              src={application.logo}
                              alt={`${application.company} logo`}
                              className="rounded-full object-contain"
                            />
                          )}
                          <AvatarFallback className="rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {application.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{application.company}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{application.role}</p>
                          {application.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{application.description}</p>
                          )}
                          {safeExternalUrl(application.sourceUrl) && (
                            <a
                              href={safeExternalUrl(application.sourceUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View ${application.company} job posting`}
                              className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                            >
                              Job posting
                              <ExternalLink aria-hidden="true" className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-normal ${statusClassName(application.status)}`}>
                        {application.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{application.nextStep}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                        {application.due}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <p role="status">
                      {query ? `No applications match “${query}”.` : "No applications yet. Add one to get started."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Showing {filteredApplications.length} of {applicationRows.length} applications
        </p>
      </CardContent>
    </Card>
  )
}
