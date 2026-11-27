import { ExternalLink, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { ResumeAttachment } from "@/lib/job-profile"

type ResumeUploadCardProps = {
  /** Which document this card is for; defaults to the resume */
  kind?: "resume" | "cover-letter"
  resume: ResumeAttachment | null
  isPendingUpload: boolean
  error: string
  onFileSelected: (file: File) => void
  onOpen?: () => void
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
}

const cardText = {
  resume: {
    title: "Resume",
    description: "Upload your resume as a Word file (.docx). Only you can see it.",
    empty: "No resume uploaded yet.",
    noun: "resume",
    help: "Word (.docx) only, up to 10 MB. Google Docs: File → Download → Microsoft Word. Tailoring keeps your exact design.",
  },
  "cover-letter": {
    title: "Sample cover letter",
    description: "A cover letter you've written before. New letters follow its voice, style, and layout.",
    empty: "No sample cover letter yet.",
    noun: "sample letter",
    help: "Word (.docx) only, up to 10 MB. Use one you're proud of: generated letters copy its tone and design.",
  },
} as const

export function ResumeUploadCard({ kind = "resume", resume, isPendingUpload, error, onFileSelected, onOpen }: ResumeUploadCardProps) {
  const text = cardText[kind]
  const inputId = `${kind}-upload`
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {text.title}
        </CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {resume ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border">
            <FileText />
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-medium">{resume.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {/\.pdf$/i.test(resume.name) ? "PDF" : "Word"} · {formatFileSize(resume.sizeBytes)} · Updated {resume.lastUpdated}
            </p>
            {/\.pdf$/i.test(resume.name) && (
              <p className="mt-2 text-xs text-warning">Upload the Word (.docx) version to use it for each role.</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{isPendingUpload ? "Uploads when you save" : "Saved"}</Badge>
              {onOpen && (
                <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onOpen}>
                  View
                  <ExternalLink data-icon="inline-end" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{text.empty}</p>
        )}

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor={inputId}>{resume ? `Replace ${text.noun}` : `Upload ${text.noun}`}</FieldLabel>
          <Input
            id={inputId}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            aria-describedby={`${inputId}-help`}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              if (file) onFileSelected(file)
            }}
          />
          <FieldDescription id={`${inputId}-help`}>{text.help}</FieldDescription>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </Field>
      </CardContent>
    </Card>
  )
}
