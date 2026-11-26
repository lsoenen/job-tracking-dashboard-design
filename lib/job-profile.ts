export type ResumeAttachment = {
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
  resume: ResumeAttachment
}

export const initialJobProfile: JobProfile = {
  fullName: "Alex Taylor",
  headline: "Product designer",
  location: "Brooklyn, NY",
  yearsExperience: 6,
  skills:
    "Product strategy, User research, Interaction design, Figma, Design systems, Prototyping, Mobile design, Accessibility",
  background:
    "Product designer with 6 years of experience building thoughtful mobile and web products, from discovery through launch. Strong in research, prototyping, cross-functional collaboration, and simplifying complex workflows.",
  resume: {
    name: "Alex_Taylor_Resume.pdf",
    sizeBytes: 248 * 1024,
    lastUpdated: "Nov 20, 2026",
    isPlaceholder: true,
  },
}
