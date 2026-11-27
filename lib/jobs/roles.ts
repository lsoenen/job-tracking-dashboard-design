// Role families decide which postings get stored and which users see them.
// To support a new kind of role later, add a family here: no other code changes needed.
export type RoleFamily = {
  id: string
  label: string
  /** Titles matching these are always kept (unless they are recruiting roles) */
  strong: RegExp[]
  /** Otherwise a job title must match one of these… */
  include: RegExp[]
  /** …and none of these */
  exclude: RegExp[]
  /** A user's headline that matches this is shown this family */
  headline: RegExp
  /** Skills/tools to look for in descriptions (used for fit scores) */
  vocabulary: string[]
}

export const roleFamilies: RoleFamily[] = [
  {
    id: "product-design",
    label: "Product & UX design",
    strong: [/\bproduct design(er|ers)?\b/i, /\bux design(er)?\b/i],
    include: [
      /\b(product|ux|ui|interaction|experience|visual|content|service|mobile|web)\s*(\/\s*\w+\s*)?design(er|ers)?\b/i,
      /\bproduct designer\b/i,
      /\b(ux|ui\/ux|user experience)\b/i,
      /\bdesign systems?\b/i,
      /\b(head|director|vp|manager|lead|leader)\b.*\bdesign\b/i,
      /\bdesigner\b/i,
      /\bdesign (lead|leader|manager|director)\b/i,
      /\b(user|ux|design|experience) research(er)?\b/i,
    ],
    exclude: [
      /\b(learning|instructional|advocate)\b/i,
      /\bengineer(ing)?\b/i,
      /\b(sales|account|compensation|policy|organi[sz]ational|construction|program manager|project manager|people partner|administrative|support)\b/i,
      /\b(brand|motion|graphic|presentation|production|marketing|creative studio|illustrat|animator|3d|industrial|interior|bim)\b/i,
      /\b(chip|mechanical|electrical|data center|rtl|physical design|molecul|antibody)\b/i,
    ],
    headline: /\b(design(er)?|ux|ui|user experience|interaction|researcher)\b/i,
    vocabulary: [
      "Figma", "Sketch", "Framer", "Prototyping", "Prototype", "Wireframing", "User research", "Usability testing",
      "Interaction design", "Visual design", "Design systems", "Information architecture", "Accessibility", "WCAG",
      "Mobile design", "iOS", "Android", "Responsive", "Product strategy", "Journey mapping", "Service design",
      "Content design", "UX writing", "Data visualization", "Dashboards", "Motion", "Animation", "HTML", "CSS",
      "React", "SwiftUI", "A/B testing", "Experimentation", "Analytics", "Growth", "Onboarding", "B2B", "SaaS",
      "Enterprise", "Consumer", "Fintech", "Payments", "E-commerce", "Marketplace", "AI", "Machine learning",
      "LLM", "Developer tools", "Workshops", "Storytelling", "Cross-functional", "Mentorship", "Design critique",
      "Zero to one", "0 to 1", "End-to-end", "Craft", "Portfolio", "Personas", "Qualitative", "Quantitative",
    ],
  },
]

export function classifyTitle(title: string): RoleFamily | undefined {
  if (/recruit/i.test(title)) return undefined

  return roleFamilies.find(
    (family) =>
      family.strong.some((pattern) => pattern.test(title)) ||
      (family.include.some((pattern) => pattern.test(title)) && !family.exclude.some((pattern) => pattern.test(title))),
  )
}

/** Families relevant to someone's headline. Empty if nothing matches. */
export function familiesForHeadline(headline: string) {
  return roleFamilies.filter((family) => family.headline.test(headline))
}

/** Rough minimum years of experience implied by a title */
export function minimumYearsFromTitle(title: string) {
  const value = title.toLowerCase()
  if (/\b(intern|internship|new grad|graduate|apprentice|junior|associate)\b/.test(value)) return 0
  if (/\b(head|director|vp|vice president)\b/.test(value)) return 10
  if (/\b(principal|staff)\b/.test(value)) return 8
  if (/\b(lead|manager)\b/.test(value)) return 7
  if (/\b(senior|sr\.?)\b/.test(value)) return 5
  if (/\b(ii|2)\b/.test(value)) return 2
  return 3
}
