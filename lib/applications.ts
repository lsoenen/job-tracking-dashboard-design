export const applicationStatuses = [
  "Interested",
  "Applied",
  "Interviewing",
  "Take-home",
  "Offer",
  "Not moving forward",
] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

/**
 * What each status is called on screen. "Applied" is still the stored value
 * (so existing data and spreadsheet imports keep working), shown as "Awaiting response".
 */
export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  Interested: "Interested",
  Applied: "Awaiting response",
  Interviewing: "Interviewing",
  "Take-home": "Take-home",
  Offer: "Offer",
  "Not moving forward": "Not moving forward",
}

export function statusLabel(status: ApplicationStatus) {
  return applicationStatusLabels[status] ?? status
}

export const interviewStages = [
  "recruiter",
  "hiring-manager",
  "team-technical-case",
  "final-executive",
] as const

export type InterviewStage = (typeof interviewStages)[number]

/** Options for "How far did it get?" on a rejected application */
export const furthestStageLabels: Record<InterviewStage | "none", string> = {
  none: "Before an interview",
  recruiter: "Recruiter screen",
  "hiring-manager": "Hiring manager",
  "team-technical-case": "Team, technical, case, or take-home",
  "final-executive": "Final or executive round",
}

export function isInterviewStatus(status: ApplicationStatus) {
  return status === "Interviewing"
}

export type Application = {
  id: string
  company: string
  role: string
  initials: string
  logo?: string
  /** True until the app has tried to find this company's logo */
  logoPending?: boolean
  description?: string
  sourceUrl?: string
  companyUrl?: string
  canvasJobId?: string
  status: ApplicationStatus
  appliedDate?: string
  interviewStage?: InterviewStage
  nextStep: string
  /** ISO date (yyyy-MM-dd) the next step is due */
  dueDate?: string
  /** Display label derived from dueDate, e.g. "Nov 30" or "—" */
  due: string
}

export type NewApplication = Omit<Application, "id" | "initials" | "due" | "logoPending">

export type StatusEvent = {
  applicationId: string
  fromStatus: ApplicationStatus | null
  toStatus: ApplicationStatus
  changedAt: string
}
