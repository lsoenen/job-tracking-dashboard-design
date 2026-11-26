"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { applications as initialApplications, type Application, type ApplicationStatus, type NewApplication } from "@/lib/applications"

type ApplicationsContextValue = {
  applications: Application[]
  interviewProgress: Record<string, string[]>
  addApplication: (application: NewApplication) => void
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void
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
      },
      ...current,
    ])
  }

  function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId ? { ...application, status } : application,
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
        updateApplicationStatus,
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
