"use client"

import { useState, type FormEvent } from "react"
import { LoaderCircle, LogOut, Save } from "lucide-react"

import { signOut } from "@/app/auth/actions"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { JobProfileForm } from "@/components/job-profile-form"
import { ProfilePhotoCard } from "@/components/profile-photo-card"
import { ResumeUploadCard } from "@/components/resume-upload-card"
import { Button } from "@/components/ui/button"
import { useJobProfile } from "@/components/job-profile-provider"
import type { JobProfile } from "@/lib/job-profile"

const maximumResumeSize = 10 * 1024 * 1024

export function AccountPage() {
  const { profile, email, saveProfile, getResumeUrl } = useJobProfile()
  const [draft, setDraft] = useState(profile)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [resumeError, setResumeError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  function updateDraft(patch: Partial<JobProfile>) {
    setDraft((current) => ({ ...current, ...patch }))
    setSaveMessage("")
  }

  function handleResumeSelect(file: File) {
    // Word only: tailoring edits the document itself, which isn't possible with PDFs
    const isWord =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx")

    if (!isWord) {
      setResumeError(
        file.name.toLowerCase().endsWith(".doc")
          ? "Older .doc files aren't supported. In Word, use File → Save As → Word Document (.docx)."
          : "Choose a Word file (.docx). From Google Docs: File → Download → Microsoft Word.",
      )
      setSaveMessage("")
      return
    }

    if (file.size > maximumResumeSize) {
      setResumeError("Choose a Word file smaller than 10 MB.")
      setSaveMessage("")
      return
    }

    const updatedAt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date())

    setResumeError("")
    setResumeFile(file)
    updateDraft({
      resume: {
        name: file.name,
        sizeBytes: file.size,
        lastUpdated: updatedAt,
        isPlaceholder: false,
      },
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setSaveMessage("")
    const error = await saveProfile(draft, resumeFile)
    setIsSaving(false)

    if (error) {
      setSaveMessage(error)
      return
    }

    setResumeFile(null)
    setSaveMessage("Profile saved. Recommended role scores will use these details.")
  }

  async function openResume() {
    const url = await getResumeUrl()
    if (url) window.open(url, "_blank", "noopener,noreferrer")
    else setResumeError("Couldn't open your resume. Please try again.")
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
          <p className="mt-1 text-xs text-muted-foreground">Signed in as {email}</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
            <JobProfileForm profile={draft} onChange={updateDraft} />
            <div className="flex flex-col gap-4">
              <ProfilePhotoCard />
              <ResumeUploadCard
                resume={draft.resume}
                isPendingUpload={Boolean(resumeFile)}
                error={resumeError}
                onFileSelected={handleResumeSelect}
                onOpen={profile.resume?.path && !resumeFile ? openResume : undefined}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
              {saveMessage}
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
              ) : (
                <Save data-icon="inline-start" aria-hidden="true" />
              )}
              Save profile
            </Button>
          </div>
        </form>

        <form action={signOut} className="mt-10 border-t border-border pt-6">
          <Button type="submit" variant="outline">
            <LogOut data-icon="inline-start" aria-hidden="true" />
            Log out
          </Button>
        </form>
      </main>
    </div>
  )
}
