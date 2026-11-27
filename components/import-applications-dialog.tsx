"use client"

import { useMemo, useState } from "react"
import { FileSpreadsheet, LoaderCircle, Upload } from "lucide-react"
import { toast } from "sonner"

import { useApplications } from "@/components/applications-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { applicationStatusClassName } from "@/lib/application-helpers"
import { applicationStatuses, furthestStageLabels, statusLabel, type ApplicationStatus } from "@/lib/applications"
import { formatDueLabel } from "@/lib/data"
import {
  buildImportPlan,
  detectHeaderRow,
  distinctStatusValues,
  guessMapping,
  guessStatus,
  importFields,
  readWorkbook,
  sheetToGrid,
  type ColumnMapping,
  type Grid,
  type ImportFieldKey,
} from "@/lib/spreadsheet-import"
import { StatusLabel } from "@/components/status-label"

const maxFileSize = 10 * 1024 * 1024
const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

type LoadedFile = {
  fileName: string
  sheets: { name: string; grid: Grid }[]
}

type SheetState = {
  sheetIndex: number
  headerRow: number
  mapping: ColumnMapping
  statusOverrides: Record<string, ApplicationStatus>
}

function initialSheetState(grid: Grid, sheetIndex: number): SheetState {
  const headerRow = detectHeaderRow(grid)
  const headers = (grid[headerRow] ?? []).map((cell) => cell.text)
  return { sheetIndex, headerRow, mapping: guessMapping(headers, grid.slice(headerRow + 1)), statusOverrides: {} }
}

export function ImportApplicationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { applications, importApplications } = useApplications()
  const [file, setFile] = useState<LoadedFile | null>(null)
  const [sheetState, setSheetState] = useState<SheetState | null>(null)
  const [includeOtherColumns, setIncludeOtherColumns] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  function reset() {
    setFile(null)
    setSheetState(null)
    setError(null)
    setIncludeOtherColumns(true)
  }

  async function handleFile(selected: File) {
    setError(null)

    if (!/\.(xlsx|xlsm|xls|csv|tsv|numbers|ods)$/i.test(selected.name)) {
      setError("Choose an Excel (.xlsx or .xls) or CSV file.")
      return
    }
    if (selected.size > maxFileSize) {
      setError("That file is over 10 MB. Try saving just your tracking sheet as a new file.")
      return
    }

    setIsReading(true)
    try {
      const xlsx = await import("xlsx")
      const workbook = readWorkbook(xlsx, await selected.arrayBuffer())
      const sheets = workbook.SheetNames.map((name) => ({ name, grid: sheetToGrid(xlsx, workbook.Sheets[name]) })).filter(
        (sheet) => sheet.grid.length > 1,
      )

      if (sheets.length === 0) {
        setError("That file doesn't have any rows to import.")
        return
      }

      // Start on the sheet with the most rows
      const largest = sheets.reduce((best, sheet, index) => (sheet.grid.length > sheets[best].grid.length ? index : best), 0)
      setFile({ fileName: selected.name, sheets })
      setSheetState(initialSheetState(sheets[largest].grid, largest))
    } catch (readError) {
      console.error("Spreadsheet read failed:", readError)
      setError("That file couldn't be read. If it's password-protected, remove the password and try again.")
    } finally {
      setIsReading(false)
    }
  }

  const sheet = file && sheetState ? file.sheets[sheetState.sheetIndex] : null
  const headers = useMemo(
    () => (sheet && sheetState ? (sheet.grid[sheetState.headerRow] ?? []).map((cell, index) => cell.text || `Column ${index + 1}`) : []),
    [sheet, sheetState],
  )
  const dataRows = useMemo(() => (sheet && sheetState ? sheet.grid.slice(sheetState.headerRow + 1) : []), [sheet, sheetState])
  const statusValues = useMemo(
    () => (sheetState ? distinctStatusValues(dataRows, sheetState.mapping.status) : []),
    [dataRows, sheetState],
  )
  const plan = useMemo(
    () =>
      sheetState
        ? buildImportPlan({
            headers,
            rows: dataRows,
            mapping: sheetState.mapping,
            statusOverrides: sheetState.statusOverrides,
            includeOtherColumns,
            existing: applications,
          })
        : null,
    [headers, dataRows, sheetState, includeOtherColumns, applications],
  )
  const missingRequired = sheetState ? sheetState.mapping.company === null || sheetState.mapping.role === null : true

  function setMapping(field: ImportFieldKey, column: number | null) {
    setSheetState((current) => {
      if (!current) return current
      const mapping = { ...current.mapping }
      // A column can only feed one field
      for (const key of Object.keys(mapping) as ImportFieldKey[]) {
        if (column !== null && mapping[key] === column) mapping[key] = null
      }
      mapping[field] = column
      return { ...current, mapping, statusOverrides: field === "status" ? {} : current.statusOverrides }
    })
  }

  async function handleImport() {
    if (!plan || plan.applications.length === 0) return
    setIsImporting(true)
    const result = await importApplications(plan.applications)
    setIsImporting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast.success(`Imported ${result.imported} application${result.imported === 1 ? "" : "s"}`)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-5 pr-14">
          <DialogTitle>Import from a spreadsheet</DialogTitle>
          <DialogDescription>
            {file
              ? `Check how ${file.fileName} matches up, then import.`
              : "Bring in the applications you already track in Excel or a CSV. The file is read in your browser and isn't uploaded."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6">
          {!file || !sheetState || !sheet ? (
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="import-file">Spreadsheet file</FieldLabel>
              <label
                htmlFor="import-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center hover:bg-muted/40"
              >
                {isReading ? (
                  <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  <FileSpreadsheet aria-hidden="true" className="size-6 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{isReading ? "Reading your file…" : "Choose a file"}</span>
                <span className="text-xs text-muted-foreground">.xlsx, .xls, or .csv · up to 10 MB</span>
              </label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xlsm,.xls,.csv,.tsv,.ods,.numbers,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="sr-only"
                disabled={isReading}
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0]
                  event.currentTarget.value = ""
                  if (selected) void handleFile(selected)
                }}
              />
              <FieldDescription>
                Your first row should be column headers like Company, Role, Status, and Date applied. Columns are matched
                automatically and you can adjust them next.
              </FieldDescription>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            </Field>
          ) : (
            <>
              {file.sheets.length > 1 && (
                <Field>
                  <FieldLabel htmlFor="import-sheet">Sheet</FieldLabel>
                  <select
                    id="import-sheet"
                    className={`${selectClassName} sm:w-72`}
                    value={sheetState.sheetIndex}
                    onChange={(event) => {
                      const index = Number(event.target.value)
                      setSheetState(initialSheetState(file.sheets[index].grid, index))
                    }}
                  >
                    {file.sheets.map((item, index) => (
                      <option key={item.name} value={index}>
                        {item.name} ({item.grid.length - 1} rows)
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <section aria-labelledby="import-columns-title" className="flex flex-col gap-3">
                <div>
                  <h3 id="import-columns-title" className="text-sm font-medium">Match your columns</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Company and role are required. Everything else is optional.</p>
                </div>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  {importFields.map((field) => (
                    <div key={field.key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] items-center gap-2">
                      <label htmlFor={`map-${field.key}`} className="text-sm">
                        {field.label}
                        {field.required && <span className="text-destructive"> *</span>}
                      </label>
                      <select
                        id={`map-${field.key}`}
                        className={selectClassName}
                        value={sheetState.mapping[field.key] ?? ""}
                        aria-invalid={field.required && sheetState.mapping[field.key] === null}
                        onChange={(event) => setMapping(field.key, event.target.value === "" ? null : Number(event.target.value))}
                      >
                        <option value="">{field.required ? "Choose a column…" : "Don't import"}</option>
                        {headers.map((header, column) => (
                          <option key={column} value={column}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeOtherColumns}
                    onChange={(event) => setIncludeOtherColumns(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  Add any other columns (salary, location, contacts…) to each application&apos;s notes
                </label>
              </section>

              {statusValues.length > 0 && (
                <section aria-labelledby="import-status-title" className="flex flex-col gap-3">
                  <div>
                    <h3 id="import-status-title" className="text-sm font-medium">Match your statuses</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      We&apos;ve guessed a stage for each value in your status column. Rows with no status are marked Awaiting response
                      if they have a date, otherwise Interested.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">In your sheet</th>
                          <th className="px-3 py-2 font-medium">Rows</th>
                          <th className="px-3 py-2 font-medium">Imports as</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusValues.map(([value, count]) => {
                          const guess = guessStatus(value)
                          const current = sheetState.statusOverrides[value] ?? guess.status
                          return (
                            <tr key={value} className="border-t border-border">
                              <td className="px-3 py-2">
                                {value}
                                {current === "Not moving forward" && guess.stage && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    · counts as reaching {furthestStageLabels[guess.stage].toLowerCase()}
                                  </span>
                                )}
                                {!guess.confident && !sheetState.statusOverrides[value] && (
                                  <Badge variant="outline" className="ml-2 border-warning/20 bg-warning/5 text-warning">Check</Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 tabular-nums text-muted-foreground">{count}</td>
                              <td className="px-3 py-2">
                                <select
                                  aria-label={`Stage for "${value}"`}
                                  className={`${selectClassName} max-w-52`}
                                  value={current}
                                  onChange={(event) =>
                                    setSheetState((state) =>
                                      state
                                        ? { ...state, statusOverrides: { ...state.statusOverrides, [value]: event.target.value as ApplicationStatus } }
                                        : state,
                                    )
                                  }
                                >
                                  {applicationStatuses.map((status) => (
                                    <option key={status} value={status}>{statusLabel(status)}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {plan && !missingRequired && (
                <section aria-labelledby="import-preview-title" className="flex flex-col gap-3">
                  <h3 id="import-preview-title" className="text-sm font-medium">Preview</h3>
                  {plan.applications.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Company</th>
                            <th className="px-3 py-2 font-medium">Role</th>
                            <th className="px-3 py-2 font-medium">Stage</th>
                            <th className="px-3 py-2 font-medium">Applied</th>
                            <th className="px-3 py-2 font-medium">Next step</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.applications.slice(0, 5).map((application, index) => (
                            <tr key={index} className="border-t border-border">
                              <td className="max-w-40 truncate px-3 py-2 font-medium">{application.company}</td>
                              <td className="max-w-48 truncate px-3 py-2">{application.role}</td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className={`font-normal ${applicationStatusClassName(application.status)}`}>
                                  <StatusLabel status={application.status} />
                                </Badge>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDueLabel(application.appliedDate)}</td>
                              <td className="max-w-40 truncate px-3 py-2 text-muted-foreground">
                                {application.nextStep || "—"}
                                {application.dueDate ? ` · ${formatDueLabel(application.dueDate)}` : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Nothing new to import from this sheet.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {plan.applications.length} to import
                    {plan.applications.length > 5 ? " (showing the first 5)" : ""}
                    {plan.duplicates > 0 ? ` · ${plan.duplicates} already in your tracker, skipped` : ""}
                    {plan.missingRequired > 0 ? ` · ${plan.missingRequired} rows missing a company or role, skipped` : ""}
                  </p>
                </section>
              )}

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {file ? (
            <Button type="button" variant="ghost" onClick={reset} disabled={isImporting}>
              Choose a different file
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            {file && (
              <Button
                type="button"
                onClick={handleImport}
                disabled={isImporting || missingRequired || !plan || plan.applications.length === 0}
              >
                {isImporting ? (
                  <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
                ) : (
                  <Upload data-icon="inline-start" aria-hidden="true" />
                )}
                Import {plan && !missingRequired ? plan.applications.length : ""} application{plan?.applications.length === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
