import type { SupabaseClient } from "@supabase/supabase-js"

import type { Application, ApplicationStatus, InterviewStage, NewApplication, StatusEvent } from "@/lib/applications"
import type { JobProfile } from "@/lib/job-profile"

// ---------------------------------------------------------------------------
// Database row shapes (snake_case, as stored in Supabase)
// ---------------------------------------------------------------------------
export type ApplicationRow = {
  id: string
  company: string
  role: string
  logo: string | null
  description: string | null
  source_url: string | null
  company_url: string | null
  canvas_job_id: string | null
  status: ApplicationStatus
  interview_stage: InterviewStage | null
  applied_date: string | null
  next_step: string
  due_date: string | null
}

export type ProfileRow = {
  full_name: string
  headline: string
  location: string
  years_experience: number
  skills: string
  background: string
  weekly_application_goal: number
  resume_path: string | null
  resume_name: string | null
  resume_size_bytes: number | null
  resume_updated_at: string | null
}

type StatusEventRow = {
  application_id: string
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus
  changed_at: string
}

/** Stored in applications.logo when no logo could be found, so it isn't looked up again */
export const NO_LOGO = "none"

export const applicationColumns =
  "id, company, role, logo, description, source_url, company_url, canvas_job_id, status, interview_stage, applied_date, next_step, due_date"

export const profileColumns =
  "full_name, headline, location, years_experience, skills, background, weekly_application_goal, resume_path, resume_name, resume_size_bytes, resume_updated_at"

/** Profile photos live in the private "avatars" bucket; links to them expire after this many seconds */
export const avatarLinkLifetime = 60 * 60 * 24

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------
export function companyInitials(company: string) {
  return company
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

export function formatDueLabel(dueDate?: string | null) {
  if (!dueDate) return "—"
  const date = new Date(`${dueDate}T12:00:00`)
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
}

export function applicationFromRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    initials: companyInitials(row.company),
    logo: row.logo && row.logo !== NO_LOGO ? row.logo : undefined,
    logoPending: row.logo === null,
    description: row.description ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    companyUrl: row.company_url ?? undefined,
    canvasJobId: row.canvas_job_id ?? undefined,
    status: row.status,
    interviewStage: row.interview_stage ?? undefined,
    appliedDate: row.applied_date ?? undefined,
    nextStep: row.next_step || "—",
    dueDate: row.due_date ?? undefined,
    due: formatDueLabel(row.due_date),
  }
}

export function applicationToRow(application: Partial<NewApplication>) {
  const row: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value !== undefined) row[key] = value === "" ? null : value
  }

  set("company", application.company?.trim())
  set("role", application.role?.trim())
  set("logo", application.logo)
  set("description", application.description)
  set("source_url", application.sourceUrl)
  set("company_url", application.companyUrl)
  set("canvas_job_id", application.canvasJobId)
  set("status", application.status)
  set("interview_stage", application.interviewStage)
  set("applied_date", application.appliedDate)
  set("due_date", application.dueDate)
  if (application.nextStep !== undefined) {
    row.next_step = application.nextStep === "—" ? "" : application.nextStep.trim()
  }

  return row
}

export function profileFromRow(row: ProfileRow | null): JobProfile {
  return {
    fullName: row?.full_name ?? "",
    headline: row?.headline ?? "",
    location: row?.location ?? "",
    yearsExperience: row?.years_experience ?? 0,
    skills: row?.skills ?? "",
    background: row?.background ?? "",
    weeklyApplicationGoal: row?.weekly_application_goal ?? 5,
    resume:
      row?.resume_path && row.resume_name
        ? {
            path: row.resume_path,
            name: row.resume_name,
            sizeBytes: row.resume_size_bytes ?? 0,
            lastUpdated: row.resume_updated_at
              ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
                  new Date(row.resume_updated_at),
                )
              : "",
            isPlaceholder: false,
          }
        : null,
  }
}

export function profileToRow(profile: JobProfile) {
  return {
    full_name: profile.fullName.trim(),
    headline: profile.headline.trim(),
    location: profile.location.trim(),
    years_experience: Math.max(0, Math.min(80, Math.round(profile.yearsExperience || 0))),
    skills: profile.skills.trim(),
    background: profile.background.trim(),
    weekly_application_goal: Math.max(0, Math.min(100, Math.round(profile.weeklyApplicationGoal || 0))),
  }
}

function statusEventFromRow(row: StatusEventRow): StatusEvent {
  return {
    applicationId: row.application_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedAt: row.changed_at,
  }
}

// ---------------------------------------------------------------------------
// Initial load for the signed-in user (runs on the server in app/layout.tsx)
// ---------------------------------------------------------------------------
export type UserData = {
  userId: string
  email: string
  profile: JobProfile
  /** The profile photo, with a temporary link for showing it */
  avatar: { path: string; url: string | null } | null
  applications: Application[]
  statusEvents: StatusEvent[]
  interviewProgress: Record<string, string[]>
}

export async function loadUserData(supabase: SupabaseClient): Promise<UserData | null> {
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims?.sub) return null

  const [profileResult, applicationsResult, eventsResult, practiceResult, avatarResult] = await Promise.all([
    supabase.from("profiles").select(profileColumns).eq("id", claims.sub).maybeSingle(),
    supabase.from("applications").select(applicationColumns).order("created_at", { ascending: false }),
    supabase
      .from("application_status_events")
      .select("application_id, from_status, to_status, changed_at")
      .order("changed_at", { ascending: true })
      .limit(10000),
    supabase.from("interview_practice").select("application_id, persona_slug, question_id"),
    // Kept apart from the profile query so the app still works before the profile photo migration has run
    supabase.from("profiles").select("avatar_path").eq("id", claims.sub).maybeSingle(),
  ])

  for (const result of [profileResult, applicationsResult, eventsResult, practiceResult]) {
    if (result.error) console.error("Failed to load user data:", result.error.message)
  }

  const avatarPath = (avatarResult.data as { avatar_path: string | null } | null)?.avatar_path ?? null
  let avatar: UserData["avatar"] = null
  if (avatarPath) {
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(avatarPath, avatarLinkLifetime)
    avatar = { path: avatarPath, url: signed?.signedUrl ?? null }
  }

  const interviewProgress: Record<string, string[]> = {}
  for (const row of (practiceResult.data ?? []) as { application_id: string; persona_slug: string; question_id: string }[]) {
    const key = `${row.application_id}:${row.persona_slug}`
    ;(interviewProgress[key] ??= []).push(row.question_id)
  }

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    profile: profileFromRow(profileResult.data as ProfileRow | null),
    avatar,
    applications: ((applicationsResult.data ?? []) as ApplicationRow[]).map(applicationFromRow),
    statusEvents: ((eventsResult.data ?? []) as StatusEventRow[]).map(statusEventFromRow),
    interviewProgress,
  }
}
