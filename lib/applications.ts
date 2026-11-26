export const applicationStatuses = [
  "Interested",
  "Applied",
  "Interviewing",
  "Take-home",
  "Offer",
  "Not moving forward",
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

export const interviewStages = [
  "recruiter",
  "hiring-manager",
  "team-technical-case",
  "final-executive",
] as const

export type InterviewStage = (typeof interviewStages)[number]

export function isInterviewStatus(status: ApplicationStatus) {
  return status === "Interviewing"
}

export type Application = {
  id: string
  company: string
  role: string
  initials: string
  logo?: string
  description?: string
  sourceUrl?: string
  status: ApplicationStatus
  interviewStage?: InterviewStage
  nextStep: string
  due: string
}

export type NewApplication = Omit<Application, "id" | "initials">

export const applications: Application[] = [
  {
    id: "seed-vercel",
    company: "Vercel",
    role: "Senior Product Designer",
    initials: "V",
    logo: "https://thesvg.org/icons/vercel/default.svg",
    status: "Interviewing",
    interviewStage: "hiring-manager",
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
    status: "Interviewing",
    interviewStage: "recruiter",
    nextStep: "Share availability",
    due: "Nov 27",
  },
]
