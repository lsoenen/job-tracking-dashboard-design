import type { Metadata } from "next"

import { ApplicationsPage } from "@/components/applications-page"

export const metadata: Metadata = {
  title: "Applications | Pursuit",
  description: "Review all active job applications, their stages, and upcoming next steps.",
}

export default function ApplicationsRoute() {
  return <ApplicationsPage />
}
