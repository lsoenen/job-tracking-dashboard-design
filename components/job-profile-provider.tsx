"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { squareProfilePhoto } from "@/lib/avatar-image"
import { avatarLinkLifetime, profileColumns, profileFromRow, profileToRow, type ProfileRow, type UserData } from "@/lib/data"
import type { JobProfile } from "@/lib/job-profile"
import { createClient } from "@/lib/supabase/client"

type JobProfileContextValue = {
  profile: JobProfile
  email: string
  /** Temporary link to the profile photo, or null when there isn't one */
  avatarUrl: string | null
  /** Saves profile fields and, if given, uploads a new resume PDF. Returns an error message or null. */
  saveProfile: (profile: JobProfile, resumeFile?: File | null) => Promise<string | null>
  getResumeUrl: () => Promise<string | null>
  /** Crops, shrinks and saves a new profile photo right away. Returns an error message or null. */
  uploadAvatar: (file: File) => Promise<string | null>
  /** Removes the profile photo. Returns an error message or null. */
  removeAvatar: () => Promise<string | null>
}

const JobProfileContext = createContext<JobProfileContextValue | null>(null)

export function JobProfileProvider({
  children,
  userId,
  email,
  initialProfile,
  initialAvatar,
}: {
  children: ReactNode
  userId: string
  email: string
  initialProfile: JobProfile
  initialAvatar: UserData["avatar"]
}) {
  const supabase = createClient()
  const [profile, setProfile] = useState(initialProfile)
  const [avatar, setAvatar] = useState(initialAvatar)

  async function uploadAvatar(file: File) {
    let photo: Blob
    try {
      photo = await squareProfilePhoto(file)
    } catch {
      return "That photo couldn't be read. Try a JPG, PNG or WebP image."
    }

    // A new file name each time, so browsers never show the old photo from cache
    const path = `${userId}/avatar-${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, photo, { contentType: "image/jpeg" })
    if (uploadError) {
      console.error("Photo upload failed:", uploadError.message)
      return "Your photo couldn't be uploaded. Please try again."
    }

    const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId)
    if (error) {
      console.error("Photo save failed:", error.message)
      await supabase.storage.from("avatars").remove([path])
      return "Your photo couldn't be saved. Please try again."
    }

    if (avatar?.path) await supabase.storage.from("avatars").remove([avatar.path])
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, avatarLinkLifetime)
    setAvatar({ path, url: signed?.signedUrl ?? null })
    return null
  }

  async function removeAvatar() {
    if (!avatar) return null
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", userId)
    if (error) {
      console.error("Photo removal failed:", error.message)
      return "Your photo couldn't be removed. Please try again."
    }
    await supabase.storage.from("avatars").remove([avatar.path])
    setAvatar(null)
    return null
  }

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
      .select(profileColumns)
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
    <JobProfileContext.Provider
      value={{ profile, email, avatarUrl: avatar?.url ?? null, saveProfile, getResumeUrl, uploadAvatar, removeAvatar }}
    >
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
