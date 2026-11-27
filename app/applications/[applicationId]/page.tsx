import type { Metadata } from "next"

import { ApplicationDetailsPage } from "@/components/application-details-page"

export const metadata: Metadata = {
  title: "Position workspace | Pursuit",
  description: "Prepare tailored application materials and interview questions for this role.",
}

export default async function ApplicationDetailsRoute({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params

  return <ApplicationDetailsPage applicationId={applicationId} />
}
