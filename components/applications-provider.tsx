"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"

import type { Application, ApplicationStatus, InterviewStage, NewApplication, StatusEvent } from "@/lib/applications"
import { applicationColumns, applicationFromRow, applicationToRow, formatDueLabel, type ApplicationRow } from "@/lib/data"
import { createClient } from "@/lib/supabase/client"

type ApplicationsContextValue = {
  applications: Application[]
  statusEvents: StatusEvent[]
  interviewProgress: Record<string, string[]>
  addApplication: (application: NewApplication) => Promise<Application | null>
  /** Saves many applications at once (spreadsheet import). Returns how many were saved, or an error. */
  importApplications: (applications: NewApplication[]) => Promise<{ imported: number; error?: string }>
  /** Saves changes; resolves true on success (failures roll back and show a toast) */
  updateApplication: (applicationId: string, patch: Partial<NewApplication>) => Promise<boolean>
  deleteApplication: (applicationId: string) => Promise<boolean>
  updateApplicationAppliedDate: (applicationId: string, appliedDate: string | undefined) => void
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void
  updateInterviewStage: (applicationId: string, stage: InterviewStage) => void
  toggleInterviewQuestionPractice: (applicationId: string, personaSlug: string, questionId: string) => void
}

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null)

function reportError(action: string, error: { message: string }) {
  console.error(`${action} failed:`, error.message)
  toast.error(`Couldn't ${action}. Your change was undone — please try again.`)
}

export function ApplicationsProvider({
  children,
  initialApplications,
  initialStatusEvents,
  initialInterviewProgress,
}: {
  children: ReactNode
  initialApplications: Application[]
  initialStatusEvents: StatusEvent[]
  initialInterviewProgress: Record<string, string[]>
}) {
  const supabase = createClient()
  const [applications, setApplications] = useState(initialApplications)
  const [statusEvents, setStatusEvents] = useState(initialStatusEvents)
  const [interviewProgress, setInterviewProgress] = useState(initialInterviewProgress)
  const applicationsRef = useRef(applications)
  applicationsRef.current = applications

  /** Ask the server to find logos for applications that don't have one yet (runs in the background) */
  async function fillLogos(ids?: string[]) {
    for (let round = 0; round < 10; round += 1) {
      try {
        const response = await fetch("/api/company-logos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ids ? { ids } : {}),
        })
        if (!response.ok) return
        const { logos, remaining } = (await response.json()) as { logos: Record<string, string | null>; remaining: number }

        setApplications((current) =>
          current.map((application) =>
            application.id in logos
              ? { ...application, logo: logos[application.id] ?? undefined, logoPending: false }
              : application,
          ),
        )
        if (!remaining || Object.keys(logos).length === 0) return
      } catch {
        return
      }
    }
  }

  useEffect(() => {
    if (initialApplications.some((application) => application.logoPending)) void fillLogos()
    // Only on first load; new applications trigger their own lookup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function replaceApplication(applicationId: string, next: Application | ((current: Application) => Application)) {
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId ? (typeof next === "function" ? next(application) : next) : application,
      ),
    )
  }

  /** Apply a change locally right away, save it, and roll back if the save fails. */
  async function saveChanges(applicationId: string, patch: Partial<NewApplication>, action: string): Promise<boolean> {
    const previous = applicationsRef.current.find((application) => application.id === applicationId)
    if (!previous) return false

    // A new company or job link may mean a different logo: clear it and look it up again
    const companyChanged = patch.company !== undefined && patch.company.trim() !== previous.company
    const linkChanged = patch.sourceUrl !== undefined && (patch.sourceUrl || undefined) !== previous.sourceUrl
    if ((companyChanged || linkChanged) && patch.logo === undefined) patch = { ...patch, logo: "" }

    replaceApplication(applicationId, (current) => ({
      ...current,
      ...patch,
      ...("dueDate" in patch ? { due: formatDueLabel(patch.dueDate) } : {}),
    }))

    const { data, error } = await supabase
      .from("applications")
      .update(applicationToRow(patch))
      .eq("id", applicationId)
      .select(applicationColumns)
      .single()

    if (error) {
      replaceApplication(applicationId, previous)
      reportError(action, error)
      return false
    }

    const saved = applicationFromRow(data as ApplicationRow)
    replaceApplication(applicationId, saved)
    if (saved.logoPending) void fillLogos([applicationId])

    if (patch.status && patch.status !== previous.status) {
      setStatusEvents((current) => [
        ...current,
        { applicationId, fromStatus: previous.status, toStatus: patch.status!, changedAt: new Date().toISOString() },
      ])
    }
    return true
  }

  async function addApplication(application: NewApplication) {
    const toInsert: NewApplication = {
      ...application,
      interviewStage: application.interviewStage ?? (application.status === "Interviewing" ? "recruiter" : undefined),
    }

    const { data, error } = await supabase
      .from("applications")
      .insert(applicationToRow(toInsert))
      .select(applicationColumns)
      .single()

    if (error) {
      console.error("Add application failed:", error.message)
      toast.error("Couldn't save this application. Please try again.")
      return null
    }

    const created = applicationFromRow(data as ApplicationRow)
    setApplications((current) => [created, ...current])
    if (created.logoPending) void fillLogos([created.id])
    setStatusEvents((current) => [
      ...current,
      { applicationId: created.id, fromStatus: null, toStatus: created.status, changedAt: new Date().toISOString() },
    ])
    return created
  }

  async function importApplications(toImport: NewApplication[]) {
    const created: Application[] = []

    for (let index = 0; index < toImport.length; index += 200) {
      const rows = toImport.slice(index, index + 200).map((application) =>
        applicationToRow({
          ...application,
          interviewStage: application.interviewStage ?? (application.status === "Interviewing" ? "recruiter" : undefined),
        }),
      )
      const { data, error } = await supabase.from("applications").insert(rows).select(applicationColumns)

      if (error) {
        console.error("Import failed:", error.message)
        if (created.length > 0) addCreated(created)
        return {
          imported: created.length,
          error: created.length > 0 ? `Saved ${created.length}, then hit an error. Please try importing the rest again.` : "The import couldn't be saved. Please try again.",
        }
      }

      created.push(...((data ?? []) as ApplicationRow[]).map(applicationFromRow))
    }

    addCreated(created)
    const needLogos = created.filter((application) => application.logoPending).map((application) => application.id)
    if (needLogos.length > 0) void fillLogos(needLogos)
    return { imported: created.length }
  }

  function addCreated(created: Application[]) {
    const now = new Date().toISOString()
    setApplications((current) => [...created, ...current])
    setStatusEvents((current) => [
      ...current,
      ...created.map((application) => ({ applicationId: application.id, fromStatus: null, toStatus: application.status, changedAt: now })),
    ])
  }

  function updateApplication(applicationId: string, patch: Partial<NewApplication>) {
    return saveChanges(applicationId, patch, "update this application")
  }

  async function deleteApplication(applicationId: string) {
    const previous = applicationsRef.current
    setApplications((current) => current.filter((application) => application.id !== applicationId))

    const { error } = await supabase.from("applications").delete().eq("id", applicationId)
    if (error) {
      setApplications(previous)
      reportError("delete this application", error)
      return false
    }

    setStatusEvents((current) => current.filter((event) => event.applicationId !== applicationId))
    return true
  }

  function updateApplicationAppliedDate(applicationId: string, appliedDate: string | undefined) {
    void saveChanges(applicationId, { appliedDate: appliedDate ?? "" }, "update the applied date")
  }

  function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const previous = applicationsRef.current.find((application) => application.id === applicationId)
    if (!previous || previous.status === status) return

    const patch: Partial<NewApplication> = { status }
    if (status === "Interviewing" && previous.status !== "Interviewing") patch.interviewStage = "recruiter"
    // Record the applied date automatically the first time something is marked Applied
    if (status === "Applied" && !previous.appliedDate) patch.appliedDate = new Date().toISOString().slice(0, 10)

    void saveChanges(applicationId, patch, "update the status")
  }

  function updateInterviewStage(applicationId: string, stage: InterviewStage) {
    const application = applicationsRef.current.find((item) => item.id === applicationId)
    if (!application || application.status !== "Interviewing") return
    void saveChanges(applicationId, { interviewStage: stage }, "update the interview stage")
  }

  async function toggleInterviewQuestionPractice(applicationId: string, personaSlug: string, questionId: string) {
    const progressKey = `${applicationId}:${personaSlug}`
    const wasPracticed = (interviewProgress[progressKey] ?? []).includes(questionId)

    const apply = (practiced: boolean) =>
      setInterviewProgress((current) => {
        const questions = current[progressKey] ?? []
        const next = practiced
          ? [...questions.filter((id) => id !== questionId), questionId]
          : questions.filter((id) => id !== questionId)
        return { ...current, [progressKey]: next }
      })

    apply(!wasPracticed)

    const { error } = wasPracticed
      ? await supabase
          .from("interview_practice")
          .delete()
          .match({ application_id: applicationId, persona_slug: personaSlug, question_id: questionId })
      : await supabase
          .from("interview_practice")
          .upsert(
            { application_id: applicationId, persona_slug: personaSlug, question_id: questionId },
            { onConflict: "user_id,application_id,persona_slug,question_id", ignoreDuplicates: true },
          )

    if (error) {
      apply(wasPracticed)
      reportError("save your practice progress", error)
    }
  }

  return (
    <ApplicationsContext.Provider
      value={{
        applications,
        statusEvents,
        interviewProgress,
        addApplication,
        importApplications,
        updateApplication,
        deleteApplication,
        updateApplicationAppliedDate,
        updateApplicationStatus,
        updateInterviewStage,
        toggleInterviewQuestionPractice,
      }}
    >
      {children}
    </ApplicationsContext.Provider>
  )
}

export function useApplications() {
  const context = useContext(ApplicationsContext)

  if (!context) {
    throw new Error("useApplications must be used within ApplicationsProvider")
  }

  return context
}
