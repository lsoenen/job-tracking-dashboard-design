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
import { applicationStatuses } from "@/lib/applications"
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
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    stage: "all",
    nextStep: "",
    due: "",
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<"active" | "graveyard">("active")
  const { applications: applicationRows, addApplication } = useApplications()
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
    const matchesFilter = (value: string, filter: string) =>
      value.toLowerCase().includes(filter.trim().toLowerCase())

    return visibleApplications.filter((application) => {
      const matchesQuery =
        !normalizedQuery ||
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
          .includes(normalizedQuery)

      return (
        matchesQuery &&
        matchesFilter(application.company, filters.company) &&
        matchesFilter(application.role, filters.role) &&
        (filters.stage === "all" || application.status === filters.stage) &&
        matchesFilter(application.nextStep, filters.nextStep) &&
        matchesFilter(application.due, filters.due)
      )
    })
  }, [visibleApplications, query, filters])
  const hasActiveFilters = Boolean(
    query.trim() || Object.values(filters).some((filter) => filter !== "" && filter !== "all"),
  )

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
          {view === "graveyard" && graveyardApplications.length === 0 && !hasActiveFilters ? (
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
              <table className="w-full min-w-[900px] text-left text-sm">
                <caption className="sr-only">
                  {view === "graveyard" ? "Archived job applications" : "Active job applications"} with their company, role, stage, next step, and due date.
                </caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th scope="col" className="w-[18%] px-3 py-2 font-medium">Company</th>
                    <th scope="col" className="w-[22%] px-3 py-2 font-medium">Role</th>
                    <th scope="col" className="w-[17%] px-3 py-2 font-medium">Stage</th>
                    <th scope="col" className="w-[27%] px-3 py-2 font-medium">Next step</th>
                    <th scope="col" className="w-[16%] px-3 py-2 font-medium">Due</th>
                  </tr>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-3 pb-2">
                      <label className="sr-only" htmlFor="filter-company">Filter by company</label>
                      <input
                        id="filter-company"
                        type="search"
                        value={filters.company}
                        onChange={(event) => setFilters((current) => ({ ...current, company: event.target.value }))}
                        placeholder="Filter company"
                        className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </th>
                    <th scope="col" className="px-3 pb-2">
                      <label className="sr-only" htmlFor="filter-role">Filter by role</label>
                      <input
                        id="filter-role"
                        type="search"
                        value={filters.role}
                        onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                        placeholder="Filter role"
                        className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </th>
                    <th scope="col" className="px-3 pb-2">
                      <label className="sr-only" htmlFor="filter-stage">Filter by stage</label>
                      <Select value={filters.stage} onValueChange={(value) => setFilters((current) => ({ ...current, stage: value ?? "all" }))}>
                        <SelectTrigger id="filter-stage" size="sm" aria-label="Filter by stage" className="h-7 w-full rounded-md px-2 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectGroup>
                            <SelectItem value="all">All stages</SelectItem>
                            {applicationStatuses.map((status) => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </th>
                    <th scope="col" className="px-3 pb-2">
                      <label className="sr-only" htmlFor="filter-next-step">Filter by next step</label>
                      <input
                        id="filter-next-step"
                        type="search"
                        value={filters.nextStep}
                        onChange={(event) => setFilters((current) => ({ ...current, nextStep: event.target.value }))}
                        placeholder="Filter next step"
                        className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </th>
                    <th scope="col" className="px-3 pb-2">
                      <label className="sr-only" htmlFor="filter-due">Filter by due date</label>
                      <input
                        id="filter-due"
                        type="search"
                        value={filters.due}
                        onChange={(event) => setFilters((current) => ({ ...current, due: event.target.value }))}
                        placeholder="Filter due"
                        className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </th>
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
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedId(application.id)
                              }}
                              aria-label={`Preview ${application.role} at ${application.company}`}
                              className="flex w-full min-w-0 items-center gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <Avatar className={`size-6 shrink-0 rounded-full border-0 after:hidden ${application.company === "Vercel" ? "bg-black" : "bg-transparent"}`}>
                                {application.logo && (
                                  <AvatarImage
                                    src={application.logo}
                                    alt={`${application.company} logo`}
                                    className="rounded-full object-contain"
                                  />
                                )}
                                <AvatarFallback className="rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                                  {application.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="block min-w-0 truncate text-xs font-medium text-foreground">{application.company}</span>
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <p className="truncate text-xs text-foreground">{application.role}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Badge className={`whitespace-nowrap px-2 py-0.5 text-[11px] ${applicationStatusClassName(application.status)}`}>
                              {application.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            <p className="truncate text-xs font-medium text-foreground">{application.nextStep}</p>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                              <CalendarDays aria-hidden="true" className="size-3 shrink-0" />
                              {application.due}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-xs text-muted-foreground">
                        <p role="status">
                          {hasActiveFilters ? "No applications match these filters." : "No applied roles yet. Move a role from your wishlist or add an application to get started."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
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
