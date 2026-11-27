"use client"

import { useEffect, useState, type FormEvent } from "react"
import { LoaderCircle, Save } from "lucide-react"
import { toast } from "sonner"

import { useApplications } from "@/components/applications-provider"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  applicationStatuses,
  furthestStageLabels,
  interviewStages,
  statusLabel,
  type Application,
  type ApplicationStatus,
  type InterviewStage,
  type NewApplication,
} from "@/lib/applications"

export const interviewStageLabels: Record<InterviewStage, string> = {
  recruiter: "Recruiter screen",
  "hiring-manager": "Hiring manager",
  "team-technical-case": "Team, technical, or case",
  "final-executive": "Final or executive round",
}

type Draft = {
  company: string
  role: string
  status: ApplicationStatus
  interviewStage: InterviewStage
  /** For "Not moving forward": the furthest interview round reached */
  furthestStage: InterviewStage | "none"
  appliedDate: string
  nextStep: string
  dueDate: string
  sourceUrl: string
  description: string
}

function draftFrom(application: Application): Draft {
  return {
    company: application.company,
    role: application.role,
    status: application.status,
    interviewStage: application.interviewStage ?? "recruiter",
    furthestStage: application.interviewStage ?? "none",
    appliedDate: application.appliedDate ?? "",
    nextStep: application.nextStep === "—" ? "" : application.nextStep,
    dueDate: application.dueDate ?? "",
    sourceUrl: application.sourceUrl ?? "",
    description: application.description ?? "",
  }
}

/** Only the fields that actually changed, so saving doesn't touch anything else */
function changes(application: Application, draft: Draft): Partial<NewApplication> {
  const original = draftFrom(application)
  const patch: Partial<NewApplication> = {}

  if (draft.company.trim() !== original.company) patch.company = draft.company.trim()
  if (draft.role.trim() !== original.role) patch.role = draft.role.trim()
  if (draft.status !== original.status) patch.status = draft.status
  if (draft.status === "Interviewing" && (draft.interviewStage !== application.interviewStage || patch.status)) {
    patch.interviewStage = draft.interviewStage
  }
  if (draft.status === "Not moving forward") {
    const furthest = draft.furthestStage === "none" ? undefined : draft.furthestStage
    // An empty value clears the stored round ("Before an interview")
    if (furthest !== application.interviewStage) patch.interviewStage = furthest ?? ("" as InterviewStage)
  }
  if (draft.appliedDate !== original.appliedDate) patch.appliedDate = draft.appliedDate
  if (draft.nextStep.trim() !== original.nextStep) patch.nextStep = draft.nextStep.trim()
  if (draft.dueDate !== original.dueDate) patch.dueDate = draft.dueDate
  if (draft.sourceUrl.trim() !== original.sourceUrl) patch.sourceUrl = draft.sourceUrl.trim()
  if (draft.description.trim() !== original.description.trim()) patch.description = draft.description.trim()

  return patch
}

export function EditApplicationSheet({
  application,
  onOpenChange,
}: {
  /** The application being edited; null keeps the panel closed */
  application: Application | null
  onOpenChange: (open: boolean) => void
}) {
  const { updateApplication } = useApplications()
  const [draft, setDraft] = useState<Draft | null>(application ? draftFrom(application) : null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Start from the latest saved values each time a different application is opened
  useEffect(() => {
    setDraft(application ? draftFrom(application) : null)
    setFormError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id])

  function update<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!application || !draft) return
    setFormError(null)

    if (!draft.company.trim() || !draft.role.trim()) {
      setFormError("Add both a company and a job title.")
      return
    }

    const sourceUrl = draft.sourceUrl.trim()
    if (sourceUrl) {
      try {
        const parsed = new URL(sourceUrl)
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported link")
      } catch {
        setFormError("Enter a valid web link (starting with https://) or clear the job link.")
        return
      }
    }

    const patch = changes(application, draft)
    if (Object.keys(patch).length === 0) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    const saved = await updateApplication(application.id, patch)
    setIsSaving(false)

    if (saved) {
      toast.success("Changes saved")
      onOpenChange(false)
    } else {
      setFormError("Your changes couldn't be saved. Please try again.")
    }
  }

  return (
    <Sheet open={application !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit application</SheetTitle>
          <SheetDescription>
            {application ? `${application.role} at ${application.company}` : "Update the details for this application."}
          </SheetDescription>
        </SheetHeader>

        {draft && (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edit-company">Company</FieldLabel>
                  <Input
                    id="edit-company"
                    value={draft.company}
                    onChange={(event) => update("company", event.target.value)}
                    maxLength={200}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-role">Job title</FieldLabel>
                  <Input
                    id="edit-role"
                    value={draft.role}
                    onChange={(event) => update("role", event.target.value)}
                    maxLength={200}
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="edit-status">Stage</FieldLabel>
                    <Select value={draft.status} onValueChange={(value) => value && update("status", value as ApplicationStatus)}>
                      <SelectTrigger id="edit-status" className="w-full">
                        <SelectValue>{(value: ApplicationStatus) => statusLabel(value)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {applicationStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-applied-date">Applied date</FieldLabel>
                    <Input
                      id="edit-applied-date"
                      type="date"
                      value={draft.appliedDate}
                      onChange={(event) => update("appliedDate", event.target.value)}
                    />
                  </Field>
                </div>

                {draft.status === "Interviewing" && (
                  <Field>
                    <FieldLabel htmlFor="edit-interview-stage">Interview round</FieldLabel>
                    <Select
                      value={draft.interviewStage}
                      onValueChange={(value) => value && update("interviewStage", value as InterviewStage)}
                    >
                      <SelectTrigger id="edit-interview-stage" className="w-full">
                        <SelectValue>{(value: InterviewStage) => interviewStageLabels[value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {interviewStages.map((stage) => (
                            <SelectItem key={stage} value={stage}>{interviewStageLabels[stage]}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {draft.status === "Not moving forward" && (
                  <Field>
                    <FieldLabel htmlFor="edit-furthest-stage">How far did it get?</FieldLabel>
                    <Select
                      value={draft.furthestStage}
                      onValueChange={(value) => value && update("furthestStage", value as InterviewStage | "none")}
                    >
                      <SelectTrigger id="edit-furthest-stage" className="w-full">
                        <SelectValue>{(value: InterviewStage | "none") => furthestStageLabels[value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(["none", ...interviewStages] as const).map((stage) => (
                            <SelectItem key={stage} value={stage}>{furthestStageLabels[stage]}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Rejections after an interview still count toward your interview rate.</FieldDescription>
                  </Field>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Field>
                    <FieldLabel htmlFor="edit-next-step">Next step</FieldLabel>
                    <Input
                      id="edit-next-step"
                      value={draft.nextStep}
                      onChange={(event) => update("nextStep", event.target.value)}
                      placeholder="e.g. Follow up with recruiter"
                      maxLength={200}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-due-date">Due</FieldLabel>
                    <Input
                      id="edit-due-date"
                      type="date"
                      value={draft.dueDate}
                      onChange={(event) => update("dueDate", event.target.value)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="edit-source-url">Job posting link</FieldLabel>
                  <Input
                    id="edit-source-url"
                    type="url"
                    value={draft.sourceUrl}
                    onChange={(event) => update("sourceUrl", event.target.value)}
                    placeholder="https://"
                    autoComplete="url"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-description">Notes</FieldLabel>
                  <Textarea
                    id="edit-description"
                    value={draft.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={6}
                    maxLength={5000}
                  />
                  <FieldDescription>Role details, salary, contacts, or anything else worth remembering.</FieldDescription>
                </Field>
              </FieldGroup>

              {formError && <p role="alert" className="mt-4 text-sm text-destructive">{formError}</p>}
            </div>

            <SheetFooter>
              <SheetClose render={<Button type="button" variant="outline" disabled={isSaving} />}>Cancel</SheetClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
                ) : (
                  <Save data-icon="inline-start" aria-hidden="true" />
                )}
                Save changes
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
