export type ResumeAttachment = {
  /** Storage path in the "resumes" bucket, if a file has been uploaded */
  path?: string
  name: string
  sizeBytes: number
  lastUpdated: string
  isPlaceholder: boolean
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
}
