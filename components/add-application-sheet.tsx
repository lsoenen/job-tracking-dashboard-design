"use client"

import { useState, type FormEvent } from "react"
import { LoaderCircle, Plus, Sparkles } from "lucide-react"

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
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { applicationStatuses, type ApplicationStatus, type NewApplication } from "@/lib/applications"

type ApplicationDraft = {
  company: string
  role: string
  description: string
  sourceUrl: string
  status: ApplicationStatus
  nextStep: string
  followUpDate: string
}

type ParsedJobPosting = {
  company?: string
  role?: string
  description?: string
  sourceUrl?: string
  error?: string
}

const emptyDraft: ApplicationDraft = {
  company: "",
  role: "",
  description: "",
  sourceUrl: "",
  status: "Applied",
  nextStep: "",
  followUpDate: "",
}

function formatDueDate(value: string) {
  if (!value) return "—"

  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
}

export function AddApplicationSheet({ onAdd }: { onAdd: (application: NewApplication) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ApplicationDraft>(emptyDraft)
  const [isFilling, setIsFilling] = useState(false)
  const [smartFillError, setSmartFillError] = useState<string | null>(null)
  const [smartFillMessage, setSmartFillMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  function updateDraft<Key extends keyof ApplicationDraft>(key: Key, value: ApplicationDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function fillFromJobLink() {
    const sourceUrl = draft.sourceUrl.trim()
    setSmartFillError(null)
    setSmartFillMessage(null)

    if (!sourceUrl) {
      setSmartFillError("Paste a job posting link first.")
      return
    }

    setIsFilling(true)

    try {
      const response = await fetch("/api/job-posting/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      })
      const result = (await response.json()) as ParsedJobPosting

      if (!response.ok) {
        throw new Error(result.error || "Could not read this job posting.")
      }

      setDraft((current) => ({
        ...current,
        company: result.company || current.company,
        role: result.role || current.role,
        description: result.description || current.description,
        sourceUrl: result.sourceUrl || current.sourceUrl,
      }))
      setSmartFillMessage("Details found. Review the fields before saving.")
    } catch (error) {
      setSmartFillError(error instanceof Error ? error.message : "Could not read this job posting.")
    } finally {
      setIsFilling(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const company = draft.company.trim()
    const role = draft.role.trim()
    const sourceUrl = draft.sourceUrl.trim()

    if (!company || !role) {
      setFormError("Add both a company and a job title.")
      return
    }

    if (sourceUrl) {
      try {
        const parsedUrl = new URL(sourceUrl)
        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
          throw new Error("Unsupported link")
        }
      } catch {
        setFormError("Enter a valid web link or clear the posting URL.")
        return
      }
    }

    onAdd({
      company,
      role,
      description: draft.description.trim(),
      sourceUrl: sourceUrl || undefined,
      status: draft.status,
      nextStep: draft.nextStep.trim() || "No next step set",
      due: formatDueDate(draft.followUpDate),
    })
    setDraft(emptyDraft)
    setSmartFillError(null)
    setSmartFillMessage(null)
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setFormError(null)
      }}
    >
      <SheetTrigger render={<Button size="sm" className="w-full sm:w-auto" />}>
        <Plus data-icon="inline-start" aria-hidden="true" />
        Add application
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add an application</SheetTitle>
          <SheetDescription>
            Add the details manually or prefill them from a public job posting. Review everything before saving.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles aria-hidden="true" className="size-4 text-muted-foreground" />
                Fill from a job link
              </div>
              <FieldGroup className="mt-3 gap-2">
                <Field>
                  <FieldLabel htmlFor="posting-url">Posting URL</FieldLabel>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="posting-url"
                      type="url"
                      value={draft.sourceUrl}
                      onChange={(event) => {
                        updateDraft("sourceUrl", event.target.value)
                        setSmartFillError(null)
                        setSmartFillMessage(null)
                      }}
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      autoComplete="url"
                    />
                    <Button type="button" variant="outline" onClick={fillFromJobLink} disabled={isFilling}>
                      {isFilling ? (
                        <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
                      ) : (
                        <Sparkles data-icon="inline-start" aria-hidden="true" />
                      )}
                      {isFilling ? "Reading" : "Auto-fill"}
                    </Button>
                  </div>
                  <FieldDescription>
                    Public links from major job boards are supported. Pages that require sign-in may not be readable.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              {smartFillError && <p role="alert" className="mt-3 text-xs text-destructive">{smartFillError}</p>}
              {smartFillMessage && <p role="status" className="mt-3 text-xs text-muted-foreground">{smartFillMessage}</p>}
            </div>

            <FieldGroup className="mt-6">
              <Field>
                <FieldLabel htmlFor="application-company">Company <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id="application-company"
                  value={draft.company}
                  onChange={(event) => updateDraft("company", event.target.value)}
                  placeholder="Company name"
                  autoComplete="organization"
                  maxLength={100}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="application-role">Job title <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id="application-role"
                  value={draft.role}
                  onChange={(event) => updateDraft("role", event.target.value)}
                  placeholder="e.g. Product Designer"
                  maxLength={150}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="application-description">Details</FieldLabel>
                <Textarea
                  id="application-description"
                  value={draft.description}
                  onChange={(event) => updateDraft("description", event.target.value)}
                  placeholder="Notes, requirements, or anything you want to remember"
                  maxLength={5000}
                  rows={4}
                />
                <FieldDescription>Optional notes about the role or hiring process.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="application-status">Stage</FieldLabel>
                <Select
                  value={draft.status}
                  onValueChange={(value) => value && updateDraft("status", value as ApplicationStatus)}
                >
                  <SelectTrigger id="application-status" className="w-full">
                    <SelectValue placeholder="Choose a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {applicationStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="application-next-step">Next step</FieldLabel>
                <Input
                  id="application-next-step"
                  value={draft.nextStep}
                  onChange={(event) => updateDraft("nextStep", event.target.value)}
                  placeholder="e.g. Follow up with recruiter"
                  maxLength={200}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="application-follow-up">Follow-up date</FieldLabel>
                <Input
                  id="application-follow-up"
                  type="date"
                  value={draft.followUpDate}
                  onChange={(event) => updateDraft("followUpDate", event.target.value)}
                />
              </Field>
            </FieldGroup>

            {formError && <p role="alert" className="mt-4 text-sm text-destructive">{formError}</p>}
          </div>

          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
            <Button type="submit">Save application</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
