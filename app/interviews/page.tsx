import type { Metadata } from "next"

import { InterviewsPage } from "@/components/interviews-page"

export const metadata: Metadata = {
  title: "Interview Prep | Pursuit",
  description: "Organize active job interviews by stage and prepare for upcoming conversations.",
}

export default function InterviewsRoute() {
  return <InterviewsPage />
}
