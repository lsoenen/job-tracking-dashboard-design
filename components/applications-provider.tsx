"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { applications as initialApplications, type Application, type NewApplication } from "@/lib/applications"

type ApplicationsContextValue = {
  applications: Application[]
  addApplication: (application: NewApplication) => void
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

  return (
    <ApplicationsContext.Provider value={{ applications, addApplication }}>
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
