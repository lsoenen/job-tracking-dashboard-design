/** What's saved for a generated cover letter (application_materials, kind "cover-letter") */
export type GeneratedCoverLetter = {
  format: "docx"
  path: string
  fileName: string
  salutation: string
  /** The body paragraphs, separated by blank lines */
  text: string
  summary: string
  generatedAt: string
}
