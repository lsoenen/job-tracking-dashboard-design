"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, LoaderCircle, MessageSquareText, RotateCw, Sparkles } from "lucide-react"

import { useJobProfile } from "@/components/job-profile-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { Application } from "@/lib/applications"

type PreparedQuestion = {
  question: string
  why: string
  answerFocus: string[]
}

export function ApplicationInterviewPrep({ application }: { application: Application }) {
  const { profile } = useJobProfile()
  const [questions, setQuestions] = useState<PreparedQuestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [practiced, setPracticed] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  const selectedQuestion = questions[selectedIndex]
  const isPracticed = practiced.includes(selectedIndex)

  async function generateQuestions() {
    setIsGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/application-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "interview-questions",
          application: {
            company: application.company,
            role: application.role,
            description: application.description ?? "",
          },
          profile: {
            fullName: profile.fullName,
            headline: profile.headline,
            background: profile.background,
            skills: profile.skills,
          },
        }),
      })
      const result = await response.json()

      if (!response.ok || !Array.isArray(result.questions)) {
        throw new Error(result.error || "Could not create an interview question set.")
      }

      setQuestions(result.questions)
      setSelectedIndex(0)
      setNotes({})
      setPracticed([])
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Could not create an interview question set.")
    } finally {
      setIsGenerating(false)
    }
  }

  function togglePracticed() {
    setPracticed((current) =>
      current.includes(selectedIndex)
        ? current.filter((index) => index !== selectedIndex)
        : [...current, selectedIndex],
    )
  }

  return (
    <section aria-labelledby="interview-prep-title" className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Interview prep</p>
          <h2 id="interview-prep-title" className="mt-1 text-xl font-semibold tracking-tight">Walk in with a point of view</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Build a question set around {application.role} at {application.company}, then shape your own answers.
          </p>
        </div>
        <Button type="button" onClick={generateQuestions} disabled={isGenerating} className="w-full shrink-0 sm:w-auto">
          {isGenerating ? (
            <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          ) : questions.length ? (
            <RotateCw aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Sparkles aria-hidden="true" data-icon="inline-start" />
          )}
          {isGenerating ? "Building your question set" : questions.length ? "Refresh question set" : "Generate likely questions"}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Sparkles aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p>
          AI-generated prompts tailored to the role, company, and your profile—not verified reports of past interviews. Your profile and role details are sent with the request; leave out sensitive information.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {questions.length ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(250px,0.82fr)_minmax(0,1.28fr)]">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Your question set</CardTitle>
                <Badge variant="outline">{questions.length} prompts</Badge>
              </div>
              <CardDescription>Select a question to prepare an answer.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="flex list-none flex-col gap-2 p-0">
                {questions.map((question, index) => {
                  const isSelected = index === selectedIndex
                  const isComplete = practiced.includes(index)

                  return (
                    <li key={`${question.question}-${index}`}>
                      <Button
                        type="button"
                        variant={isSelected ? "secondary" : "ghost"}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedIndex(index)}
                        className="h-auto w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left"
                      >
                        <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-md bg-background text-[11px] font-medium text-muted-foreground">
                          {isComplete ? <Check className="size-3.5 text-primary" /> : String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 text-xs leading-relaxed">{question.question}</span>
                      </Button>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-5 border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">Practice progress</span>
                  <span className="text-muted-foreground">{practiced.length} / {questions.length}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${application.company} interview question practice progress`}
                  aria-valuemin={0}
                  aria-valuemax={questions.length}
                  aria-valuenow={practiced.length}
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(practiced.length / questions.length) * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedQuestion && (
            <Card className="border-border shadow-none">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">Question {selectedIndex + 1} of {questions.length}</Badge>
                  {isPracticed && <Badge variant="secondary"><Check data-icon="inline-start" aria-hidden="true" />Practiced</Badge>}
                </div>
                <CardTitle className="text-lg leading-relaxed sm:text-xl">{selectedQuestion.question}</CardTitle>
                <CardDescription>{selectedQuestion.why}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-medium">Points worth bringing into your answer</h3>
                  <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                    {selectedQuestion.answerFocus.map((focus) => (
                      <li key={focus} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                        <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                        {focus}
                      </li>
                    ))}
                  </ul>
                </div>

                <FieldGroup className="mt-5">
                  <Field>
                    <FieldLabel htmlFor="interview-answer-outline">Your answer outline</FieldLabel>
                    <Textarea
                      id="interview-answer-outline"
                      value={notes[selectedIndex] ?? ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [selectedIndex]: event.target.value }))}
                      placeholder="Jot down a real example, the decision you made, and what changed."
                      rows={5}
                      maxLength={2000}
                    />
                    <FieldDescription>Your notes stay in this page session. Use your own examples and wording.</FieldDescription>
                  </Field>
                </FieldGroup>

                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="button" variant={isPracticed ? "secondary" : "default"} aria-pressed={isPracticed} onClick={togglePracticed}>
                    {isPracticed && <Check data-icon="inline-start" aria-hidden="true" />}
                    {isPracticed ? "Mark as unpracticed" : "Mark as practiced"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={questions.length < 2}
                    onClick={() => setSelectedIndex((selectedIndex + 1) % questions.length)}
                  >
                    Next question <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-border shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquareText className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">A smarter practice set starts with this role</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Generate likely questions, what each one is testing, and a few answer angles based on the position and the experience in your profile.
            </p>
            <Button type="button" onClick={generateQuestions} disabled={isGenerating} className="mt-5">
              {isGenerating ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" /> : <Sparkles aria-hidden="true" data-icon="inline-start" />}
              {isGenerating ? "Building your question set" : "Generate my questions"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">Want more guided practice? Switch between interviewer perspectives.</p>
        <Link
          href={`/interviews/hiring-manager?applicationId=${encodeURIComponent(application.id)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open full practice space <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}
