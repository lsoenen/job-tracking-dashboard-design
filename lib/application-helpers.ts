import type { ApplicationStatus } from "@/lib/applications"

export function applicationStatusClassName(status: ApplicationStatus) {
  if (status === "Recruiter screen") return "border-info/20 bg-info/5 text-info"
  if (status === "Interviewing") return "border-primary/20 bg-primary/5 text-primary"
  if (status === "Take-home") return "border-warning/20 bg-warning/5 text-warning"
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
