export type CanvasJob = {
  id: string
  source: "greenhouse" | "lever" | "ashby"
  company: string
  companyDomain?: string
  title: string
  roleFamily: string
  department?: string
  location?: string
  isRemote: boolean
  url: string
  summary: string
  keywords: string[]
  minYears: number
  postedAt?: string
}

export type CanvasJobRow = {
  id: string
  source: CanvasJob["source"]
  company: string
  company_domain: string | null
  title: string
  role_family: string
  department: string | null
  location: string | null
  is_remote: boolean
  url: string
  summary: string
  keywords: string[] | null
  min_years: number
  posted_at: string | null
}

export const canvasJobColumns =
  "id, source, company, company_domain, title, role_family, department, location, is_remote, url, summary, keywords, min_years, posted_at"

export function canvasJobFromRow(row: CanvasJobRow): CanvasJob {
  return {
    id: row.id,
    source: row.source,
    company: row.company,
    companyDomain: row.company_domain ?? undefined,
    title: row.title,
    roleFamily: row.role_family,
    department: row.department ?? undefined,
    location: row.location ?? undefined,
    isRemote: row.is_remote,
    url: row.url,
    summary: row.summary,
    keywords: row.keywords ?? [],
    minYears: row.min_years,
    postedAt: row.posted_at ?? undefined,
  }
}

export const sourceLabels: Record<CanvasJob["source"], string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
}
