import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { InterviewPrepPage } from "@/components/interview-prep-page"
import { getInterviewPersona } from "@/lib/interview-prep"

type InterviewPersonaRouteProps = {
  params: Promise<{ persona: string }>
  searchParams: Promise<{ applicationId?: string }>
}

export async function generateMetadata({ params }: InterviewPersonaRouteProps): Promise<Metadata> {
  const { persona: personaSlug } = await params
  const persona = getInterviewPersona(personaSlug)

  if (!persona) {
    return { title: "Interview Practice | Pursuit" }
  }

  return {
    title: `${persona.title} | Pursuit`,
    description: `Practice common ${persona.label.toLowerCase()} interview questions. ${persona.focus}`,
  }
}

export default async function InterviewPersonaRoute({ params, searchParams }: InterviewPersonaRouteProps) {
  const [{ persona: personaSlug }, { applicationId }] = await Promise.all([params, searchParams])
  const persona = getInterviewPersona(personaSlug)

  if (!persona) notFound()

  return <InterviewPrepPage key={`${persona.slug}-${applicationId ?? "general"}`} personaSlug={persona.slug} applicationId={applicationId} />
}
