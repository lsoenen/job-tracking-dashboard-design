import { applicationStatuses, type Application, type ApplicationStatus } from "@/lib/applications"

export function getTrackedApplications(applications: readonly Application[]) {
  return applications.filter((application) => application.status !== "Interested")
}

export function getApplicationStatusCounts(applications: readonly Application[]) {
  const counts = Object.fromEntries(
    applicationStatuses.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>

  for (const application of applications) {
    counts[application.status] += 1
  }

  return counts
}

export function applicationStatusClassName(status: ApplicationStatus) {
  if (status === "Applied") return "border-status-applied/60 bg-status-applied/25 text-status-applied-foreground"
  if (status === "Interviewing") return "border-status-interviewing/40 bg-status-interviewing/15 text-status-interviewing-foreground"
  if (status === "Take-home") return "border-status-take-home/40 bg-status-take-home/15 text-status-take-home-foreground"
  if (status === "Offer") return "border-status-offer/40 bg-status-offer/15 text-status-offer-foreground"
  if (status === "Not moving forward") return "border-status-rejected/35 bg-status-rejected/12 text-status-rejected-foreground"
  return "border-border bg-muted text-muted-foreground"
}

export function safeExternalUrl(value?: string) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}
