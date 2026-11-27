"use client"

import { useMemo, useState } from "react"
import { Archive, CalendarDays, Search } from "lucide-react"

import { AddApplicationSheet } from "@/components/add-application-sheet"
import { ApplicationPreviewPanel } from "@/components/application-preview-panel"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { applicationStatusClassName } from "@/lib/application-helpers"
import { applicationStatuses, type ApplicationStatus } from "@/lib/applications"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<"active" | "graveyard">("active")
  const { applications: applicationRows, addApplication, updateApplicationStatus } = useApplications()
  const trackedApplications = useMemo(
    () => applicationRows.filter((application) => application.status !== "Interested"),
    [applicationRows],
  )
  const graveyardApplications = useMemo(
    () => trackedApplications.filter((application) => application.status === "Not moving forward"),
    [trackedApplications],
  )
  const activeApplications = useMemo(
    () => trackedApplications.filter((application) => application.status !== "Not moving forward"),
    [trackedApplications],
  )
  const visibleApplications = view === "active" ? activeApplications : graveyardApplications
  const selectedApplication = visibleApplications.find((application) => application.id === selectedId)
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return visibleApplications

    return visibleApplications.filter((application) =>
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
  }, [visibleApplications, query])

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <CardTitle className="text-base">{view === "active" ? "Active applications" : "Application graveyard"}</CardTitle>
              <CardDescription className="mt-1">
                {view === "active"
                  ? "Your current pipeline, prioritized for what’s next."
                  : "Rejected applications stay here for reference and remain in total application counts."}
              </CardDescription>
            </div>
            <div role="group" aria-label="Application collection" className="inline-flex items-center rounded-md bg-muted p-1">
              <button
                type="button"
                aria-pressed={view === "active"}
                onClick={() => {
                  setView("active")
                  setSelectedId(null)
                }}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${view === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Active <span className="ml-1 tabular-nums">{activeApplications.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={view === "graveyard"}
                onClick={() => {
                  setView("graveyard")
                  setSelectedId(null)
                }}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${view === "graveyard" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Graveyard <span className="ml-1 tabular-nums">{graveyardApplications.length}</span>
              </button>
            </div>
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
          {view === "graveyard" && graveyardApplications.length === 0 && !query ? (
            <Empty role="status" className="min-h-[280px] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Archive aria-hidden="true" /></EmptyMedia>
                <EmptyTitle>Your graveyard is empty</EmptyTitle>
                <EmptyDescription>
                  When an application is marked “Not moving forward,” it will stay here for reference.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
          <div className="min-w-0">
            <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground sm:hidden">
              Scroll horizontally to see all columns.
            </p>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm ${selectedApplication ? "min-w-[360px]" : "min-w-[720px]"}`}>
                <caption className="sr-only">
                  {view === "graveyard" ? "Archived job applications" : "Active job applications"} with their stage, next step, and due date.
                </caption>
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
                          className={`transition-colors ${isSelected ? "bg-primary/[0.06]" : "hover:bg-muted/30"}`}
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
                            <Select
                              value={application.status}
                              onValueChange={(value) => {
                                if (value) updateApplicationStatus(application.id, value as ApplicationStatus)
                              }}
                            >
                              <SelectTrigger
                                size="sm"
                                aria-label={`Update ${application.company} application status`}
                                className={`rounded-full border-transparent px-2.5 text-xs ${applicationStatusClassName(application.status)}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="start">
                                <SelectGroup>
                                  {applicationStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
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
                          {query ? `No applications match “${query}”.` : "No applied roles yet. Move a role from your wishlist or add an application to get started."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              Showing {filteredApplications.length} of {visibleApplications.length} {view === "graveyard" ? "archived" : "active"} applications
            </p>
          </div>
          )}
          {selectedApplication && (
            <ApplicationPreviewPanel application={selectedApplication} onClose={() => setSelectedId(null)} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
