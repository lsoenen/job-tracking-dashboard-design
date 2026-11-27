export type ResumeAttachment = {
  /** Storage path in the "resumes" bucket, if a file has been uploaded */
  path?: string
  name: string
  sizeBytes: number
  lastUpdated: string
  isPlaceholder: boolean
}

/** Up to two initials from a name or email, for avatars without a photo */
export function profileInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export type JobProfile = {
  fullName: string
  headline: string
  location: string
  yearsExperience: number
  skills: string
  background: string
  weeklyApplicationGoal: number
  resume: ResumeAttachment | null
  /** A sample cover letter (.docx) whose voice and design generated letters follow */
  coverLetter: ResumeAttachment | null
}
