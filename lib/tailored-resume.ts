import type { TailorChange } from "@/lib/resume-docx"

/** What's saved for a tailored resume (application_materials, kind "resume") */
export type TailoredResume = {
  format: "docx"
  path: string
  fileName: string
  summary: string
  changes: TailorChange[]
  skipped: number
  generatedAt: string
}
