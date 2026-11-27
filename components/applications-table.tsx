"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { ArrowDown, ArrowDownUp, ArrowUp, ArrowUpRight, ChevronDown, Ellipsis, FileSpreadsheet, Pencil, Search, Trash2 } from "lucide-react"

import { AddApplicationSheet } from "@/components/add-application-sheet"
import { AppliedDatePicker } from "@/components/applied-date-picker"
import { ApplicationPreviewPanel } from "@/components/application-preview-panel"
import { ApplicationStatusControl } from "@/components/application-status-control"
import { DeleteApplicationDialog } from "@/components/delete-application-dialog"
import { EditApplicationSheet } from "@/components/edit-application-sheet"
import { ImportApplicationsDialog } from "@/components/import-applications-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { applicationStatusClassName } from "@/lib/application-helpers"
import { applicationStatuses, statusLabel, type Application, type ApplicationStatus } from "@/lib/applications"
import { StatusLabel } from "@/components/status-label"

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    appliedDate: "",
    stage: [] as string[],
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [appliedDateSort, setAppliedDateSort] = useState<"asc" | "desc" | null>(null)
  const {
    applications: applicationRows,
    addApplication,
    updateApplicationAppliedDate,
    updateApplicationStatus,
    statusEvents,
  } = useApplications()

  function handleStatusChange(applicationId: string, status: ApplicationStatus) {
    const application = applicationRows.find((item) => item.id === applicationId)
    updateApplicationStatus(applicationId, status)
    if (status !== "Not moving forward" || !application || application.status === status) return

    // Nothing on record says this reached an interview: offer to record how far it got
    const interviewedOnRecord =
      Boolean(application.interviewStage) ||
      statusEvents.some(
        (event) =>
          event.applicationId === applicationId &&
          (event.toStatus === "Interviewing" || event.toStatus === "Take-home" || event.toStatus === "Offer"),
      )
    if (interviewedOnRecord) return

    toast("Marked as not moving forward", {
      description: "Did it get to an interview first? Recording it keeps your interview rate accurate.",
      duration: 10000,
      action: { label: "Record how far", onClick: () => setEditingId(applicationId) },
    })
  }
  const selectedApplication = applicationRows.find((application) => application.id === selectedId)
  const editingApplication = applicationRows.find((application) => application.id === editingId) ?? null
  const deletingApplication = applicationRows.find((application) => application.id === deletingId) ?? null
  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesFilter = (value: string, filter: string) =>
      value.toLowerCase().includes(filter.trim().toLowerCase())

    const filteredRows = applicationRows.filter((application) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          application.company,
          application.role,
          application.description ?? "",
          application.sourceUrl ?? "",
          application.status,
          statusLabel(application.status),
          application.appliedDate ? format(parseISO(application.appliedDate), "MMM d, yyyy") : "",
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
        matchesFilter(
          application.appliedDate ? format(parseISO(application.appliedDate), "MMM d, yyyy") : "",
          filters.appliedDate,
        ) &&
        (filters.stage.length === 0 || filters.stage.includes(application.status))
      )
    })

    if (!appliedDateSort) return filteredRows

    return [...filteredRows].sort((left, right) => {
      const leftDate = left.appliedDate ?? ""
      const rightDate = right.appliedDate ?? ""

      if (!leftDate) return rightDate ? 1 : 0
      if (!rightDate) return -1

      const dateOrder = leftDate.localeCompare(rightDate)
      return appliedDateSort === "asc" ? dateOrder : -dateOrder
    })
  }, [applicationRows, query, filters, appliedDateSort])
  const hasActiveFilters = Boolean(
    query.trim() ||
    filters.stage.length > 0 ||
    filters.company ||
    filters.role ||
    filters.appliedDate,
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
            <div className="flex gap-2">
              <AddApplicationSheet onAdd={addApplication} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button type="button" size="icon-sm" variant="outline" aria-label="More options" title="More options" />}
                >
                  <Ellipsis aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setImportOpen(true)}>
                    <FileSpreadsheet aria-hidden="true" />
                    Import from Excel or CSV…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ImportApplicationsDialog open={importOpen} onOpenChange={setImportOpen} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={selectedApplication ? "grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" : ""}>
          <div className="min-w-0">
            <div>
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">
                  Job applications with their company, role, applied date, and stage. Open an application to see its next step and due date.
                </caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th scope="col" className="w-[26%] truncate px-2 py-2 font-medium sm:px-3">Company</th>
                    <th scope="col" className="w-[36%] truncate px-2 py-2 font-medium sm:px-3">Role</th>
                    <th
                      scope="col"
                      aria-sort={appliedDateSort === "desc" ? "descending" : appliedDateSort === "asc" ? "ascending" : "none"}
                      className="w-[17%] px-2 py-2 font-medium sm:px-3"
                    >
                      <button
                        type="button"
                        onClick={() => setAppliedDateSort((current) => current === "desc" ? "asc" : "desc")}
                        aria-label={`Sort by applied date, ${appliedDateSort === "desc" ? "oldest first" : "newest first"}`}
                        className="flex max-w-full items-center gap-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <span className="truncate">Applied date</span>
                        {appliedDateSort === "desc" ? (
                          <ArrowDown aria-hidden="true" className="size-3 shrink-0" />
                        ) : appliedDateSort === "asc" ? (
                          <ArrowUp aria-hidden="true" className="size-3 shrink-0" />
                        ) : (
                          <ArrowDownUp aria-hidden="true" className="size-3 shrink-0" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="w-[21%] truncate px-2 py-2 font-medium sm:px-3">Stage</th>
                    <th scope="col" className="w-10 px-1 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-2 py-2 align-middle sm:px-3">
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
                    <th scope="col" className="px-2 py-2 align-middle sm:px-3">
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
                    <th scope="col" className="px-2 py-2 align-middle sm:px-3">
                      <label className="sr-only" htmlFor="filter-applied-date">Filter by applied date</label>
                      <input
                        id="filter-applied-date"
                        type="search"
                        value={filters.appliedDate}
                        onChange={(event) => setFilters((current) => ({ ...current, appliedDate: event.target.value }))}
                        placeholder="Filter date"
                        className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </th>
                    <th scope="col" className="px-2 py-2 align-middle sm:px-3">
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Filter by stage${filters.stage.length > 0 ? `: ${filters.stage.map((stage) => statusLabel(stage as ApplicationStatus)).join(", ")}` : ""}`}
                              className="w-full min-w-0 shrink justify-between overflow-hidden rounded-md px-2 text-xs font-normal"
                            />
                          }
                        >
                          <span className="truncate">
                            {filters.stage.length === 0
                              ? "All stages"
                              : filters.stage.length === 1
                                ? statusLabel(filters.stage[0] as ApplicationStatus)
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
                                <span>{statusLabel(status)}</span>
                              </label>
                            ))}
                          </fieldset>
                        </PopoverContent>
                      </Popover>
                    </th>
                    <th scope="col" className="px-1 py-2"><span className="sr-only">No filter</span></th>
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
                          <td className="overflow-hidden px-2 py-2 sm:px-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedId(application.id)
                              }}
                              aria-label={`Preview ${application.role} at ${application.company}`}
                              className="flex w-full min-w-0 items-center gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <Avatar className={`size-6 shrink-0 rounded-full border-0 after:hidden bg-background`}>
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
                              <span title={application.company} className="block min-w-0 truncate text-xs font-medium text-foreground">{application.company}</span>
                            </button>
                          </td>
                          <td className="overflow-hidden px-2 py-2 sm:px-3">
                            <Link
                              href={`/applications/${encodeURIComponent(application.id)}`}
                              aria-label={`Open ${application.role} at ${application.company}`}
                              className="group inline-flex max-w-full items-center gap-1 rounded-sm text-left text-xs font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <span title={application.role} className="truncate underline-offset-4 group-hover:underline">{application.role}</span>
                              <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                            </Link>
                          </td>
                          <td className="overflow-hidden px-1 py-2 sm:px-2">
                            <AppliedDatePicker
                              value={application.appliedDate}
                              company={application.company}
                              role={application.role}
                              onChange={(appliedDate) => updateApplicationAppliedDate(application.id, appliedDate)}
                            />
                          </td>
                          <td className="overflow-hidden px-2 py-2 sm:px-3">
                            <ApplicationStatusControl application={application} onStatusChange={handleStatusChange} />
                          </td>
                          <td className="px-1 py-1.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label={`Actions for ${application.role} at ${application.company}`}
                                    className="text-muted-foreground"
                                  />
                                }
                              >
                                <Ellipsis aria-hidden="true" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="min-w-36">
                                <DropdownMenuItem onClick={() => setEditingId(application.id)}>
                                  <Pencil aria-hidden="true" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingId(application.id)}
                                  className="text-destructive data-highlighted:bg-destructive/10 [&_svg]:text-destructive"
                                >
                                  <Trash2 aria-hidden="true" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
            <ApplicationPreviewPanel
              key={selectedApplication.id}
              application={selectedApplication}
              onClose={() => setSelectedId(null)}
              onEdit={() => setEditingId(selectedApplication.id)}
              onDelete={() => setDeletingId(selectedApplication.id)}
            />
          )}
          <EditApplicationSheet application={editingApplication} onOpenChange={(open) => !open && setEditingId(null)} />
          <DeleteApplicationDialog
            application={deletingApplication}
            onOpenChange={(open) => !open && setDeletingId(null)}
            onDeleted={(id) => {
              if (id === selectedId) setSelectedId(null)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
