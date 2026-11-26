import type { Metadata } from "next"

import { InterviewsPage } from "@/components/interviews-page"

export const metadata: Metadata = {
  title: "Interview Prep | Pursuit",
  description: "Prepare for active job interviews with company-specific progress and focused interviewer practice.",
}

export default function InterviewsRoute() {
  return <InterviewsPage />
}
