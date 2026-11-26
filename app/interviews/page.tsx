import type { Metadata } from "next"

import { InterviewsPage } from "@/components/interviews-page"

export const metadata: Metadata = {
  title: "Interview | Pursuit",
  description: "Prepare for upcoming job interviews with stage-based buckets and interviewer-specific practice questions.",
}

export default function InterviewsRoute() {
  return <InterviewsPage />
}
