import "server-only"

import { NO_LOGO } from "@/lib/data"
import { companyLogoUrl, jobBoards } from "@/lib/jobs/sources"

type LogoRequest = { company: string; sourceUrl?: string; companyUrl?: string }

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(inc|llc|ltd|corp|corporation|co|company|technologies|labs|hq)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

const knownByName = new Map(jobBoards.map((board) => [normalizeName(board.company), board.domain]))
const knownByBoard = new Map(jobBoards.map((board) => [board.board.toLowerCase(), board.domain]))

// Job boards, aggregators and link shorteners: their domain is not the company's
const nonCompanyHosts =
  /(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|workday\.com|linkedin\.com|lnkd\.in|indeed\.com|glassdoor\.com|wellfound\.com|angel\.co|builtin\.com|ziprecruiter\.com|monster\.com|dice\.com|smartrecruiters\.com|jobvite\.com|icims\.com|bamboohr\.com|workable\.com|breezy\.hr|recruitee\.com|teamtailor\.com|rippling\.com|dover\.com|ycombinator\.com|otta\.com|welcometothejungle\.com|dribbble\.com|google\.com|bit\.ly|notion\.site)$/i

const twoPartSuffixes = new Set(["co.uk", "com.au", "co.jp", "com.br", "co.in", "co.nz", "com.mx", "co.za"])

function registrableDomain(hostname: string) {
  const parts = hostname.toLowerCase().replace(/^www\./, "").split(".")
  if (parts.length <= 2) return parts.join(".")
  const lastTwo = parts.slice(-2).join(".")
  return twoPartSuffixes.has(lastTwo) ? parts.slice(-3).join(".") : lastTwo
}

function domainFromUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    const host = url.hostname

    // An ATS link names the company's board: boards.greenhouse.io/figma, jobs.lever.co/spotify, jobs.ashbyhq.com/linear
    if (/(greenhouse\.io|lever\.co|ashbyhq\.com)$/i.test(host)) {
      const board = (url.searchParams.get("for") ?? url.pathname.split("/").filter(Boolean)[0] ?? "").toLowerCase()
      return knownByBoard.get(board)
    }
    if (nonCompanyHosts.test(host)) return undefined
    return registrableDomain(host)
  } catch {
    return undefined
  }
}

async function lookupDomainByName(company: string) {
  try {
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 60 * 60 * 24 * 7 } },
    )
    if (!response.ok) return undefined
    const suggestions = (await response.json()) as { name?: string; domain?: string }[]
    // Only trust an exact name match. Near-misses are usually a different company.
    const target = normalizeName(company)
    return suggestions.find((item) => item.name && item.domain && normalizeName(item.name) === target)?.domain
  } catch {
    return undefined
  }
}

async function hasLogo(domain: string) {
  try {
    const response = await fetch(
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(domain)}&size=128`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 60 * 60 * 24 * 7 } },
    )
    return response.ok
  } catch {
    return false
  }
}

const cache = new Map<string, Promise<string>>()

/** Logo URL for a company, or NO_LOGO */
export function resolveCompanyLogo(request: LogoRequest): Promise<string> {
  const key = `${normalizeName(request.company)}|${request.companyUrl ?? ""}|${request.sourceUrl ?? ""}`
  let pending = cache.get(key)

  if (!pending) {
    pending = (async () => {
      const candidates = [
        knownByName.get(normalizeName(request.company)),
        domainFromUrl(request.companyUrl),
        domainFromUrl(request.sourceUrl),
      ].filter((domain): domain is string => Boolean(domain))

      for (const domain of [...new Set(candidates)]) {
        if (await hasLogo(domain)) return companyLogoUrl(domain)!
      }

      const looked = await lookupDomainByName(request.company)
      if (looked && (await hasLogo(looked))) return companyLogoUrl(looked)!
      return NO_LOGO
    })()
    cache.set(key, pending)
    if (cache.size > 2000) cache.delete(cache.keys().next().value!)
  }

  return pending
}
