"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { applications } from "@/lib/applications"

function statusClassName(status: string) {
  if (status === "Offer") return "border-success/20 bg-success/5 text-success"
  if (status === "Not moving forward") return "border-destructive/20 bg-destructive/5 text-destructive"
  return "border-border bg-muted text-foreground"
}

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return applications

    return applications.filter((application) =>
      [application.company, application.role, application.status, application.nextStep, application.due]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query])

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">All active applications</CardTitle>
          <CardDescription className="mt-1">Every application, stage, and upcoming next step.</CardDescription>
        </div>
        <label className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 sm:w-[300px]">
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
                  <tr key={application.company} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9 rounded-full border-0 bg-transparent after:hidden">
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
                          <p className="truncate font-medium text-foreground">{application.company}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{application.role}</p>
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
                    <p role="status">No applications match “{query}”.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Showing {filteredApplications.length} of {applications.length} active applications
        </p>
      </CardContent>
    </Card>
  )
}
