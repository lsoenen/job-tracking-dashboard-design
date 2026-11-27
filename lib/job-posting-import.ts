import "server-only"

import { htmlToText } from "@/lib/jobs/fetchers"
import { detailsFromPosting, salaryFromText, type JobDetails } from "@/lib/job-details"
import { jobBoards } from "@/lib/jobs/sources"

/** What we could read about a posting, before turning it into JobDetails */
export type ImportedPosting = {
  source: "greenhouse" | "lever" | "ashby" | "page" | "text"
  url?: string
  company?: string
  title?: string
  text: string
  location?: string
  isRemote?: boolean
  workplace?: "Remote" | "Hybrid" | "On-site"
  department?: string
  employmentType?: JobDetails["employmentType"]
  deadline?: string
  industry?: string
  website?: string
  salary?: Pick<JobDetails, "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryPeriod">
}

const MAX_TEXT = 12000
const MAX_HTML_BYTES = 1_500_000

// Only these sites are fetched (prevents the server from being pointed at arbitrary URLs)
const allowedHosts = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "linkedin.com",
  "indeed.com",
  "smartrecruiters.com",
  "myworkdayjobs.com",
  "workable.com",
  "jobvite.com",
  "ziprecruiter.com",
  "glassdoor.com",
  "wellfound.com",
  "builtin.com",
  "icims.com",
  "bamboohr.com",
  "rippling.com",
  "dover.com",
]

export function allowedJobUrl(value: string) {
  try {
    const url = new URL(value.trim())
    const host = url.hostname.toLowerCase()
    const allowed =
      allowedHosts.some((domain) => host === domain || host.endsWith(`.${domain}`)) ||
      jobBoards.some((board) => host === board.domain || host.endsWith(`.${board.domain}`))
    if (url.protocol !== "https:" || url.username || url.password || url.port || !allowed) return null
    return url
  } catch {
    return null
  }
}

function employmentTypeFrom(value: unknown): JobDetails["employmentType"] {
  const text = (Array.isArray(value) ? value.join(" ") : String(value ?? "")).toLowerCase().replace(/[_-]/g, " ")
  if (/intern/.test(text)) return "Internship"
  if (/contract to hire|temp to perm/.test(text)) return "Contract-to-hire"
  if (/contract|temporary|contractor/.test(text)) return "Contract"
  if (/part time/.test(text)) return "Part-time"
  if (/freelance/.test(text)) return "Freelance"
  if (/full time|permanent|regular/.test(text)) return "Full-time"
  return undefined
}

function workplaceFrom(value: unknown): ImportedPosting["workplace"] {
  const text = String(value ?? "").toLowerCase()
  if (/remote|telecommute/.test(text)) return "Remote"
  if (/hybrid/.test(text)) return "Hybrid"
  if (/on.?site|office/.test(text)) return "On-site"
  return undefined
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "PursuitJobImport/1.0" },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Official feeds for one posting
// ---------------------------------------------------------------------------
async function fromGreenhouse(board: string, id: string, url: string): Promise<ImportedPosting> {
  const job = await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${id}?pay_transparency=true`)
  const ranges = (job.pay_input_ranges as { min_cents?: number; max_cents?: number; currency_type?: string; title?: string }[] | undefined) ?? []
  const range = ranges[0]
  const hourly = /hour/i.test(range?.title ?? "")
  const location = (job.location as { name?: string } | undefined)?.name
  return {
    source: "greenhouse",
    url,
    company: (job.company_name as string | undefined) ?? undefined,
    title: job.title as string,
    text: htmlToText(String(job.content ?? "")).slice(0, MAX_TEXT),
    location,
    isRemote: /remote/i.test(location ?? ""),
    department: (job.departments as { name: string }[] | undefined)?.[0]?.name,
    salary:
      range?.min_cents && range.max_cents
        ? {
            salaryMin: Math.round(range.min_cents / 100),
            salaryMax: Math.round(range.max_cents / 100),
            salaryCurrency: range.currency_type || "USD",
            salaryPeriod: hourly ? "hour" : "year",
          }
        : undefined,
  }
}

async function fromLever(board: string, id: string, url: string): Promise<ImportedPosting> {
  const job = await getJson(`https://api.lever.co/v0/postings/${board}/${id}`)
  const categories = (job.categories ?? {}) as { location?: string; team?: string; department?: string; commitment?: string; allLocations?: string[] }
  const salary = job.salaryRange as { min?: number; max?: number; currency?: string; interval?: string } | undefined
  const lists = (job.lists as { text: string; content: string }[] | undefined) ?? []
  const html = [job.description ?? "", ...lists.map((list) => `<h3>${list.text}</h3><ul>${list.content}</ul>`), job.additional ?? ""].join("\n")
  return {
    source: "lever",
    url,
    title: job.text as string,
    text: htmlToText(html).slice(0, MAX_TEXT),
    location: categories.allLocations?.join(" • ") || categories.location,
    isRemote: job.workplaceType === "remote",
    workplace: workplaceFrom(job.workplaceType),
    department: categories.team ?? categories.department,
    employmentType: employmentTypeFrom(categories.commitment),
    salary:
      salary?.min && salary.max
        ? {
            salaryMin: salary.min,
            salaryMax: salary.max,
            salaryCurrency: salary.currency || "USD",
            salaryPeriod: /hour/i.test(salary.interval ?? "") ? "hour" : "year",
          }
        : undefined,
  }
}

async function fromAshby(board: string, id: string, url: string): Promise<ImportedPosting> {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${board}?includeCompensation=true`)
  const job = ((data.jobs as Record<string, unknown>[] | undefined) ?? []).find((item) => item.id === id)
  if (!job) throw new Error("Posting not found")
  const compensation = job.compensation as { compensationTierSummary?: string; scrapeableCompensationSalarySummary?: string } | undefined
  const summary = compensation?.scrapeableCompensationSalarySummary || compensation?.compensationTierSummary || ""
  const secondary = ((job.secondaryLocations as { location?: string }[] | undefined) ?? []).map((item) => item.location)
  return {
    source: "ashby",
    url,
    title: job.title as string,
    text: htmlToText(String(job.descriptionHtml ?? job.descriptionPlain ?? "")).slice(0, MAX_TEXT),
    location: [job.location as string | undefined, ...secondary].filter(Boolean).join(" • ") || undefined,
    isRemote: Boolean(job.isRemote),
    workplace: workplaceFrom(job.workplaceType),
    department: (job.team ?? job.department) as string | undefined,
    employmentType: employmentTypeFrom(job.employmentType),
    salary: summary ? salaryFromText(summary) : undefined,
  }
}

// ---------------------------------------------------------------------------
// Any other job page: read its schema.org JobPosting block
// ---------------------------------------------------------------------------
function findJobPosting(value: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 15 || !value || typeof value !== "object") return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item, depth + 1)
      if (found) return found
    }
    return null
  }
  const record = value as Record<string, unknown>
  const types = ([] as unknown[]).concat(record["@type"])
  if (types.some((type) => typeof type === "string" && type.toLowerCase() === "jobposting")) return record
  for (const child of Object.values(record)) {
    const found = findJobPosting(child, depth + 1)
    if (found) return found
  }
  return null
}

async function readLimited(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) return ""
  const decoder = new TextDecoder()
  let html = ""
  let total = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_HTML_BYTES) {
      await reader.cancel()
      break
    }
    html += decoder.decode(value, { stream: true })
  }
  return html + decoder.decode()
}

async function fromPage(start: URL): Promise<ImportedPosting> {
  let url = start
  let response: Response | null = null

  // Follow up to 3 redirects, re-checking each one against the allowlist
  for (let hop = 0; hop <= 3; hop += 1) {
    response = await fetch(url, {
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 (compatible; PursuitJobImport/1.0)" },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    })
    if (response.status < 300 || response.status >= 400) break
    const next = response.headers.get("location")
    const nextUrl = next ? allowedJobUrl(new URL(next, url).toString()) : null
    await response.body?.cancel()
    if (!nextUrl) throw new Error("Redirected somewhere we can't read")
    url = nextUrl
  }

  if (!response?.ok) throw new Error(`HTTP ${response?.status}`)
  const html = await readLimited(response)

  let posting: Record<string, unknown> | null = null
  for (const match of html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      posting = findJobPosting(JSON.parse(match[1]))
      if (posting) break
    } catch {
      continue
    }
  }
  if (!posting) throw new Error("No structured job details on this page")

  const organization = (posting.hiringOrganization ?? {}) as { name?: string; sameAs?: string }
  const places = ([] as unknown[]).concat(posting.jobLocation ?? []) as { address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string | { name?: string } } }[]
  const location = places
    .map((place) => {
      const address = place?.address ?? {}
      const country = typeof address.addressCountry === "object" ? address.addressCountry?.name : address.addressCountry
      return [address.addressLocality, address.addressRegion, country].filter(Boolean).join(", ")
    })
    .filter(Boolean)
    .join(" • ")
  const remote = /telecommute/i.test(String(posting.jobLocationType ?? ""))

  const base = posting.baseSalary as { currency?: string; value?: { minValue?: number; maxValue?: number; value?: number; unitText?: string } } | undefined
  const min = Number(base?.value?.minValue ?? base?.value?.value)
  const max = Number(base?.value?.maxValue ?? base?.value?.value)
  const deadline = typeof posting.validThrough === "string" ? posting.validThrough.slice(0, 10) : undefined

  return {
    source: "page",
    url: url.toString(),
    company: organization.name,
    title: typeof posting.title === "string" ? posting.title : undefined,
    text: htmlToText(String(posting.description ?? "")).slice(0, MAX_TEXT),
    location: location || undefined,
    isRemote: remote,
    workplace: remote ? "Remote" : undefined,
    employmentType: employmentTypeFrom(posting.employmentType),
    deadline: deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline) && deadline >= new Date().toISOString().slice(0, 10) ? deadline : undefined,
    industry: typeof posting.industry === "string" ? posting.industry : undefined,
    website: typeof organization.sameAs === "string" && /^https?:\/\//.test(organization.sameAs) ? organization.sameAs : undefined,
    salary:
      Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min
        ? {
            salaryMin: Math.round(min),
            salaryMax: Math.round(max),
            salaryCurrency: base?.currency || "USD",
            salaryPeriod: /hour/i.test(base?.value?.unitText ?? "") ? "hour" : "year",
          }
        : undefined,
  }
}

/** Read a posting from a link: official feed for Greenhouse/Lever/Ashby, structured data otherwise */
export async function importFromUrl(url: URL): Promise<ImportedPosting> {
  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split("/").filter(Boolean)

  if (host.endsWith("greenhouse.io")) {
    const jobsIndex = parts.indexOf("jobs")
    const board = url.searchParams.get("for") ?? (jobsIndex > 0 ? parts[jobsIndex - 1] : parts[0])
    const id = url.searchParams.get("gh_jid") ?? (jobsIndex >= 0 ? parts[jobsIndex + 1] : undefined)
    if (board && id && /^\d+$/.test(id)) return fromGreenhouse(board, id, url.toString())
  }
  if (host === "jobs.lever.co" && parts.length >= 2) return fromLever(parts[0], parts[1], url.toString())
  if (host === "jobs.ashbyhq.com" && parts.length >= 2) return fromAshby(parts[0], parts[1], url.toString())

  return fromPage(url)
}

/** Turn what we read into JobDetails (rules only; the route may refine with AI) */
export function postingToDetails(posting: ImportedPosting, fallback: { company: string; title: string }): JobDetails {
  const company = posting.company || fallback.company
  const known = jobBoards.find((board) => board.company.toLowerCase() === company.toLowerCase())
  const details = detailsFromPosting({
    company,
    title: posting.title || fallback.title,
    description: posting.text,
    location: posting.location,
    isRemote: posting.isRemote,
    department: posting.department,
    industry: posting.industry ?? known?.industry,
    companyDomain: known?.domain,
  })

  if (posting.salary) Object.assign(details, posting.salary)
  if (posting.workplace) details.workArrangement = posting.workplace
  if (posting.employmentType) details.employmentType = posting.employmentType
  if (posting.deadline) details.deadline = posting.deadline
  if (posting.website) details.companyWebsite = posting.website
  if (posting.source === "text") delete details.source

  return details
}
