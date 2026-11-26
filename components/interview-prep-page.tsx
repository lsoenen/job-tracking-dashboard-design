"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Lightbulb, MessageSquareText } from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useJobProfile } from "@/components/job-profile-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { getInterviewPersona, interviewPersonas } from "@/lib/interview-prep"

export function InterviewPrepPage({
  personaSlug,
  applicationId,
}: {
  personaSlug: string
  applicationId?: string
}) {
  const persona = getInterviewPersona(personaSlug)
  const { profile } = useJobProfile()
  const { applications, interviewProgress, toggleInterviewQuestionPractice } = useApplications()
  const application = applicationId ? applications.find((item) => item.id === applicationId) : undefined
  const firstQuestion = persona?.questions[0]
  const [selectedQuestionId, setSelectedQuestionId] = useState(firstQuestion?.id ?? "")
  const [showCues, setShowCues] = useState(false)
  const [practiceNotes, setPracticeNotes] = useState<Record<string, string>>({})
  const [localPracticedQuestionIds, setLocalPracticedQuestionIds] = useState<string[]>([])
  const progressKey = applicationId ? `${applicationId}:${personaSlug}` : undefined
  const practicedQuestionIds = progressKey
    ? interviewProgress[progressKey] ?? []
    : localPracticedQuestionIds

  if (!persona || !firstQuestion) return null

  const selectedQuestion = persona.questions.find((question) => question.id === selectedQuestionId) ?? firstQuestion
  const selectedQuestionIndex = persona.questions.findIndex((question) => question.id === selectedQuestion.id)
  const isPracticed = practicedQuestionIds.includes(selectedQuestion.id)

  function selectQuestion(questionId: string) {
    setSelectedQuestionId(questionId)
    setShowCues(false)
  }

  function togglePracticed() {
    if (applicationId) {
      toggleInterviewQuestionPractice(applicationId, personaSlug, selectedQuestion.id)
      return
    }

    setLocalPracticedQuestionIds((current) =>
      current.includes(selectedQuestion.id)
        ? current.filter((questionId) => questionId !== selectedQuestion.id)
        : [...current, selectedQuestion.id],
    )
  }

  function moveToNextQuestion() {
    if (!persona) return

    const nextQuestion = persona.questions[(selectedQuestionIndex + 1) % persona.questions.length]
    if (nextQuestion) selectQuestion(nextQuestion.id)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="interview" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <Link href="/interviews" className={`${buttonVariants({ variant: "ghost", size: "sm" })} mb-5 -ml-2`}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />Back to interview prep
          </Link>

          <section aria-labelledby="page-title" className="mb-6">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquareText className="size-[18px]" />
              </span>
              <div>
                <Badge variant="outline" className="mb-2">{persona.label} persona</Badge>
                <h1 id="page-title" className="text-[26px] font-medium tracking-tight sm:text-[30px]">{persona.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {persona.focus} Common prompts for your {profile.headline.toLowerCase()} profile.
                </p>
              </div>
            </div>
          </section>

          {application && (
            <Card className="mb-6 border-border shadow-none">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <Avatar className="size-9 shrink-0 border border-border bg-muted">
                  {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
                  <AvatarFallback className="text-xs font-medium text-muted-foreground">{application.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Preparing for</p>
                  <p className="truncate text-sm font-medium">{application.company} <span className="font-normal text-muted-foreground">· {application.role}</span></p>
                </div>
                <Badge variant="outline" className="max-w-full truncate font-normal">{application.nextStep}</Badge>
              </CardContent>
            </Card>
          )}

          <section aria-label="Choose an interviewer persona" className="mb-6">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Practice with a different persona</p>
            <nav className="flex flex-wrap gap-2">
              {interviewPersonas.map((option) => (
                <Link
                  key={option.slug}
                  href={applicationId ? `/interviews/${option.slug}?applicationId=${encodeURIComponent(applicationId)}` : `/interviews/${option.slug}`}
                  aria-current={option.slug === persona.slug ? "page" : undefined}
                  className={buttonVariants({
                    size: "sm",
                    variant: option.slug === persona.slug ? "secondary" : "outline",
                  })}
                >
                  {option.label}
                </Link>
              ))}
            </nav>
          </section>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.35fr)]">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Common questions</CardTitle>
                  <Badge variant="outline">{persona.questions.length} prompts</Badge>
                </div>
                <CardDescription>Select a prompt to open its practice space.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="flex list-none flex-col gap-2 p-0">
                  {persona.questions.map((question, index) => {
                    const isSelected = question.id === selectedQuestion.id
                    const isComplete = practicedQuestionIds.includes(question.id)

                    return (
                      <li key={question.id}>
                        <Button
                          type="button"
                          variant={isSelected ? "secondary" : "ghost"}
                          aria-pressed={isSelected}
                          onClick={() => selectQuestion(question.id)}
                          className="h-auto w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left"
                        >
                          <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-md bg-background text-[11px] font-medium text-muted-foreground">
                            {isComplete ? <Check className="size-3.5 text-primary" /> : String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1 text-xs leading-relaxed">{question.prompt}</span>
                        </Button>
                      </li>
                    )
                  })}
                </ol>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium">Your practice progress</span>
                    <span className="text-muted-foreground">{practicedQuestionIds.length} / {persona.questions.length}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={application ? `${application.company} interview preparation progress` : "Interview practice progress"}
                    aria-valuemin={0}
                    aria-valuemax={persona.questions.length}
                    aria-valuenow={practicedQuestionIds.length}
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${(practicedQuestionIds.length / persona.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">Question {selectedQuestionIndex + 1} of {persona.questions.length}</Badge>
                  {isPracticed && <Badge variant="secondary"><Check data-icon="inline-start" aria-hidden="true" />Practiced</Badge>}
                </div>
                <CardTitle className="text-lg leading-relaxed sm:text-xl">{selectedQuestion.prompt}</CardTitle>
                <CardDescription>{selectedQuestion.why}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCues((current) => !current)}>
                    <Lightbulb data-icon="inline-start" aria-hidden="true" />
                    {showCues ? "Hide answer cues" : "Show answer cues"}
                  </Button>
                  <span className="text-xs text-muted-foreground">Use these as a structure, not a script.</span>
                </div>

                {showCues && (
                  <section aria-labelledby="answer-cues-title" className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                    <h3 id="answer-cues-title" className="text-sm font-medium">A useful answer structure</h3>
                    <ul className="mt-2 flex list-none flex-col gap-2 p-0">
                      {selectedQuestion.cues.map((cue) => (
                        <li key={cue} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                          <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <FieldGroup className="mt-5">
                  <Field>
                    <FieldLabel htmlFor="practice-answer">Quick answer outline</FieldLabel>
                    <Textarea
                      id="practice-answer"
                      value={practiceNotes[selectedQuestion.id] ?? ""}
                      onChange={(event) =>
                        setPracticeNotes((current) => ({ ...current, [selectedQuestion.id]: event.target.value }))
                      }
                      placeholder="Jot down a few points, then try answering out loud."
                      rows={5}
                      maxLength={2000}
                    />
                    <FieldDescription>Your outline is session-only and clears when you leave this page.</FieldDescription>
                  </Field>
                </FieldGroup>

                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant={isPracticed ? "secondary" : "default"}
                    aria-pressed={isPracticed}
                    onClick={togglePracticed}
                  >
                    {isPracticed ? <Check data-icon="inline-start" aria-hidden="true" /> : null}
                    {isPracticed ? "Mark as unpracticed" : "Mark as practiced"}
                  </Button>
                  <Button type="button" variant="outline" onClick={moveToNextQuestion}>
                    Next question <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
