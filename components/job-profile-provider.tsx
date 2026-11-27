"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { profileFromRow, profileToRow, type ProfileRow } from "@/lib/data"
import type { JobProfile } from "@/lib/job-profile"
import { createClient } from "@/lib/supabase/client"

type JobProfileContextValue = {
  profile: JobProfile
  email: string
  /** Saves profile fields and, if given, uploads a new resume PDF. Returns an error message or null. */
  saveProfile: (profile: JobProfile, resumeFile?: File | null) => Promise<string | null>
  getResumeUrl: () => Promise<string | null>
}

const JobProfileContext = createContext<JobProfileContextValue | null>(null)

export function JobProfileProvider({
  children,
  userId,
  email,
  initialProfile,
}: {
  children: ReactNode
  userId: string
  email: string
  initialProfile: JobProfile
}) {
  const supabase = createClient()
  const [profile, setProfile] = useState(initialProfile)

  async function saveProfile(nextProfile: JobProfile, resumeFile?: File | null) {
    const update: Record<string, unknown> = profileToRow(nextProfile)

    if (resumeFile) {
      const path = `${userId}/resume.pdf`
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, resumeFile, { upsert: true, contentType: "application/pdf" })

      if (uploadError) {
        console.error("Resume upload failed:", uploadError.message)
        return "Your resume couldn't be uploaded. Please try again."
      }

      update.resume_path = path
      update.resume_name = resumeFile.name
      update.resume_size_bytes = resumeFile.size
      update.resume_updated_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", userId)
      .select(
        "full_name, headline, location, years_experience, skills, background, weekly_application_goal, resume_path, resume_name, resume_size_bytes, resume_updated_at",
      )
      .single()

    if (error) {
      console.error("Profile save failed:", error.message)
      return "Your profile couldn't be saved. Please try again."
    }

    setProfile(profileFromRow(data as ProfileRow))
    return null
  }

  async function getResumeUrl() {
    if (!profile.resume?.path) return null
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(profile.resume.path, 60)
    if (error) return null
    return data.signedUrl
  }

  return (
    <JobProfileContext.Provider value={{ profile, email, saveProfile, getResumeUrl }}>
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
