"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, ClipboardPaste, Download, FileText, LoaderCircle, Pencil, Save } from "lucide-react"

import { JobDescription } from "@/components/job-description"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Textarea } from "@/components/ui/textarea"

const sourceLabels = {
  imported: "Imported posting",
  canvas: "From Canvas",
  notes: "From your notes",
} as const

const collapseAfter = 1400

export function JobDescriptionCard({
  text,
  source,
  onSave,
  onImport,
}: {
  /** The description to show, or undefined when there isn't one */
  text?: string
  source?: keyof typeof sourceLabels
  /** Saves edited or pasted text as the posting text; resolves true on success */
  onSave: (text: string) => Promise<boolean>
  onImport: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isLong = (text?.length ?? 0) > collapseAfter

  function startEditing() {
    setDraft(text ?? "")
    setEditing(true)
  }

  async function save() {
    setIsSaving(true)
    const ok = await onSave(draft.trim())
    setIsSaving(false)
    if (ok) setEditing(false)
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Job description</CardTitle>
            {text && source && !editing && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{sourceLabels[source]}</span>
            )}
          </div>
          {text && !editing && (
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={onImport}>
                <Download data-icon="inline-start" aria-hidden="true" />
                Import posting
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={startEditing}>
                <Pencil data-icon="inline-start" aria-hidden="true" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex flex-col gap-3">
            <label htmlFor="job-description-text" className="sr-only">Job description</label>
            <Textarea
              id="job-description-text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={16}
              maxLength={20000}
              placeholder="Paste the full job posting here: about the role, responsibilities, qualifications, pay, and benefits."
              className="min-h-72 text-sm leading-relaxed"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Saved with this application. Networking suggestions and &quot;Fill from posting&quot; use it.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={() => void save()} disabled={isSaving || draft.trim() === (text ?? "").trim()}>
                {isSaving ? <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" /> : <Save data-icon="inline-start" aria-hidden="true" />}
                Save description
              </Button>
            </div>
          </div>
        ) : text ? (
          <>
            <div className={`relative ${isLong && !expanded ? "max-h-96 overflow-hidden" : ""}`}>
              <JobDescription text={text} />
              {isLong && !expanded && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
              )}
            </div>
            {isLong && (
              <Button type="button" variant="ghost" size="sm" className="mt-2 px-0 hover:bg-transparent" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
                {expanded ? <ChevronUp data-icon="inline-start" aria-hidden="true" /> : <ChevronDown data-icon="inline-start" aria-hidden="true" />}
                {expanded ? "Show less" : "Show full description"}
              </Button>
            )}
          </>
        ) : (
          <Empty className="gap-3 border border-dashed border-border bg-muted/20 p-6">
            <EmptyHeader className="gap-1">
              <EmptyMedia variant="icon" className="size-11 rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-medium">No job description yet</EmptyTitle>
              <EmptyDescription className="text-xs">
                Keep the posting here so you have it even after it&apos;s taken down. It also improves suggestions across the app.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onImport}>
                <Download data-icon="inline-start" aria-hidden="true" />
                Import posting
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={startEditing}>
                <ClipboardPaste data-icon="inline-start" aria-hidden="true" />
                Paste description
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
