"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, LoaderCircle, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useJobProfile } from "@/components/job-profile-provider"
import type { CoverLetterContent, ResumeContent, SavedMaterials } from "@/components/use-application-materials"
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
  saved: SavedMaterials
  onSave: (kind: ApplicationMaterialMode, content: CoverLetterContent | ResumeContent) => Promise<boolean>
  /** Open and generate a first draft straight away */
  generateOnOpen?: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationMaterialsDialog({ application, mode, saved, onSave, generateOnOpen, onOpenChange }: ApplicationMaterialsDialogProps) {
  const { profile } = useJobProfile()
  const savedResume = saved.resume?.content
  const savedLetter = saved["cover-letter"]?.content.text ?? ""
  const [summary, setSummary] = useState(savedResume?.summary ?? profile.background)
  const [skills, setSkills] = useState(savedResume?.skills ?? profile.skills)
  const [coverLetter, setCoverLetter] = useState(savedLetter)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generationError, setGenerationError] = useState("")
  const [lastSaved, setLastSaved] = useState(() =>
    mode === "resume" ? (savedResume ? JSON.stringify(savedResume) : null) : savedLetter || null,
  )
  const autoStarted = useRef(false)
  const isResume = mode === "resume"
  const title = isResume ? "Tailor resume" : "Create cover letter"
  const description = `${application.role} at ${application.company}`
  const draft = isResume ? `${summary.trim()}\n\nCore skills\n${skills.trim()}`.trim() : coverLetter.trim()
  const currentContent: CoverLetterContent | ResumeContent = isResume
    ? { summary: summary.trim(), skills: skills.trim() }
    : { text: coverLetter.trim() }
  const currentKey = isResume ? JSON.stringify(currentContent) : coverLetter.trim()
  const hasContent = isResume ? Boolean(summary.trim() || skills.trim()) : Boolean(coverLetter.trim())
  const isDirty = hasContent && currentKey !== lastSaved

  async function save(content = currentContent, key = currentKey, quiet = false) {
    setIsSaving(true)
    const ok = await onSave(mode, content)
    setIsSaving(false)
    if (ok) {
      setLastSaved(key)
      if (!quiet) toast.success(isResume ? "Resume draft saved" : "Cover letter saved")
    } else {
      toast.error("Your draft couldn't be saved. Copy it somewhere safe and try again.")
    }
    return ok
  }

  async function close() {
    // Never lose edits: save anything unsaved on the way out
    if (isDirty && !(await save(currentContent, currentKey, true))) return
    onOpenChange(false)
  }

  useEffect(() => {
    if (!generateOnOpen || autoStarted.current) return
    autoStarted.current = true
    void generateDraft()
    // Run once when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        const content = { summary: result.summary.trim(), skills: result.skills.trim() }
        await save(content, JSON.stringify(content), true)
        toast.success("Role-tailored resume content is ready and saved")
      } else {
        if (typeof result.content !== "string") throw new Error("The cover letter draft was incomplete. Please try again.")
        setCoverLetter(result.content)
        await save({ text: result.content.trim() }, result.content.trim(), true)
        toast.success("Your cover letter draft is ready and saved")
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
    <Dialog open onOpenChange={(open) => { if (!open) void close() }}>
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
          <Button type="button" variant="ghost" onClick={() => void close()} disabled={isSaving}>
            Close
          </Button>
          <Button type="button" variant="outline" onClick={() => void save()} disabled={!isDirty || isSaving || isGenerating}>
            {isSaving ? (
              <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
            ) : (
              <Save aria-hidden="true" data-icon="inline-start" />
            )}
            {isDirty || !lastSaved ? "Save draft" : "Saved"}
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
