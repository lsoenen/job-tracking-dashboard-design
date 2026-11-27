"use client"

import { useState } from "react"
import { Copy, LoaderCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useJobProfile } from "@/components/job-profile-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { Application } from "@/lib/applications"

type ApplicationMaterialMode = "resume" | "cover-letter"

type ApplicationMaterialsDialogProps = {
  application: Application
  mode: ApplicationMaterialMode
  onOpenChange: (open: boolean) => void
}

export function ApplicationMaterialsDialog({ application, mode, onOpenChange }: ApplicationMaterialsDialogProps) {
  const { profile } = useJobProfile()
  const [summary, setSummary] = useState(profile.background)
  const [skills, setSkills] = useState(profile.skills)
  const [coverLetter, setCoverLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState("")
  const isResume = mode === "resume"
  const title = isResume ? "Tailor resume" : "Create cover letter"
  const description = `${application.role} at ${application.company}`
  const draft = isResume ? `${summary.trim()}\n\nCore skills\n${skills.trim()}`.trim() : coverLetter.trim()

  async function generateDraft() {
    setIsGenerating(true)
    setGenerationError("")

    try {
      const response = await fetch("/api/application-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: isResume ? "resume" : "cover-letter",
          application: {
            company: application.company,
            role: application.role,
            description: application.description ?? "",
          },
          profile: {
            fullName: profile.fullName,
            headline: profile.headline,
            background: summary,
            skills,
          },
          currentDraft: coverLetter,
        }),
      })
      const result = await response.json() as Record<string, unknown>

      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Could not generate a draft.")
      }

      if (isResume) {
        if (typeof result.summary !== "string" || typeof result.skills !== "string") {
          throw new Error("The resume draft was incomplete. Please try again.")
        }
        setSummary(result.summary)
        setSkills(result.skills)
        toast.success("Role-tailored resume content is ready")
      } else {
        if (typeof result.content !== "string") throw new Error("The cover letter draft was incomplete. Please try again.")
        setCoverLetter(result.content)
        toast.success("Your cover letter draft is ready")
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Could not generate a draft. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyDraft() {
    if (!draft) return

    try {
      await navigator.clipboard.writeText(draft)
      toast.success(isResume ? "Resume content copied" : "Cover letter copied")
    } catch {
      toast.error("Copy isn’t available here. Select the draft and copy it manually.")
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="min-h-0 overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}. Review every detail and make it sound like you before sending.</DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5">
              <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">Your profile and saved role details are sent with this request. Leave out any sensitive information you don&apos;t want the model to process.</p>
            </div>
            <Button type="button" onClick={generateDraft} disabled={isGenerating} className="shrink-0">
              {isGenerating ? (
                <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" data-icon="inline-start" />
              )}
              {isGenerating ? "Generating" : "Generate with AI"}
            </Button>
          </div>
          {generationError && <p role="alert" className="mt-3 text-sm text-destructive">{generationError}</p>}

          {isResume ? (
            <FieldGroup className="mt-6">
              <Field>
                <FieldLabel htmlFor="resume-summary">Professional summary</FieldLabel>
                <Textarea
                  id="resume-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={5}
                  className="min-h-28"
                />
                <FieldDescription>Keep this accurate to your experience. Edit the wording before adding it to your resume.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="resume-skills">Skills to emphasize</FieldLabel>
                <Textarea
                  id="resume-skills"
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                  rows={3}
                  className="min-h-20"
                />
                <FieldDescription>Reorder or edit these skills, then copy them into your resume.</FieldDescription>
              </Field>
            </FieldGroup>
          ) : (
            <Field className="mt-6">
              <FieldLabel htmlFor="cover-letter-draft">Cover letter draft</FieldLabel>
              <Textarea
                id="cover-letter-draft"
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                placeholder="Generate a first draft, then personalize it before sending."
                rows={14}
                className="min-h-64"
              />
              <FieldDescription>Personalize this draft, then copy it into the employer&apos;s application form.</FieldDescription>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={copyDraft} disabled={!draft}>
            <Copy aria-hidden="true" data-icon="inline-start" />
            Copy draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ApplicationMaterialMode }
