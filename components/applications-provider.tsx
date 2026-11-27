"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { applications as initialApplications, type Application, type ApplicationStatus, type InterviewStage, type NewApplication } from "@/lib/applications"

type ApplicationsContextValue = {
  applications: Application[]
  interviewProgress: Record<string, string[]>
  addApplication: (application: NewApplication) => void
  updateApplicationAppliedDate: (applicationId: string, appliedDate: string | undefined) => void
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void
  updateInterviewStage: (applicationId: string, stage: InterviewStage) => void
  toggleInterviewQuestionPractice: (applicationId: string, personaSlug: string, questionId: string) => void
}

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null)

function companyInitials(company: string) {
  return company
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState(initialApplications)
  const [interviewProgress, setInterviewProgress] = useState<Record<string, string[]>>({})

  function addApplication(application: NewApplication) {
    setApplications((current) => [
      {
        ...application,
        id: crypto.randomUUID(),
        initials: companyInitials(application.company),
        interviewStage: application.interviewStage ?? (application.status === "Interviewing" ? "recruiter" : undefined),
      },
      ...current,
    ])
  }

  function updateApplicationAppliedDate(applicationId: string, appliedDate: string | undefined) {
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId ? { ...application, appliedDate } : application,
      ),
    )
  }

  function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    setApplications((current) =>
      current.map((application) => {
        if (application.id !== applicationId) return application

        return {
          ...application,
          status,
          ...(status === "Interviewing" && application.status !== "Interviewing"
            ? { interviewStage: "recruiter" as const }
            : {}),
        }
      }),
    )
  }

  function updateInterviewStage(applicationId: string, stage: InterviewStage) {
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId && application.status === "Interviewing"
          ? { ...application, interviewStage: stage }
          : application,
      ),
    )
  }

  function toggleInterviewQuestionPractice(applicationId: string, personaSlug: string, questionId: string) {
    const progressKey = `${applicationId}:${personaSlug}`

    setInterviewProgress((current) => {
      const practicedQuestions = current[progressKey] ?? []
      const nextQuestions = practicedQuestions.includes(questionId)
        ? practicedQuestions.filter((id) => id !== questionId)
        : [...practicedQuestions, questionId]

      return { ...current, [progressKey]: nextQuestions }
    })
  }

  return (
    <ApplicationsContext.Provider
      value={{
        applications,
        interviewProgress,
        addApplication,
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
