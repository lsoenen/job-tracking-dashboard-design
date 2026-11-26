"use client"

import { useState, type FormEvent } from "react"
import { Save } from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { JobProfileForm } from "@/components/job-profile-form"
import { ResumeUploadCard } from "@/components/resume-upload-card"
import { Button } from "@/components/ui/button"
import { useJobProfile } from "@/components/job-profile-provider"
import type { JobProfile } from "@/lib/job-profile"

const maximumResumeSize = 10 * 1024 * 1024

export function AccountPage() {
  const { profile, saveProfile } = useJobProfile()
  const [draft, setDraft] = useState(profile)
  const [resumeError, setResumeError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  function updateDraft(patch: Partial<JobProfile>) {
    setDraft((current) => ({ ...current, ...patch }))
    setSaveMessage("")
  }

  function handleResumeSelect(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

    if (!isPdf) {
      setResumeError("Choose a PDF file to use as your resume.")
      setSaveMessage("")
      return
    }

    if (file.size > maximumResumeSize) {
      setResumeError("Choose a PDF smaller than 10 MB.")
      setSaveMessage("")
      return
    }

    const updatedAt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(file.lastModified ? new Date(file.lastModified) : new Date())

    setResumeError("")
    updateDraft({
      resume: {
        name: file.name,
        sizeBytes: file.size,
        lastUpdated: updatedAt,
        isPlaceholder: false,
      },
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveProfile(draft)
    setSaveMessage("Profile saved for this preview session. Recommended role scores will use these details.")
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="account" />
      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <header className="mb-7">
          <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">Account</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add a few details about your experience to personalize your recommended roles.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Changes in this demo are kept for the current preview session.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
            <JobProfileForm profile={draft} onChange={updateDraft} />
            <ResumeUploadCard resume={draft.resume} error={resumeError} onFileSelected={handleResumeSelect} />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
              {saveMessage}
            </div>
            <Button type="submit">
              <Save data-icon="inline-start" aria-hidden="true" />
              Save profile
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
