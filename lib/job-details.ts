// Everything about a job beyond what the tracker table shows. Stored as one JSON
// object on the application (applications.details), so fields can be added freely.

export const workArrangements = ["Remote", "Hybrid", "On-site"] as const
export const employmentTypes = ["Full-time", "Part-time", "Contract", "Contract-to-hire", "Internship", "Freelance"] as const
export const companyStages = ["Early-stage startup", "Growth-stage", "Late-stage private", "Public", "Agency", "Nonprofit", "Government"] as const
export const companySizes = ["1–50", "51–200", "201–1,000", "1,001–5,000", "5,000+"] as const
export const salaryPeriods = ["year", "hour"] as const
export const jobSources = ["Canvas", "LinkedIn", "Company website", "Referral", "Recruiter reached out", "Indeed", "Wellfound", "Other"] as const

export type CustomField = { id: string; label: string; value: string }

export type JobDetails = {
  // Compensation
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  salaryPeriod?: (typeof salaryPeriods)[number]
  equity?: string
  bonus?: string
  benefits?: string
  // Role
  location?: string
  workArrangement?: (typeof workArrangements)[number]
  employmentType?: (typeof employmentTypes)[number]
  level?: string
  team?: string
  // Company
  industry?: string
  companyStage?: (typeof companyStages)[number]
  companySize?: (typeof companySizes)[number]
  companyWebsite?: string
  // Your take
  excitement?: number
  pros?: string
  concerns?: string
  // Source & dates
  source?: (typeof jobSources)[number]
  referredBy?: string
  deadline?: string
  // Anything else
  custom?: CustomField[]
  /** The full posting text, saved by "Import posting" (used for networking suggestions and fill-ins) */
  postingText?: string
}

export const excitementLabels = ["", "Not really", "Lukewarm", "Interested", "Excited", "Dream job"] as const

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function compactMoney(value: number, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `
  if (value >= 1000) {
    const thousands = value / 1000
    return `${symbol}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`
  }
  return `${symbol}${value.toLocaleString("en-US")}`
}

export function formatSalary(details: JobDetails) {
  const { salaryMin, salaryMax } = details
  if (!salaryMin && !salaryMax) return undefined
  const currency = details.salaryCurrency || "USD"
  const period = details.salaryPeriod === "hour" ? "/hr" : "/yr"
  if (salaryMin && salaryMax && salaryMin !== salaryMax) {
    return `${compactMoney(salaryMin, currency)}–${compactMoney(salaryMax, currency).replace(/^[^\d]+/, "")}${period}`
  }
  return `${compactMoney((salaryMin || salaryMax)!, currency)}${period}`
}

// ---------------------------------------------------------------------------
// Reading details out of a job posting
// ---------------------------------------------------------------------------
function toAmount(raw: string) {
  const value = raw.trim()
  const thousands = /k$/i.test(value)
  // "192,000" and "70.000" use thousands separators; "245.5k" is a decimal
  const number = /^\d{1,3}([,.]\d{3})+$/.test(value) ? Number(value.replace(/[,.]/g, "")) : Number(value.replace(/[^\d.]/g, ""))
  if (!Number.isFinite(number) || number === 0) return undefined
  return Math.round(thousands ? number * 1000 : number)
}

/** The first pay range in a posting: "$192,000 - $240,000", "$180K–$220K", "$65 - $80 per hour" */
export function salaryFromText(text: string): Pick<JobDetails, "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryPeriod"> | undefined {
  const match = text.match(
    /(US\$|CA\$|\$|€|£)\s?(\d{1,3}(?:[,.]\d{3})+|\d{2,3}(?:\.\d+)?\s?[kK]?|\d{2,3})\s*(?:USD|CAD)?\s*(?:[-–—]|to)\s*(?:US\$|CA\$|\$|€|£)?\s?(\d{1,3}(?:[,.]\d{3})+|\d{2,3}(?:\.\d+)?\s?[kK]?|\d{2,3})(\s*(?:USD|CAD|EUR|GBP))?([^.\n]{0,40})/,
  )
  if (!match) {
    // No currency symbol, but a currency code after: "140,000 - 180,000 USD"
    const coded = text.match(/\b(\d{1,3}(?:[,.]\d{3})+)\s*(?:[-–—]|to)\s*(\d{1,3}(?:[,.]\d{3})+)\s*(USD|CAD|EUR|GBP)\b/)
    if (!coded) return undefined
    const low = toAmount(coded[1])
    const high = toAmount(coded[2])
    if (!low || !high || high < low || high < 20000) return undefined
    return { salaryMin: low, salaryMax: high, salaryCurrency: coded[3], salaryPeriod: "year" }
  }

  const min = toAmount(match[2])
  const max = toAmount(match[3])
  if (!min || !max || max < min) return undefined

  const currency =
    match[1] === "€" ? "EUR" : match[1] === "£" ? "GBP" : match[1] === "CA$" || /CAD/.test(match[4] ?? "") ? "CAD" : "USD"
  const hourly = /hour|hr\b|\/h\b/i.test(match[5] ?? "") || max < 500
  // Ignore things that look like money but aren't pay (e.g. "$10 - $20 million in revenue")
  if (/million|billion|\bm\b|\bbn\b/i.test(match[5] ?? "")) return undefined
  if (!hourly && max < 20000) return undefined

  return { salaryMin: min, salaryMax: max, salaryCurrency: currency, salaryPeriod: hourly ? "hour" : "year" }
}

function levelFromTitle(title: string) {
  const value = title.toLowerCase()
  if (/\b(vp|vice president|chief)\b/.test(value)) return "Executive"
  if (/\bhead of\b/.test(value)) return "Head of"
  if (/\bdirector\b/.test(value)) return "Director"
  if (/\bmanager\b/.test(value)) return "Manager"
  if (/\bprincipal\b/.test(value)) return "Principal"
  if (/\bstaff\b/.test(value)) return "Staff"
  if (/\blead\b/.test(value)) return "Lead"
  if (/\b(senior|sr\.?)\b/.test(value)) return "Senior"
  if (/\b(intern|internship)\b/.test(value)) return "Intern"
  if (/\b(new grad|graduate|junior|associate)\b/.test(value)) return "Entry level"
  return "Mid level"
}

export type PostingFacts = {
  company: string
  title: string
  description?: string
  location?: string
  isRemote?: boolean
  department?: string
  industry?: string
  companyDomain?: string
  fromCanvas?: boolean
}

/** Details we can fill in automatically from a posting */
export function detailsFromPosting(facts: PostingFacts): JobDetails {
  const text = facts.description ?? ""
  const details: JobDetails = { ...salaryFromText(text) }

  // A structured location wins; otherwise look for a "Location: …" line in the text
  const location =
    facts.location?.split("•").map((part) => part.trim()).filter(Boolean).join(", ") ||
    text.match(/^\s*(?:locations?|based in|office location|where)\s*[:\-–]\s*(.{3,100})$/im)?.[1]?.trim()
  if (location) details.location = location

  if (facts.isRemote || /\bremote\b/i.test(facts.location ?? "")) details.workArrangement = "Remote"
  else if (/\bhybrid\b/i.test(`${facts.location ?? ""} ${text.slice(0, 3000)}`)) details.workArrangement = "Hybrid"
  else if (/\b(on-?site|in[- ]office|in person)\b/i.test(text.slice(0, 3000))) details.workArrangement = "On-site"

  if (/\bintern(ship)?\b/i.test(facts.title)) details.employmentType = "Internship"
  else if (/\bcontract\b/i.test(facts.title)) details.employmentType = "Contract"
  else if (facts.fromCanvas) details.employmentType = "Full-time"

  details.level = levelFromTitle(facts.title)
  const team = facts.department || facts.title.match(/,\s*([^,(]+)$/)?.[1]?.trim()
  if (team && team.length <= 50) details.team = team

  if (/\b(equity|stock options?|rsus?)\b/i.test(text)) details.equity = "Mentioned in posting"
  if (facts.industry) details.industry = facts.industry
  if (facts.companyDomain) details.companyWebsite = `https://${facts.companyDomain}`
  if (facts.fromCanvas) details.source = "Canvas"

  return details
}

/** Only the suggested values for fields that are still empty */
export function missingFromPosting(current: JobDetails, suggested: JobDetails): JobDetails {
  const result: JobDetails = {}
  for (const [key, value] of Object.entries(suggested) as [keyof JobDetails, JobDetails[keyof JobDetails]][]) {
    if (value === undefined || value === "") continue
    const existing = current[key]
    if (existing === undefined || existing === "" || (Array.isArray(existing) && existing.length === 0)) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  // Salary fields travel together
  if (current.salaryMin || current.salaryMax) {
    delete result.salaryMin
    delete result.salaryMax
    delete result.salaryCurrency
    delete result.salaryPeriod
  }
  return result
}

/** Remove empty values so the stored object stays tidy */
export function cleanDetails(details: JobDetails): JobDetails {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === "") continue
    if (typeof value === "number" && !Number.isFinite(value)) continue
    if (Array.isArray(value)) {
      const items = (value as CustomField[]).filter((item) => item.label.trim() || item.value.trim())
      if (items.length) result[key] = items.map((item) => ({ ...item, label: item.label.trim(), value: item.value.trim() }))
      continue
    }
    result[key] = typeof value === "string" ? value.trim() : value
  }
  return result as JobDetails
}
