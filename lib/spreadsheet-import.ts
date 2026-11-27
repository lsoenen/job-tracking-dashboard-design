import type { WorkBook, WorkSheet } from "xlsx"

import { applicationStatuses, type ApplicationStatus, type InterviewStage, type NewApplication } from "@/lib/applications"

// ---------------------------------------------------------------------------
// Fields a spreadsheet column can be imported into
// ---------------------------------------------------------------------------
export const importFields = [
  { key: "company", label: "Company", required: true },
  { key: "role", label: "Role / job title", required: true },
  { key: "status", label: "Status", required: false },
  { key: "appliedDate", label: "Applied date", required: false },
  { key: "nextStep", label: "Next step", required: false },
  { key: "dueDate", label: "Follow-up / due date", required: false },
  { key: "sourceUrl", label: "Job posting link", required: false },
  { key: "description", label: "Notes", required: false },
] as const

export type ImportFieldKey = (typeof importFields)[number]["key"]
/** Field → column index, or null when not imported */
export type ColumnMapping = Record<ImportFieldKey, number | null>

const headerSynonyms: Record<ImportFieldKey, string[]> = {
  company: ["company", "company name", "employer", "organization", "organisation", "org", "business"],
  role: ["role", "title", "job title", "position", "job", "role title", "position title", "job role", "opening"],
  status: ["status", "stage", "state", "outcome", "result", "progress", "application status", "current status"],
  appliedDate: ["applied", "date applied", "applied date", "application date", "applied on", "date submitted", "submitted", "submission date", "date of application", "date"],
  nextStep: ["next step", "next steps", "next action", "action", "action item", "to do", "todo", "next"],
  dueDate: ["follow up", "follow up date", "followup", "followup date", "due", "due date", "deadline", "next step date", "next date", "reminder", "follow up on"],
  sourceUrl: ["link", "url", "job link", "posting", "job posting", "posting url", "job url", "listing", "posting link", "application link", "job description link"],
  description: ["notes", "note", "comments", "comment", "description", "details", "job description", "summary"],
}

// ---------------------------------------------------------------------------
// Reading a sheet into a grid of cells
// ---------------------------------------------------------------------------
export type Cell = { text: string; date?: Date; number?: number; link?: string }
export type Grid = Cell[][]

type XlsxModule = typeof import("xlsx")

/** Turn a worksheet into rows of cells, keeping dates and hyperlinks */
export function sheetToGrid(xlsx: XlsxModule, sheet: WorkSheet): Grid {
  if (!sheet["!ref"]) return []

  const range = xlsx.utils.decode_range(sheet["!ref"])
  const lastRow = Math.min(range.e.r, range.s.r + 5000)
  const lastColumn = Math.min(range.e.c, range.s.c + 60)
  const grid: Grid = []

  for (let row = range.s.r; row <= lastRow; row += 1) {
    const cells: Cell[] = []
    for (let column = range.s.c; column <= lastColumn; column += 1) {
      const cell = sheet[xlsx.utils.encode_cell({ r: row, c: column })]
      if (!cell) {
        cells.push({ text: "" })
        continue
      }

      const value = cell.v
      cells.push({
        text: String(cell.w ?? value ?? "").trim(),
        date: value instanceof Date ? value : undefined,
        number: typeof value === "number" ? value : undefined,
        link: typeof cell.l?.Target === "string" ? cell.l.Target : undefined,
      })
    }
    grid.push(cells)
  }

  // Drop fully empty rows and trailing empty columns
  const rows = grid.filter((cells) => cells.some((cell) => cell.text || cell.link))
  const width = Math.max(0, ...rows.map((cells) => cells.findLastIndex((cell) => cell.text || cell.link) + 1))
  return rows.map((cells) => cells.slice(0, width))
}

export function readWorkbook(xlsx: XlsxModule, data: ArrayBuffer): WorkBook {
  return xlsx.read(data, { type: "array", cellDates: true, cellNF: true })
}

// ---------------------------------------------------------------------------
// Detecting the header row and guessing the column mapping
// ---------------------------------------------------------------------------
function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function headerScore(header: string, field: ImportFieldKey) {
  const normalized = normalizeHeader(header)
  if (!normalized) return 0
  const synonyms = headerSynonyms[field]
  if (synonyms.includes(normalized)) return 3
  if (synonyms.some((synonym) => synonym.length > 3 && normalized.includes(synonym))) return 2
  if (synonyms.some((synonym) => synonym.length > 3 && synonym.includes(normalized) && normalized.length > 3)) return 1
  return 0
}

/** The row (within the first 10) that looks most like column headers */
export function detectHeaderRow(grid: Grid) {
  let bestRow = 0
  let bestScore = -1

  grid.slice(0, 10).forEach((cells, rowIndex) => {
    const filled = cells.filter((cell) => cell.text).length
    if (filled < 2) return
    const matches = cells.filter((cell) =>
      (Object.keys(headerSynonyms) as ImportFieldKey[]).some((field) => headerScore(cell.text, field) > 0),
    ).length
    const score = matches * 10 + filled
    if (score > bestScore) {
      bestScore = score
      bestRow = rowIndex
    }
  })

  return bestRow
}

function looksLikeUrl(cell: Cell) {
  return Boolean(cell.link) || /^https?:\/\/\S+$/i.test(cell.text) || /^www\.\S+\.\S+/i.test(cell.text)
}

function columnShare(rows: Grid, column: number, test: (cell: Cell) => boolean) {
  const values = rows.map((cells) => cells[column]).filter((cell) => cell && (cell.text || cell.link))
  if (values.length === 0) return 0
  return values.filter(test).length / values.length
}

export function guessMapping(headers: string[], rows: Grid): ColumnMapping {
  const mapping = Object.fromEntries(importFields.map((field) => [field.key, null])) as ColumnMapping
  const used = new Set<number>()

  // Strongest header matches first, so e.g. "Date applied" beats a generic "Date"
  const candidates = importFields
    .flatMap((field) => headers.map((header, column) => ({ field: field.key, column, score: headerScore(header, field.key) })))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)

  for (const { field, column } of candidates) {
    if (mapping[field] !== null || used.has(column)) continue
    mapping[field] = column
    used.add(column)
  }

  // No header match for the link column: use a column that is mostly links
  if (mapping.sourceUrl === null) {
    const linkColumn = headers.findIndex((_, column) => !used.has(column) && columnShare(rows, column, looksLikeUrl) > 0.6)
    if (linkColumn >= 0) {
      mapping.sourceUrl = linkColumn
      used.add(linkColumn)
    }
  }

  // No header match for the applied date: use a column that is mostly dates
  if (mapping.appliedDate === null) {
    const dateColumn = headers.findIndex(
      (_, column) => !used.has(column) && columnShare(rows, column, (cell) => parseDateCell(cell) !== undefined) > 0.6,
    )
    if (dateColumn >= 0) mapping.appliedDate = dateColumn
  }

  return mapping
}

// ---------------------------------------------------------------------------
// Value parsing
// ---------------------------------------------------------------------------
function toIsoDate(date: Date) {
  // Excel dates arrive at (roughly) local midnight; nudge to midday so rounding
  // or time-zone offsets can't move them to the previous day.
  const safe = new Date(date.getTime() + 12 * 60 * 60 * 1000)
  const year = safe.getFullYear()
  if (year < 1990 || year > 2100) return undefined
  return `${year}-${String(safe.getMonth() + 1).padStart(2, "0")}-${String(safe.getDate()).padStart(2, "0")}`
}

const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export function parseDateCell(cell: Cell | undefined, today = new Date()): string | undefined {
  if (!cell) return undefined
  if (cell.date) return toIsoDate(cell.date)

  // Excel serial date stored as a plain number (days since 1899-12-30)
  if (cell.number !== undefined && cell.number > 30000 && cell.number < 75000) {
    return toIsoDate(new Date(Math.round((cell.number - 25569) * 86400 * 1000) + new Date().getTimezoneOffset() * 60000))
  }

  const text = cell.text.trim()
  if (!text) return undefined

  // 2026-11-20
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (match) return toIsoDate(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))

  // 11/20/2026, 11/20/26, 11/20 (US month-first)
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/)
  if (match) {
    const month = Number(match[1])
    const day = Number(match[2])
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
    const year = match[3] ? (match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])) : inferYear(month, day, today)
    return toIsoDate(new Date(year, month - 1, day))
  }

  // Nov 20, 2026 · November 20 · 20 Nov 2026
  match = text.match(/^([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?$/i) ?? null
  const reversed = match ? null : text.match(/^(\d{1,2})\s+([a-z]{3,9})\.?,?\s*(\d{4})?$/i)
  if (match || reversed) {
    const monthText = (match ? match[1] : reversed![2]).slice(0, 3).toLowerCase()
    const month = monthNames.indexOf(monthText) + 1
    const day = Number(match ? match[2] : reversed![1])
    const yearText = match ? match[3] : reversed![3]
    if (month === 0) return undefined
    const year = yearText ? Number(yearText) : inferYear(month, day, today)
    return toIsoDate(new Date(year, month - 1, day))
  }

  return undefined
}

/** A date written without a year is assumed to be within the last ~10 months, or soon after today */
function inferYear(month: number, day: number, today: Date) {
  const candidate = new Date(today.getFullYear(), month - 1, day)
  const monthsAhead = (candidate.getTime() - today.getTime()) / (30 * 24 * 60 * 60 * 1000)
  return monthsAhead > 2 ? today.getFullYear() - 1 : today.getFullYear()
}

function normalizeUrl(cell: Cell | undefined) {
  if (!cell) return undefined
  const value = cell.link ?? cell.text
  const candidate = /^www\./i.test(value) ? `https://${value}` : value
  try {
    const url = new URL(candidate)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Status translation
// ---------------------------------------------------------------------------
export type StatusChoice = ApplicationStatus | "auto"

type StatusGuess = { status: ApplicationStatus; stage?: InterviewStage; confident: boolean }

/** Which interview round a status mentions, if any ("final round", "HM", "phone screen"…) */
function detectInterviewStage(value: string): InterviewStage | undefined {
  if (/\b(no|without|before|never|didn.?t get|did not get)\b[^,;]*\b(interview|call|screen|chat)|pre.?screen|resume screen|auto.?reject/.test(value)) return undefined
  if (/final|onsite|on-site|executive|super ?day|loop/.test(value)) return "final-executive"
  if (/hiring manager|\bhm\b/.test(value)) return "hiring-manager"
  if (/technical|panel|team|case|design review|whiteboard|take.?home|assignment|exercise|portfolio|presentation|round [2-9]|2nd|second|third/.test(value)) {
    return "team-technical-case"
  }
  if (/interview|screen|phone|recruiter|call|chat|round|intro/.test(value)) return "recruiter"
  return undefined
}

export { detectInterviewStage }

export function guessStatus(raw: string): StatusGuess {
  const value = raw.toLowerCase().trim()
  const exact = applicationStatuses.find((status) => status.toLowerCase() === value)
  if (exact) return { status: exact, confident: true }

  if (/\b(offer|accepted|hired|signed)\b/.test(value)) return { status: "Offer", confident: true }
  // No reply at all is still "Applied" (it shouldn't count as a response)
  if (/ghost|no (response|reply)|never heard|unanswered/.test(value)) return { status: "Applied", confident: true }
  if (/reject|declin|no longer|not moving|not selected|unsuccessful|denied|closed|withdr|filled|turned down|^no$|^x$|^n$/.test(value)) {
    // "Rejected after final round" keeps the round, so it still counts as an interview
    return { status: "Not moving forward", stage: detectInterviewStage(value), confident: true }
  }
  // "Waiting on recruiter", "Pending review" etc. are still at the applied stage
  if (/^(waiting|pending|awaiting|in review|under review)\b/.test(value)) return { status: "Applied", confident: true }
  if (/take.?home|assignment|exercise|case study|challenge|assessment|portfolio review|presentation/.test(value)) {
    return { status: "Take-home", confident: true }
  }
  if (/final|onsite|on-site|executive|super ?day|loop/.test(value)) {
    return { status: "Interviewing", stage: "final-executive", confident: true }
  }
  if (/hiring manager|\bhm\b/.test(value)) return { status: "Interviewing", stage: "hiring-manager", confident: true }
  if (/technical|panel|team|case|design review|whiteboard|round [2-9]|2nd|second|third/.test(value)) {
    return { status: "Interviewing", stage: "team-technical-case", confident: true }
  }
  if (/interview|screen|phone|recruiter|call|chat|round|intro/.test(value)) {
    return { status: "Interviewing", stage: "recruiter", confident: true }
  }
  if (/appl|submitted|sent|pending|waiting|in review|under review|in progress|referr|^yes$|^y$|done/.test(value)) {
    return { status: "Applied", confident: true }
  }
  if (/interest|saved|wish|to apply|bookmark|research|not (yet )?applied|draft|planning|maybe|later|idea|prospect/.test(value)) {
    return { status: "Interested", confident: true }
  }

  return { status: "Applied", confident: false }
}

// ---------------------------------------------------------------------------
// Building applications
// ---------------------------------------------------------------------------
export type ImportPlan = {
  applications: NewApplication[]
  duplicates: number
  missingRequired: number
}

export function buildImportPlan({
  headers,
  rows,
  mapping,
  statusOverrides,
  includeOtherColumns,
  existing,
  today = new Date(),
}: {
  headers: string[]
  rows: Grid
  mapping: ColumnMapping
  statusOverrides: Record<string, ApplicationStatus>
  includeOtherColumns: boolean
  existing: { company: string; role: string }[]
  today?: Date
}): ImportPlan {
  const seen = new Set(existing.map((item) => `${item.company.trim().toLowerCase()}|${item.role.trim().toLowerCase()}`))
  const mappedColumns = new Set(Object.values(mapping).filter((column): column is number => column !== null))
  const cellAt = (cells: Cell[], field: ImportFieldKey) => {
    const column = mapping[field]
    return column === null ? undefined : cells[column]
  }

  const applications: NewApplication[] = []
  let duplicates = 0
  let missingRequired = 0

  for (const cells of rows) {
    const company = cellAt(cells, "company")?.text.trim() ?? ""
    const role = cellAt(cells, "role")?.text.trim() ?? ""
    if (!company || !role) {
      if (cells.some((cell) => cell.text)) missingRequired += 1
      continue
    }

    const key = `${company.toLowerCase()}|${role.toLowerCase()}`
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)

    const appliedDate = parseDateCell(cellAt(cells, "appliedDate"), today)
    const rawStatus = cellAt(cells, "status")?.text.trim() ?? ""
    let status: ApplicationStatus
    let interviewStage: InterviewStage | undefined

    if (rawStatus) {
      const guess = guessStatus(rawStatus)
      status = statusOverrides[rawStatus] ?? guess.status
      interviewStage =
        status === "Interviewing"
          ? (guess.stage ?? "recruiter")
          : status === "Not moving forward"
            ? detectInterviewStage(rawStatus.toLowerCase())
            : undefined
    } else {
      status = appliedDate ? "Applied" : "Interested"
    }

    // A link hidden behind the company or role cell counts as the posting link
    const sourceUrl =
      normalizeUrl(cellAt(cells, "sourceUrl")) ??
      normalizeUrl(cellAt(cells, "role")?.link ? cellAt(cells, "role") : undefined) ??
      normalizeUrl(cellAt(cells, "company")?.link ? cellAt(cells, "company") : undefined)

    const notes = [cellAt(cells, "description")?.text.trim() ?? ""]
    if (includeOtherColumns) {
      headers.forEach((header, column) => {
        if (mappedColumns.has(column)) return
        const value = cells[column]?.text.trim()
        if (value) notes.push(`${header || `Column ${column + 1}`}: ${value}`)
      })
    }

    applications.push({
      company: company.slice(0, 200),
      role: role.slice(0, 200),
      status,
      interviewStage,
      appliedDate,
      nextStep: (cellAt(cells, "nextStep")?.text.trim() ?? "").slice(0, 200),
      dueDate: parseDateCell(cellAt(cells, "dueDate"), today),
      sourceUrl,
      description: notes.filter(Boolean).join("\n").slice(0, 5000) || undefined,
    })
  }

  return { applications, duplicates, missingRequired }
}

export function distinctStatusValues(rows: Grid, column: number | null) {
  if (column === null) return []
  const counts = new Map<string, number>()
  for (const cells of rows) {
    const value = cells[column]?.text.trim()
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])
}
