"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Search } from "lucide-react"

import { AddApplicationSheet } from "@/components/add-application-sheet"
import { ApplicationPreviewPanel } from "@/components/application-preview-panel"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { applicationStatusClassName } from "@/lib/application-helpers"

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { applications: applicationRows, addApplication } = useApplications()
  const selectedApplication = applicationRows.find((application) => application.id === selectedId)
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
        <div className={selectedApplication ? "grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" : ""}>
          <div className="min-w-0">
            <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground sm:hidden">
              Scroll horizontally to see all columns.
            </p>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm ${selectedApplication ? "min-w-[360px]" : "min-w-[720px]"}`}>
                <caption className="sr-only">Active job applications with their stage, next step, and due date.</caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th scope="col" className={`px-5 py-3 font-medium ${selectedApplication ? "w-[68%]" : "w-[32%]"}`}>Company and role</th>
                    <th scope="col" className={`px-5 py-3 font-medium ${selectedApplication ? "w-[32%]" : "w-[18%]"}`}>Stage</th>
                    <th scope="col" className={`px-5 py-3 font-medium ${selectedApplication ? "hidden" : "w-[34%]"}`}>Next step</th>
                    <th scope="col" className={`px-5 py-3 font-medium ${selectedApplication ? "hidden" : "w-[16%]"}`}>Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApplications.length > 0 ? (
                    filteredApplications.map((application) => {
                      const isSelected = application.id === selectedApplication?.id

                      return (
                        <tr
                          key={application.id}
                          onClick={() => setSelectedId(application.id)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/[0.06] hover:bg-primary/[0.09]" : "hover:bg-muted/30"}`}
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedId(application.id)
                              }}
                              aria-label={`Preview ${application.role} at ${application.company}`}
                              className="flex w-full min-w-0 items-center gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <Avatar className={`size-9 shrink-0 rounded-full border-0 after:hidden ${application.company === "Vercel" ? "bg-black" : "bg-transparent"}`}>
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
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-foreground">{application.company}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{application.role}</span>
                              </span>
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-normal ${applicationStatusClassName(application.status)}`}>
                              {application.status}
                            </Badge>
                          </td>
                          <td className={selectedApplication ? "hidden" : "px-5 py-4"}>
                            <p className="font-medium text-foreground">{application.nextStep}</p>
                          </td>
                          <td className={selectedApplication ? "hidden" : "px-5 py-4 text-muted-foreground"}>
                            <span className="flex items-center gap-2 whitespace-nowrap">
                              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                              {application.due}
                            </span>
                          </td>
                        </tr>
                      )
                    })
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
          </div>
          {selectedApplication && (
            <ApplicationPreviewPanel application={selectedApplication} onClose={() => setSelectedId(null)} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
