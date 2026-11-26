"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { initialJobProfile, type JobProfile } from "@/lib/job-profile"

type JobProfileContextValue = {
  profile: JobProfile
  saveProfile: (profile: JobProfile) => void
}

const JobProfileContext = createContext<JobProfileContextValue | null>(null)

export function JobProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(initialJobProfile)

  return (
    <JobProfileContext.Provider value={{ profile, saveProfile: setProfile }}>
      {children}
    </JobProfileContext.Provider>
  )
}

export function useJobProfile() {
  const context = useContext(JobProfileContext)

  if (!context) {
    throw new Error("useJobProfile must be used within JobProfileProvider")
  }

  return context
}
