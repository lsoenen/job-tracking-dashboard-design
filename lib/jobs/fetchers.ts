import { classifyTitle, minimumYearsFromTitle, roleFamilies } from "@/lib/jobs/roles"
import type { JobBoard } from "@/lib/jobs/sources"

/** A posting ready to be saved to the `jobs` table */
export type JobRecord = {
  id: string
  source: JobBoard["source"]
  board: string
  company: string
  company_domain: string
  title: string
  role_family: string
  department: string | null
  location: string | null
  is_remote: boolean
  url: string
  summary: string
  description: string
  keywords: string[]
  min_years: number
  posted_at: string | null
  last_seen_at: string
  is_active: true
}

type RawPosting = {
  id: string
  title: string
  url: string
  department?: string | null
  location?: string | null
  isRemote?: boolean
  postedAt?: string | number | null
  html?: string | null
  text?: string | null
}

const maxDescriptionLength = 12000

// ---------------------------------------------------------------------------
// HTML → readable plain text
// ---------------------------------------------------------------------------
const namedEntities: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™",
}

export function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return namedEntities[entity.toLowerCase()] ?? match
  })
}

export function htmlToText(html: string) {
  // Greenhouse double-encodes its HTML, so decode once before stripping tags
  const source = /&lt;\/?[a-z]/i.test(html) ? decodeEntities(html) : html

  return decodeEntities(
    source
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|ul|ol|h[1-6]|section|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function summarize(text: string) {
  // Prefer a paragraph about the role itself over the company boilerplate that usually comes first
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter((line) => line.length > 80 && /[.!?]/.test(line))
  const aboutRole = /\b(you will|you['’]ll|we['’]re looking|we are looking|is hiring|are hiring|this role|the role|as an? |looking for|seeking|join (our|the))\b/i
  const paragraph =
    paragraphs.slice(0, 6).find((line) => aboutRole.test(line)) ?? paragraphs[0] ?? text.slice(0, 280)

  return paragraph.length > 280 ? `${paragraph.slice(0, 277).replace(/\s+\S*$/, "")}…` : paragraph
}

function findKeywords(text: string, vocabulary: string[]) {
  const lower = text.toLowerCase()
  return vocabulary.filter((term) => {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(lower)
  })
}

function toIso(value: RawPosting["postedAt"]) {
  if (value === null || value === undefined || value === "") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// ---------------------------------------------------------------------------
// Per-source fetchers
// ---------------------------------------------------------------------------
async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "PursuitJobSync/1.0" },
    signal: AbortSignal.timeout(25000),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<unknown>
}

async function fetchGreenhouse(board: string): Promise<RawPosting[]> {
  const data = (await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`)) as {
    jobs?: {
      id: number
      title: string
      absolute_url: string
      location?: { name?: string }
      departments?: { name: string }[]
      first_published?: string
      updated_at?: string
      content?: string
    }[]
  }

  return (data.jobs ?? []).map((job) => ({
    id: String(job.id),
    title: job.title,
    url: job.absolute_url,
    department: job.departments?.[0]?.name ?? null,
    location: job.location?.name ?? null,
    isRemote: /remote/i.test(job.location?.name ?? ""),
    postedAt: job.first_published ?? job.updated_at ?? null,
    html: job.content ?? null,
  }))
}

async function fetchLever(board: string): Promise<RawPosting[]> {
  const data = (await fetchJson(`https://api.lever.co/v0/postings/${board}?mode=json`)) as {
    id: string
    text: string
    hostedUrl: string
    createdAt?: number
    workplaceType?: string
    categories?: { department?: string; team?: string; location?: string; allLocations?: string[] }
    description?: string
    lists?: { text: string; content: string }[]
    additional?: string
  }[]

  return (Array.isArray(data) ? data : []).map((job) => ({
    id: job.id,
    title: job.text,
    url: job.hostedUrl,
    department: job.categories?.team ?? job.categories?.department ?? null,
    location: job.categories?.allLocations?.join(" • ") || job.categories?.location || null,
    isRemote: job.workplaceType === "remote" || /remote/i.test(job.categories?.location ?? ""),
    postedAt: job.createdAt ?? null,
    html: [
      job.description ?? "",
      ...(job.lists ?? []).map((list) => `<h3>${list.text}</h3><ul>${list.content}</ul>`),
      job.additional ?? "",
    ].join("\n"),
  }))
}

async function fetchAshby(board: string): Promise<RawPosting[]> {
  const data = (await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${board}`)) as {
    jobs?: {
      id: string
      title: string
      jobUrl: string
      department?: string
      team?: string
      location?: string
      secondaryLocations?: { location?: string }[]
      isRemote?: boolean
      isListed?: boolean
      publishedAt?: string
      descriptionHtml?: string
      descriptionPlain?: string
    }[]
  }

  return (data.jobs ?? [])
    .filter((job) => job.isListed !== false)
    .map((job) => ({
      id: job.id,
      title: job.title,
      url: job.jobUrl,
      department: job.team ?? job.department ?? null,
      location:
        [job.location, ...(job.secondaryLocations ?? []).map((item) => item.location)].filter(Boolean).join(" • ") || null,
      isRemote: Boolean(job.isRemote),
      postedAt: job.publishedAt ?? null,
      html: job.descriptionHtml ?? null,
      text: job.descriptionPlain ?? null,
    }))
}

const fetchers = { greenhouse: fetchGreenhouse, lever: fetchLever, ashby: fetchAshby }

/** Fetch one board and keep only postings in a supported role family */
export async function fetchBoardJobs(board: JobBoard, now = new Date()): Promise<JobRecord[]> {
  const postings = await fetchers[board.source](board.board)
  const seenAt = now.toISOString()

  return postings.flatMap((posting): JobRecord[] => {
    const title = posting.title?.trim()
    if (!title || !posting.url) return []

    const family = classifyTitle(title)
    if (!family) return []

    const text = (posting.html ? htmlToText(posting.html) : (posting.text ?? "").trim()).slice(0, maxDescriptionLength)
    const vocabulary = roleFamilies.find((item) => item.id === family.id)?.vocabulary ?? []

    return [
      {
        id: `${board.source}:${board.board}:${posting.id}`,
        source: board.source,
        board: board.board,
        company: board.company,
        company_domain: board.domain,
        title,
        role_family: family.id,
        department: posting.department ?? null,
        location: posting.location ?? null,
        is_remote: Boolean(posting.isRemote),
        url: posting.url,
        summary: summarize(text),
        description: text,
        keywords: findKeywords(`${title}\n${text}`, vocabulary),
        min_years: minimumYearsFromTitle(title),
        posted_at: toIso(posting.postedAt),
        last_seen_at: seenAt,
        is_active: true,
      },
    ]
  })
}
