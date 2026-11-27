"use client"

import { useState } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"

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
import { useJobProfile } from "@/components/job-profile-provider"
import type { Application } from "@/lib/applications"

type ApplicationMaterialMode = "resume" | "cover-letter"

type ApplicationMaterialsDialogProps = {
  application: Application
  mode: ApplicationMaterialMode
  onCopied: () => void
  onOpenChange: (open: boolean) => void
}

function createCoverLetterDraft(application: Application, profileName: string, headline: string, skills: string, background: string) {
  const relevantSkills = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ")

  return `Dear ${application.company} hiring team,\n\nI’m excited to apply for the ${application.role} position at ${application.company}. As a ${headline.toLowerCase()}, I bring experience that connects thoughtful product work with clear user needs.\n\n${background}\n\nI’m especially interested in bringing my experience in ${relevantSkills || "product design and collaboration"} to this role. I would welcome the opportunity to share more about how I can contribute to the team.\n\nThank you for your consideration.\n\nBest,\n${profileName}`
}

export function ApplicationMaterialsDialog({ application, mode, onCopied, onOpenChange }: ApplicationMaterialsDialogProps) {
  const { profile } = useJobProfile()
  const [summary, setSummary] = useState(profile.background)
  const [skills, setSkills] = useState(profile.skills)
  const [coverLetter, setCoverLetter] = useState(() =>
    createCoverLetterDraft(application, profile.fullName, profile.headline, profile.skills, profile.background),
  )
  const isResume = mode === "resume"
  const title = isResume ? "Tailor resume" : "Create cover letter"
  const description = `${application.role} at ${application.company}`
  const draft = isResume ? `${summary.trim()}\n\nCore skills\n${skills.trim()}`.trim() : coverLetter

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft)
      onCopied()
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
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
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
                <FieldDescription>Refine your summary for this role, then copy it into your resume or paste it into any application site.</FieldDescription>
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
                <FieldDescription>Reorder or edit your skills, then copy them into your resume or application form.</FieldDescription>
              </Field>
            </FieldGroup>
          ) : (
            <Field className="mt-6">
              <FieldLabel htmlFor="cover-letter-draft">Cover letter draft</FieldLabel>
              <Textarea
                id="cover-letter-draft"
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                rows={14}
                className="min-h-64"
              />
              <FieldDescription>Review and personalize this draft, then copy it into the employer&apos;s application form.</FieldDescription>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={copyDraft}>
            <Copy aria-hidden="true" data-icon="inline-start" />
            Copy draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ApplicationMaterialMode }
