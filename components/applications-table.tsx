"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ChevronDown, Search } from "lucide-react"

import { AddApplicationSheet } from "@/components/add-application-sheet"
import { ApplicationPreviewPanel } from "@/components/application-preview-panel"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { applicationStatusClassName } from "@/lib/application-helpers"
import { applicationStatuses, type Application, type ApplicationStatus } from "@/lib/applications"

function ApplicationStatusControl({
  application,
  onStatusChange,
}: {
  application: Application
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Change stage for ${application.role} at ${application.company}. Current stage: ${application.status}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${applicationStatusClassName(application.status)}`}
          />
        }
      >
        {application.status}
        <ChevronDown aria-hidden="true" className="size-3" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 gap-1 p-1">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Change stage</p>
        <div role="group" aria-label={`Stages for ${application.role} at ${application.company}`} className="flex flex-col">
          {applicationStatuses.map((status) => (
            <Button
              key={status}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={application.status === status}
              className={`w-full justify-start ${application.status === status ? "bg-muted" : ""}`}
              onClick={() => {
                onStatusChange(application.id, status)
                setOpen(false)
              }}
            >
              {status}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    stage: [] as string[],
    nextStep: "",
    due: "",
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { applications: applicationRows, addApplication, updateApplicationStatus } = useApplications()
  const selectedApplication = applicationRows.find((application) => application.id === selectedId)
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesFilter = (value: string, filter: string) =>
      value.toLowerCase().includes(filter.trim().toLowerCase())

    return applicationRows.filter((application) => {
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
        (filters.stage.length === 0 || filters.stage.includes(application.status)) &&
        matchesFilter(application.nextStep, filters.nextStep) &&
        matchesFilter(application.due, filters.due)
      )
    })
  }, [applicationRows, query, filters])
  const hasActiveFilters = Boolean(
    query.trim() || filters.stage.length > 0 || filters.company || filters.role || filters.nextStep || filters.due,
  )

  return (
    <Card className="gap-0 border-border shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Applications ({applicationRows.length})</CardTitle>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex h-7 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 sm:w-[260px]">
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
              <table className="w-full min-w-[900px] text-left text-sm">
                <caption className="sr-only">
                  Job applications with their company, role, stage, next step, and due date.
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
                    <th scope="col" className="px-3 py-2 align-middle">
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
                    <th scope="col" className="px-3 py-2 align-middle">
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
                    <th scope="col" className="px-3 py-2 align-middle">
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Filter by stage${filters.stage.length > 0 ? `: ${filters.stage.join(", ")}` : ""}`}
                              className="w-full justify-between rounded-md px-2 text-xs font-normal"
                            />
                          }
                        >
                          <span className="truncate">
                            {filters.stage.length === 0
                              ? "All stages"
                              : filters.stage.length === 1
                                ? filters.stage[0]
                                : `${filters.stage.length} stages`}
                          </span>
                          <ChevronDown data-icon="inline-end" aria-hidden="true" />
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-56 gap-1 p-2">
                          <div className="flex items-center justify-between px-2 pb-1">
                            <span className="text-xs font-medium text-muted-foreground">Filter stages</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              disabled={filters.stage.length === 0}
                              onClick={() => setFilters((current) => ({ ...current, stage: [] }))}
                            >
                              Clear
                            </Button>
                          </div>
                          <fieldset className="flex flex-col gap-0.5">
                            <legend className="sr-only">Filter applications by stage</legend>
                            {applicationStatuses.map((status) => (
                              <label
                                key={status}
                                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted/60"
                              >
                                <Checkbox
                                  checked={filters.stage.includes(status)}
                                  onCheckedChange={(checked) =>
                                    setFilters((current) => ({
                                      ...current,
                                      stage: checked === true
                                        ? [...current.stage, status]
                                        : current.stage.filter((stage) => stage !== status),
                                    }))
                                  }
                                />
                                <span>{status}</span>
                              </label>
                            ))}
                          </fieldset>
                        </PopoverContent>
                      </Popover>
                    </th>
                    <th scope="col" className="px-3 py-2 align-middle">
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
                    <th scope="col" className="px-3 py-2 align-middle">
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
                            <ApplicationStatusControl application={application} onStatusChange={updateApplicationStatus} />
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
                          {hasActiveFilters ? "No applications match these filters." : "No roles in your tracker yet. Mark one as interested on Canvas or add an application to get started."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
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
