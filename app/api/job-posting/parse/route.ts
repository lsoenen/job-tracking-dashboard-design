import { NextResponse } from "next/server"

const MAX_HTML_BYTES = 1_000_000
const MAX_URL_LENGTH = 2_048
const ALLOWED_JOB_DOMAINS = [
  "linkedin.com",
  "indeed.com",
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "smartrecruiters.com",
  "workdayjobs.com",
  "workable.com",
  "jobvite.com",
  "ziprecruiter.com",
  "glassdoor.com",
] as const

function supportedJobUrl(value: string) {
  if (value.length > MAX_URL_LENGTH) return null

  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "")
    const isSupportedHost = ALLOWED_JOB_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !isSupportedHost
    ) {
      return null
    }

    return url
  } catch {
    return null
  }
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  }

  return value.replace(/&(#x[\da-f]{1,6}|#\d{1,7}|[a-z]{2,10});/gi, (entity, name: string) => {
    if (name.startsWith("#x")) {
      const point = Number.parseInt(name.slice(2), 16)
      return point <= 0x10ffff ? String.fromCodePoint(point) : ""
    }
    if (name.startsWith("#")) {
      const point = Number.parseInt(name.slice(1), 10)
      return point <= 0x10ffff ? String.fromCodePoint(point) : ""
    }
    return namedEntities[name.toLowerCase()] ?? entity
  })
}

function cleanText(value: string, maxLength = 5_000) {
  return decodeHtmlEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}

function getMetaContent(html: string, key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes: Record<string, string> = {}
    const attributePattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g

    for (const attribute of match[0].matchAll(attributePattern)) {
      attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? attribute[4] ?? ""
    }

    const name = (attributes.property || attributes.name || "").toLowerCase()
    if (name === key.toLowerCase() && attributes.content) return decodeHtmlEntities(attributes.content)
  }

  return ""
}

function findJobPosting(value: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 20 || value === null || typeof value !== "object") return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobPosting(item, depth + 1)
      if (found) return found
    }
    return null
  }

  const record = value as Record<string, unknown>
  const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]]
  if (types.some((type) => typeof type === "string" && type.toLowerCase() === "jobposting")) {
    return record
  }

  for (const child of Object.values(record)) {
    const found = findJobPosting(child, depth + 1)
    if (found) return found
  }

  return null
}

function parseTitle(title: string) {
  const withoutBoardName = cleanText(title).replace(
    /\s*(?:\||—|–|- )\s*(?:LinkedIn|Indeed|Glassdoor|ZipRecruiter|Greenhouse|Lever|Ashby|Workday|SmartRecruiters)\s*$/i,
    "",
  )
  const atMatch = withoutBoardName.match(/^(.+?)\s+at\s+(.+)$/i)
  if (atMatch) return { role: atMatch[1], company: atMatch[2] }

  const parts = withoutBoardName.split(/\s+(?:\||—|–|-)\s+/).filter(Boolean)
  if (parts.length > 1) return { role: parts[0], company: parts[1] }
  return { role: withoutBoardName, company: "" }
}

function companyFromPath(url: URL) {
  const hostname = url.hostname.toLowerCase()
  const segments = url.pathname.split("/").filter(Boolean)
  const isHostedBoard = ["greenhouse.io", "lever.co", "ashbyhq.com", "workable.com", "smartrecruiters.com"].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )
  const slug = isHostedBoard ? segments[0] : ""

  if (!slug || ["jobs", "job", "view", "search"].includes(slug.toLowerCase())) return ""
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getStructuredString(value: unknown) {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name
  }
  return ""
}

async function readHtml(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) return ""

  const decoder = new TextDecoder()
  let html = ""
  let totalBytes = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_HTML_BYTES) {
      await reader.cancel()
      throw new Error("Page too large")
    }
    html += decoder.decode(value, { stream: true })
  }

  return html + decoder.decode()
}

function extractDetails(html: string, url: URL) {
  let structuredData: Record<string, unknown> | null = null

  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      structuredData = findJobPosting(JSON.parse(match[1]))
      if (structuredData) break
    } catch {
      continue
    }
  }

  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""
  const metadataTitle = getMetaContent(html, "og:title") || getMetaContent(html, "twitter:title") || titleTag
  const titleParts = parseTitle(metadataTitle)
  const organization = structuredData?.hiringOrganization
  const structuredCompany =
    organization && typeof organization === "object" && "name" in organization
      ? getStructuredString(organization)
      : ""
  const siteName = getMetaContent(html, "og:site_name")
  const genericBoardNames = /^(linkedin|indeed|glassdoor|ziprecruiter|greenhouse|lever|ashby|workday|smartrecruiters)$/i
  const company =
    cleanText(structuredCompany, 200) ||
    cleanText(titleParts.company, 200) ||
    (!genericBoardNames.test(siteName) ? cleanText(siteName, 200) : "") ||
    companyFromPath(url)
  const role = cleanText(getStructuredString(structuredData?.title) || titleParts.role, 200)
  const description = cleanText(
    getStructuredString(structuredData?.description) || getMetaContent(html, "og:description") || getMetaContent(html, "description"),
  )

  return {
    company,
    role,
    description,
    sourceUrl: url.toString(),
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > 4_096) {
    return NextResponse.json({ error: "The link request is too large." }, { status: 413 })
  }

  let payload: unknown
  try {
    const body = await request.text()
    if (body.length > 4_096) return NextResponse.json({ error: "The link request is too large." }, { status: 413 })
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Enter a valid job posting link." }, { status: 400 })
  }

  const inputUrl =
    payload && typeof payload === "object" && "url" in payload && typeof payload.url === "string"
      ? payload.url.trim()
      : ""
  let targetUrl = supportedJobUrl(inputUrl)

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Use an HTTPS job link from LinkedIn, Indeed, Greenhouse, Lever, Ashby, or another supported board." },
      { status: 400 },
    )
  }

  try {
    let response: Response | null = null

    for (let redirectCount = 0; redirectCount <= 2; redirectCount += 1) {
      response = await fetch(targetUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "PursuitJobPostingPreview/1.0",
        },
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (!location || redirectCount === 2) break
        const redirectedUrl = supportedJobUrl(new URL(location, targetUrl).toString())
        if (!redirectedUrl) break
        await response.body?.cancel()
        targetUrl = redirectedUrl
        continue
      }

      break
    }

    if (!response?.ok) {
      return NextResponse.json(
        { error: "This job board did not expose the posting publicly. Fill in the fields manually." },
        { status: 422 },
      )
    }

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("text/html") && !contentType.toLowerCase().includes("application/xhtml+xml")) {
      return NextResponse.json(
        { error: "This link did not return a readable job posting. Fill in the fields manually." },
        { status: 422 },
      )
    }

    const responseLength = Number(response.headers.get("content-length") ?? 0)
    if (responseLength > MAX_HTML_BYTES) {
      return NextResponse.json({ error: "This job page is too large to read." }, { status: 422 })
    }

    const details = extractDetails(await readHtml(response), targetUrl)
    if (!details.company && !details.role && !details.description) {
      return NextResponse.json(
        { error: "No public job details were found. Fill in the fields manually." },
        { status: 422 },
      )
    }

    return NextResponse.json(details)
  } catch {
    return NextResponse.json(
      { error: "This job posting could not be read right now. Fill in the fields manually." },
      { status: 502 },
    )
  }
}
