import { addDays, differenceInCalendarDays, format, isWithinInterval, parseISO, startOfDay, startOfWeek, subWeeks } from "date-fns"

import type { Application, ApplicationStatus, StatusEvent } from "@/lib/applications"

/** A status that means the company got back to you (any outcome, including a rejection). */
const responseStatuses = new Set<ApplicationStatus>(["Interviewing", "Take-home", "Offer", "Not moving forward"])

const weekOptions = { weekStartsOn: 1 } as const // Monday

function toDate(value: string) {
  // Plain dates (yyyy-MM-dd) are treated as local dates; timestamps keep their time zone.
  return value.length === 10 ? parseISO(value) : new Date(value)
}

/** When each application first got a response, based on its status history. */
export function getResponseDates(applications: readonly Application[], events: readonly StatusEvent[]) {
  const byId = new Map(applications.map((application) => [application.id, application]))
  const responses = new Map<string, Date>()

  for (const event of events) {
    if (responses.has(event.applicationId) || !responseStatuses.has(event.toStatus)) continue
    const application = byId.get(event.applicationId)
    if (!application) continue

    // Added straight into a response stage (e.g. back-filling an old application):
    // the applied date is the best estimate we have.
    const date = event.fromStatus === null && application.appliedDate ? toDate(application.appliedDate) : toDate(event.changedAt)
    responses.set(event.applicationId, date)
  }

  return responses
}

export type WeeklyActivity = { week: string; applications: number; responses: number }

export function getWeeklyActivity(
  applications: readonly Application[],
  events: readonly StatusEvent[],
  weeks = 4,
  now = new Date(),
): WeeklyActivity[] {
  const currentWeek = startOfWeek(now, weekOptions)
  const responseDates = [...getResponseDates(applications, events).values()]
  const appliedDates = applications.flatMap((application) => (application.appliedDate ? [toDate(application.appliedDate)] : []))

  return Array.from({ length: weeks }, (_, index) => {
    const start = subWeeks(currentWeek, weeks - 1 - index)
    const end = addDays(start, 7)
    const inWeek = (date: Date) => date >= start && date < end

    return {
      week: format(start, "MMM d"),
      applications: appliedDates.filter(inWeek).length,
      responses: responseDates.filter(inWeek).length,
    }
  })
}

export function getAppliedThisWeek(applications: readonly Application[], now = new Date()) {
  const interval = { start: startOfWeek(now, weekOptions), end: now }
  return applications.filter(
    (application) => application.appliedDate && isWithinInterval(toDate(application.appliedDate), interval),
  ).length
}

export type UpcomingStep = {
  application: Application
  dueLabel: string
  isOverdue: boolean
}

function dueLabel(dueDate: string | undefined, today: Date) {
  if (!dueDate) return { label: "No date set", isOverdue: false }

  const date = toDate(dueDate)
  const days = differenceInCalendarDays(date, today)

  if (days < 0) return { label: `Overdue · ${format(date, "MMM d")}`, isOverdue: true }
  if (days === 0) return { label: "Today", isOverdue: false }
  if (days === 1) return { label: "Tomorrow", isOverdue: false }
  return { label: format(date, "EEE, MMM d"), isOverdue: false }
}

/** Active applications that have a next step, soonest due first (undated last). */
export function getUpcomingSteps(applications: readonly Application[], now = new Date()) {
  const today = startOfDay(now)
  const steps = applications
    .filter(
      (application) =>
        application.status !== "Interested" &&
        application.status !== "Not moving forward" &&
        application.nextStep &&
        application.nextStep !== "—" &&
        application.nextStep !== "No next step set",
    )
    .sort((left, right) => {
      if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate)
      if (left.dueDate) return -1
      if (right.dueDate) return 1
      return 0
    })
    .map((application): UpcomingStep => {
      const { label, isOverdue } = dueLabel(application.dueDate, today)
      return { application, dueLabel: label, isOverdue }
    })

  const dueSoonCount = steps.filter(
    ({ application }) => application.dueDate && differenceInCalendarDays(toDate(application.dueDate), today) <= 7,
  ).length

  return { steps, dueSoonCount }
}

// ---------------------------------------------------------------------------
// Response and interview rates
// ---------------------------------------------------------------------------
export const dashboardRanges = [
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "all", label: "All time", days: null },
] as const

export type DashboardRange = (typeof dashboardRanges)[number]["id"]

/** Applications this new haven't had a fair chance to hear back, so rates leave them out */
export const responseWindowDays = 14

const interviewStatuses = new Set<ApplicationStatus>(["Interviewing", "Take-home", "Offer"])

export type ApplicationMetrics = {
  /** Sent applications (anything past Interested) applied within the range */
  sent: number
  active: number
  rejected: number
  offers: number
  interviewingNow: number
  /** Sent applications old enough to count toward rates */
  eligible: number
  tooRecent: number
  responded: number
  interviewed: number
  /** Of `interviewed`, how many were later rejected */
  rejectedAfterInterview: number
  /** Percentages of `eligible`, or null when nothing is old enough yet */
  responseRate: number | null
  interviewRate: number | null
}

export function getApplicationMetrics(
  applications: readonly Application[],
  events: readonly StatusEvent[],
  range: DashboardRange,
  now = new Date(),
): ApplicationMetrics {
  const today = startOfDay(now)
  const days = dashboardRanges.find((item) => item.id === range)?.days ?? null
  const rangeStart = days === null ? null : addDays(today, -days)

  // Applications that ever reached an interview stage, even if later rejected
  const everInterviewed = new Set(
    events.filter((event) => interviewStatuses.has(event.toStatus)).map((event) => event.applicationId),
  )

  const sent = applications.filter((application) => {
    if (application.status === "Interested") return false
    if (!rangeStart) return true
    // A time range needs an applied date to place the application in it
    return Boolean(application.appliedDate) && toDate(application.appliedDate!) >= rangeStart
  })

  const isTooRecent = (application: Application) =>
    Boolean(application.appliedDate) &&
    differenceInCalendarDays(today, toDate(application.appliedDate!)) < responseWindowDays

  const eligible = sent.filter((application) => !isTooRecent(application))
  const responded = eligible.filter((application) => application.status !== "Applied").length
  // Reached an interview: in an interview stage now, has one in its history, or was
  // rejected with a recorded interview round ("How far did it get?")
  const reachedInterview = (application: Application) =>
    interviewStatuses.has(application.status) ||
    everInterviewed.has(application.id) ||
    (application.status === "Not moving forward" && Boolean(application.interviewStage))
  const interviewedApplications = eligible.filter(reachedInterview)
  const interviewed = interviewedApplications.length
  const rejectedAfterInterview = interviewedApplications.filter(
    (application) => application.status === "Not moving forward",
  ).length
  const rejected = sent.filter((application) => application.status === "Not moving forward").length

  return {
    sent: sent.length,
    active: sent.length - rejected,
    rejected,
    offers: sent.filter((application) => application.status === "Offer").length,
    interviewingNow: sent.filter((application) => application.status === "Interviewing").length,
    eligible: eligible.length,
    tooRecent: sent.length - eligible.length,
    responded,
    interviewed,
    rejectedAfterInterview,
    responseRate: eligible.length === 0 ? null : (responded / eligible.length) * 100,
    interviewRate: eligible.length === 0 ? null : (interviewed / eligible.length) * 100,
  }
}
