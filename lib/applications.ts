export const applicationStatuses = [
  "Interested",
  "Applied",
  "Recruiter screen",
  "Interviewing",
  "Take-home",
  "Offer",
  "Not moving forward",
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

export type Application = {
  id: string
  company: string
  role: string
  initials: string
  logo?: string
  description?: string
  sourceUrl?: string
  status: ApplicationStatus
  nextStep: string
  due: string
}

export type NewApplication = Omit<Application, "id" | "initials" | "logo">

export const applications: Application[] = [
  {
    id: "seed-vercel",
    company: "Vercel",
    role: "Senior Product Designer",
    initials: "V",
    logo: "https://thesvg.org/icons/vercel/default.svg",
    status: "Interviewing",
    nextStep: "Hiring manager interview",
    due: "Tomorrow",
  },
  {
    id: "seed-figma",
    company: "Figma",
    role: "Product Designer, Growth",
    initials: "F",
    logo: "https://thesvg.org/icons/figma/default.svg",
    status: "Take-home",
    nextStep: "Submit design exercise",
    due: "Nov 30",
  },
  {
    id: "seed-linear",
    company: "Linear",
    role: "Product Designer",
    initials: "L",
    logo: "https://thesvg.org/icons/linear/default.svg",
    status: "Applied",
    nextStep: "Follow up with recruiter",
    due: "Dec 2",
  },
  {
    id: "seed-ramp",
    company: "Ramp",
    role: "Staff Product Designer",
    initials: "R",
    logo: "https://thesvg.org/icons/ramp/default.svg",
    status: "Recruiter screen",
    nextStep: "Share availability",
    due: "Nov 27",
  },
]
