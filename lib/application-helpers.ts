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
  if (status === "Interviewing") return "border-primary/20 bg-primary/5 text-primary"
  if (status === "Applied") return "border-warning/25 bg-warning/10 text-warning"
  if (status === "Take-home") return "border-info/20 bg-info/5 text-info"
  if (status === "Offer") return "border-success/20 bg-success/5 text-success"
  if (status === "Not moving forward") return "border-destructive/20 bg-destructive/5 text-destructive"
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
