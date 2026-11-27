"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardPaste, Link2, LoaderCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Application } from "@/lib/applications"
import { formatSalary, type JobDetails } from "@/lib/job-details"

type ImportResult = { details: JobDetails; url?: string; source: string; usedAi: boolean }

/** Fields shown on the review screen, in order. Salary fields are reviewed together. */
const reviewFields: { key: string; label: string; keys: (keyof JobDetails)[]; format: (details: JobDetails) => string | undefined }[] = [
  { key: "salary", label: "Salary", keys: ["salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod"], format: formatSalary },
  { key: "location", label: "Location", keys: ["location"], format: (d) => d.location },
  { key: "workArrangement", label: "Work arrangement", keys: ["workArrangement"], format: (d) => d.workArrangement },
  { key: "employmentType", label: "Employment type", keys: ["employmentType"], format: (d) => d.employmentType },
  { key: "level", label: "Level", keys: ["level"], format: (d) => d.level },
  { key: "team", label: "Team", keys: ["team"], format: (d) => d.team },
  { key: "industry", label: "Industry", keys: ["industry"], format: (d) => d.industry },
  { key: "equity", label: "Equity", keys: ["equity"], format: (d) => d.equity },
  { key: "bonus", label: "Bonus", keys: ["bonus"], format: (d) => d.bonus },
  { key: "benefits", label: "Benefits", keys: ["benefits"], format: (d) => d.benefits },
  { key: "companyWebsite", label: "Company website", keys: ["companyWebsite"], format: (d) => d.companyWebsite?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") },
  { key: "deadline", label: "Application deadline", keys: ["deadline"], format: (d) => d.deadline },
]

const sourceNames: Record<string, string> = {
  greenhouse: "Greenhouse's official feed",
  lever: "Lever's official feed",
  ashby: "Ashby's official feed",
  page: "the job page",
  text: "the pasted text",
}

export function ImportPostingDialog({
  open,
  application,
  details,
  onOpenChange,
  onApply,
}: {
  open: boolean
  application: Application
  details: JobDetails
  onOpenChange: (open: boolean) => void
  onApply: (next: JobDetails, postingUrl?: string) => Promise<boolean>
}) {
  const [mode, setMode] = useState<"link" | "text">("link")
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [isReading, setIsReading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [savePostingText, setSavePostingText] = useState(true)
  const [saveUrl, setSaveUrl] = useState(true)

  useEffect(() => {
    if (!open) return
    setMode(application.sourceUrl ? "link" : "text")
    setUrl(application.sourceUrl ?? "")
    setText("")
    setError(null)
    setResult(null)
    // Fresh each time the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fields the posting provided that differ from what's saved
  const found = useMemo(() => {
    if (!result) return []
    return reviewFields.flatMap((field) => {
      const next = field.format(result.details)
      if (!next) return []
      const current = field.format(details)
      if (current === next) return []
      return [{ ...field, next, current }]
    })
  }, [result, details])
  const alreadyMatching = result ? reviewFields.filter((field) => field.format(result.details) && field.format(result.details) === field.format(details)).length : 0
  const canSaveUrl = Boolean(result?.url && result.url !== application.sourceUrl)

  async function read() {
    setError(null)
    setIsReading(true)
    try {
      const response = await fetch("/api/job-posting/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "link" ? { applicationId: application.id, url } : { applicationId: application.id, text }),
      })
      const payload = (await response.json()) as ImportResult & { error?: string }
      if (!response.ok) throw new Error(payload.error || "The posting couldn't be read.")

      setResult(payload)
      // Pre-select fields that are empty today; leave replacements for the user to opt into
      setSelected(
        new Set(
          reviewFields
            .filter((field) => field.format(payload.details) && !field.format(details))
            .map((field) => field.key),
        ),
      )
      setSavePostingText(Boolean(payload.details.postingText))
      setSaveUrl(!application.sourceUrl)
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "The posting couldn't be read.")
    } finally {
      setIsReading(false)
    }
  }

  async function apply() {
    if (!result) return
    const next: JobDetails = { ...details }
    for (const field of found) {
      if (!selected.has(field.key)) continue
      for (const key of field.keys) (next as Record<string, unknown>)[key] = result.details[key]
    }
    if (savePostingText && result.details.postingText) next.postingText = result.details.postingText

    setIsApplying(true)
    const ok = await onApply(next, canSaveUrl && saveUrl ? result.url : undefined)
    setIsApplying(false)
    if (ok) onOpenChange(false)
  }

  const changes = found.filter((field) => selected.has(field.key)).length + (savePostingText && result?.details.postingText ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={(next) => !isReading && !isApplying && onOpenChange(next)}>
      <DialogContent className="p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5 pr-14">
          <DialogTitle>Import posting</DialogTitle>
          <DialogDescription>
            {result
              ? `Read from ${sourceNames[result.source] ?? "the posting"}${result.usedAi ? ", with AI help for the rest" : ""}. Choose what to keep.`
              : "Pull salary, location, and other details from the job posting instead of typing them."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-6">
          {!result ? (
            <>
              <div role="tablist" aria-label="Import from" className="flex w-fit rounded-lg border border-border p-0.5">
                {([
                  { id: "link", label: "Job link", icon: Link2 },
                  { id: "text", label: "Paste text", icon: ClipboardPaste },
                ] as const).map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === option.id}
                    size="sm"
                    variant={mode === option.id ? "secondary" : "ghost"}
                    className="h-7"
                    onClick={() => {
                      setMode(option.id)
                      setError(null)
                    }}
                  >
                    <option.icon data-icon="inline-start" aria-hidden="true" />
                    {option.label}
                  </Button>
                ))}
              </div>

              {mode === "link" ? (
                <Field>
                  <FieldLabel htmlFor="import-posting-url">Job posting link</FieldLabel>
                  <Input
                    id="import-posting-url"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://boards.greenhouse.io/…"
                    autoFocus
                  />
                  <FieldDescription>
                    Works best with Greenhouse, Lever, and Ashby links (most tech companies). LinkedIn usually blocks reading;
                    use Paste text for those.
                  </FieldDescription>
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="import-posting-text">Posting text</FieldLabel>
                  <Textarea
                    id="import-posting-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={12}
                    maxLength={20000}
                    placeholder="Open the posting, select everything (⌘A), copy (⌘C), and paste it here."
                    className="min-h-56"
                    autoFocus
                  />
                  <FieldDescription>Include the pay range and location sections if the posting has them.</FieldDescription>
                </Field>
              )}

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </>
          ) : found.length === 0 && !result.details.postingText ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing new was found{alreadyMatching > 0 ? `. ${alreadyMatching} detail${alreadyMatching === 1 ? " already matches" : "s already match"} what you have` : ""}.
            </p>
          ) : (
            <>
              {found.length > 0 && (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {found.map((field) => (
                    <li key={field.key}>
                      <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/30">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 accent-primary"
                          checked={selected.has(field.key)}
                          onChange={(event) =>
                            setSelected((current) => {
                              const next = new Set(current)
                              if (event.target.checked) next.add(field.key)
                              else next.delete(field.key)
                              return next
                            })
                          }
                        />
                        <span className="grid min-w-0 flex-1 gap-0.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
                          <span className="text-xs text-muted-foreground sm:pt-0.5">{field.label}</span>
                          <span className="min-w-0 text-sm">
                            <span className="break-words">{field.next}</span>
                            {field.current && (
                              <span className="block text-xs text-muted-foreground">
                                Replaces: <span className="line-through">{field.current}</span>
                              </span>
                            )}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2.5">
                {result.details.postingText && (
                  <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={savePostingText} onChange={(event) => setSavePostingText(event.target.checked)} />
                    <span>
                      Save the full posting text
                      <span className="block text-xs text-muted-foreground">
                        Improves networking suggestions and keeps the posting even if it&apos;s taken down.
                      </span>
                    </span>
                  </label>
                )}
                {canSaveUrl && (
                  <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={saveUrl} onChange={(event) => setSaveUrl(event.target.checked)} />
                    <span>
                      {application.sourceUrl ? "Replace the saved job posting link with this one" : "Save this as the job posting link"}
                    </span>
                  </label>
                )}
              </div>

              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Sparkles aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                Check salary and dates against the posting before relying on them.
                {alreadyMatching > 0 && ` ${alreadyMatching} detail${alreadyMatching === 1 ? " already matches" : "s already match"} what you have.`}
              </p>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {result ? (
            <Button type="button" variant="ghost" onClick={() => setResult(null)} disabled={isApplying}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <DialogClose render={<Button type="button" variant="outline" disabled={isReading || isApplying} />}>Cancel</DialogClose>
            {result ? (
              <Button type="button" onClick={() => void apply()} disabled={isApplying || changes === 0}>
                {isApplying && <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />}
                {changes === 0 ? "Nothing selected" : `Apply ${changes} change${changes === 1 ? "" : "s"}`}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void read()}
                disabled={isReading || (mode === "link" ? !url.trim() : text.trim().length < 40)}
              >
                {isReading ? (
                  <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
                ) : (
                  <Sparkles data-icon="inline-start" aria-hidden="true" />
                )}
                {isReading ? "Reading…" : "Read posting"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
