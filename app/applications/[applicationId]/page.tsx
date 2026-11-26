import type { Metadata } from "next"

import { ApplicationDetailsPage } from "@/components/application-details-page"

export const metadata: Metadata = {
  title: "Application details | Pursuit",
  description: "Review the full details and next steps for a job application.",
}

export default async function ApplicationDetailsRoute({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params

  return <ApplicationDetailsPage applicationId={applicationId} />
}
