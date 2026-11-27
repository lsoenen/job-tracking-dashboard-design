// Networking: who to look for at a company for one specific posting, and the
// contacts a user has found. Suggestions are roles, not people: the user finds
// the actual person on LinkedIn, so nothing is scraped or guessed about individuals.

export const contactRelationships = [
  "hiring-manager",
  "recruiter",
  "teammate",
  "partner",
  "leader",
  "referral",
  "other",
] as const
export type ContactRelationship = (typeof contactRelationships)[number]

export const relationshipLabels: Record<ContactRelationship, string> = {
  "hiring-manager": "Likely hiring manager",
  recruiter: "Recruiter",
  teammate: "Future teammate",
  partner: "Close partner",
  leader: "Design leadership",
  referral: "Referral",
  other: "Other",
}

export const outreachStatuses = ["not-contacted", "reached-out", "replied", "referred", "no-response"] as const
export type OutreachStatus = (typeof outreachStatuses)[number]

export const outreachLabels: Record<OutreachStatus, string> = {
  "not-contacted": "Not contacted",
  "reached-out": "Reached out",
  replied: "Replied",
  referred: "Referred me",
  "no-response": "No response",
}

export type Contact = {
  id: string
  applicationId: string
  name: string
  title: string
  relationship: ContactRelationship
  linkedinUrl?: string
  email?: string
  outreachStatus: OutreachStatus
  lastContactedOn?: string
  notes: string
}

export type ContactRow = {
  id: string
  application_id: string
  name: string
  title: string
  relationship: ContactRelationship
  linkedin_url: string | null
  email: string | null
  outreach_status: OutreachStatus
  last_contacted_on: string | null
  notes: string
}

export const contactColumns =
  "id, application_id, name, title, relationship, linkedin_url, email, outreach_status, last_contacted_on, notes"

export function contactFromRow(row: ContactRow): Contact {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    title: row.title,
    relationship: row.relationship,
    linkedinUrl: row.linkedin_url ?? undefined,
    email: row.email ?? undefined,
    outreachStatus: row.outreach_status,
    lastContactedOn: row.last_contacted_on ?? undefined,
    notes: row.notes,
  }
}

// ---------------------------------------------------------------------------
// "Who to look for" plan
// ---------------------------------------------------------------------------
export type NetworkingTarget = {
  id: string
  /** The title to search for, e.g. "Design Manager, Payments" */
  role: string
  relationship: ContactRelationship
  /** Why this person matters for this posting */
  why: string
  /** A line from the posting that backs this up, if there is one */
  evidence?: string
  /** A person the posting names explicitly */
  namedPerson?: string
}

export type NetworkingPlan = {
  targets: NetworkingTarget[]
  team?: string
  generatedWith: "rules" | "ai"
  generatedAt: string
}

export function linkedInPeopleSearchUrl(keywords: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}&origin=GLOBAL_SEARCH_HEADER`
}

/** Works without being signed in to LinkedIn, and often finds people LinkedIn's own search misses */
export function webPeopleSearchUrl(company: string, role: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${company}" ${role}`)}`
}

type Discipline = "product-design" | "research" | "content-design" | "design"

function disciplineOf(title: string): Discipline {
  const value = title.toLowerCase()
  if (/research/.test(value)) return "research"
  if (/content design|ux writ|content strateg/.test(value)) return "content-design"
  if (/product design|ux|ui|interaction|experience design/.test(value)) return "product-design"
  return "design"
}

type Level = "early" | "mid" | "senior" | "staff" | "manager" | "director" | "executive"

function levelOf(title: string): Level {
  const value = title.toLowerCase()
  if (/\b(vp|vice president|chief|head of)\b/.test(value)) return "executive"
  if (/\bdirector\b/.test(value)) return "director"
  if (/\bmanager\b/.test(value)) return "manager"
  if (/\b(staff|principal)\b/.test(value)) return "staff"
  if (/\b(senior|sr\.?|lead)\b/.test(value)) return "senior"
  if (/\b(intern|internship|new grad|graduate|junior|associate|apprentice)\b/.test(value)) return "early"
  return "mid"
}

/** The team or product area in a title: "Product Designer, Payments" → "Payments" */
export function teamFromTitle(title: string) {
  const cleaned = title
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(remote|hybrid|us|usa|uk|emea|apac|nyc|sf|new york|san francisco|london|berlin)\b/gi, " ")
  const match = cleaned.match(/(?:,|\s[-–—|:]\s)\s*([^,–—|:]+)$/)
  if (!match) return undefined
  const team = match[1].replace(/\s+/g, " ").trim()
  // Ignore leftovers that are seniority or job-type words, not a team
  if (!team || team.length > 40 || /^(senior|staff|principal|lead|intern(ship)?|new grad|contract|full.?time|part.?time|design|product|ux|\d+)$/i.test(team)) {
    return undefined
  }
  return team
}

/** The first sentence in the posting that matches, trimmed to a readable quote */
function findEvidence(description: string, pattern: RegExp) {
  const sentences = description
    .replace(/\n•\s*/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25)
  const sentence = sentences.find((item) => pattern.test(item))
  if (!sentence) return undefined
  return sentence.length > 180 ? `${sentence.slice(0, 177).replace(/\s+\S*$/, "")}…` : sentence
}

/** The title a posting says the role reports to: "will report to the VP of Product Design" → "VP of Product Design" */
export function statedManagerTitle(description: string) {
  const match = description.match(
    /\breport(?:s|ing)?\s+(?:directly\s+)?(?:in)?to\s+(?:the\s+|a\s+|an\s+|our\s+)?((?:[A-Z][\w&\/-]*|of|and|or|for|the)(?:\s+(?:[A-Z][\w&\/-]*|of|and|or|for|the))*)/,
  )
  if (!match) return undefined
  let title = match[1].replace(/\s+(and|or|of|for|the)$/i, "").trim()
  // "Manager or Director of Experience Design" → "Director of Experience Design"
  if (/\s+or\s+/i.test(title)) {
    const parts = title.split(/\s+or\s+/i)
    title = parts[parts.length - 1]
  }
  if (title.split(/\s+/).length < 2 || title.length > 70) return undefined
  // Must name a role, not an office or team ("SF and NYC", "Brand Studio")
  if (!/\b(manager|director|head|vp|vice president|lead|leader|chief|officer|founder|ceo|cto|cpo|partner)\b/i.test(title)) return undefined
  return title
}

const disciplineNames: Record<Discipline, { manager: string; peer: string; recruiter: string }> = {
  "product-design": { manager: "Design Manager", peer: "Product Designer", recruiter: "Design Recruiter" },
  research: { manager: "Research Manager", peer: "UX Researcher", recruiter: "Design Recruiter" },
  "content-design": { manager: "Content Design Manager", peer: "Content Designer", recruiter: "Design Recruiter" },
  design: { manager: "Design Manager", peer: "Designer", recruiter: "Design Recruiter" },
}

/** A rules-only plan from the title and description. Always available, no AI needed. */
export function buildRuleBasedPlan(job: { company: string; title: string; description: string }): NetworkingPlan {
  const discipline = disciplineOf(job.title)
  const level = levelOf(job.title)
  const team = teamFromTitle(job.title)
  const names = disciplineNames[discipline]
  const onTeam = (role: string) => (team ? `${role}, ${team}` : role)
  const description = job.description || ""
  const targets: NetworkingTarget[] = []

  // Likely hiring manager: what the posting says, or one level above the role
  const stated = statedManagerTitle(description)
  const managerRole = stated
    ? stated
    : level === "executive"
      ? "Chief Design Officer"
      : level === "director"
        ? "VP of Design"
        : level === "manager"
          ? discipline === "research" ? "Director of Research" : "Director of Design"
          : onTeam(names.manager)
  targets.push({
    id: "hiring-manager",
    role: managerRole,
    relationship: "hiring-manager",
    why: stated
      ? `The posting says this role reports to the ${stated}.`
      : level === "manager" || level === "director" || level === "executive"
        ? "This is a leadership role, so it most likely reports to the next level of design leadership."
        : team
          ? `Roles like this usually report to the ${names.manager.toLowerCase()} for ${team}.`
          : `Roles like this usually report to a ${names.manager.toLowerCase()}.`,
    evidence: findEvidence(description, /\breport(s|ing)?\s+(directly\s+)?(in)?to\b|\bhiring manager\b|\bmanager\b/i),
  })

  // Future teammates
  if (level !== "executive") {
    targets.push({
      id: "teammates",
      role: level === "early" || level === "mid" ? onTeam(`Senior ${names.peer}`) : onTeam(names.peer),
      relationship: "teammate",
      why: team
        ? `People already designing for ${team} can tell you what the work is really like, and often refer.`
        : "People already on the team can tell you what the work is really like, and often refer.",
      evidence: findEvidence(description, /\b(join|our|the)\s+(design|product|research)?\s*team\b|\bteam of\b/i),
    })
  }

  // Product partner
  const productEvidence = findEvidence(description, /\bproduct manag|\bpartner(ing)? (closely )?with\b.*\bproduct\b|\bproduct,/i)
  targets.push({
    id: "product-partner",
    role: onTeam("Product Manager"),
    relationship: "partner",
    why: discipline === "research"
      ? "Researchers work closely with product managers, who often sit on the interview panel."
      : "Designers work day to day with product managers, who often sit on the interview panel.",
    evidence: productEvidence,
  })

  // Engineering partner, when the posting mentions working with engineering
  const engineeringEvidence = findEvidence(description, /\bengineer(s|ing)\b/i)
  if (engineeringEvidence) {
    targets.push({
      id: "engineering-partner",
      role: onTeam("Engineering Manager"),
      relationship: "partner",
      why: "The posting mentions working with engineering. Engineering leads frequently join design interviews.",
      evidence: engineeringEvidence,
    })
  }

  // Research partner, for design roles that mention research
  const researchEvidence = discipline !== "research" ? findEvidence(description, /\b(user |ux )?research(ers?)?\b/i) : undefined
  if (researchEvidence) {
    targets.push({
      id: "research-partner",
      role: onTeam("UX Researcher"),
      relationship: "partner",
      why: "The posting mentions research. Researchers know the team's users and priorities.",
      evidence: researchEvidence,
    })
  }

  // Recruiter
  targets.push({
    id: "recruiter",
    role: names.recruiter,
    relationship: "recruiter",
    why: `Design recruiters at ${job.company} manage the pipeline and can tell you where your application stands.`,
  })

  // Design leadership, unless the hiring manager suggestion already covers it
  if (level !== "director" && level !== "executive") {
    targets.push({
      id: "leadership",
      role: discipline === "research" ? "Head of Research" : "Head of Design",
      relationship: "leader",
      why: "Senior design leaders shape hiring priorities. Following their posts helps you speak to what the team values.",
    })
  }

  return { targets, team, generatedWith: "rules", generatedAt: new Date().toISOString() }
}

/** Keywords for a LinkedIn search: role plus company */
export function searchKeywords(company: string, target: NetworkingTarget) {
  return target.namedPerson ? `${target.namedPerson} ${company}` : `${target.role} ${company}`
}
