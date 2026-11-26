import { FileText } from "lucide-react"

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
  resume: ResumeAttachment
  error: string
  onFileSelected: (file: File) => void
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
}

export function ResumeUploadCard({ resume, error, onFileSelected }: ResumeUploadCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Resume
        </CardTitle>
        <CardDescription>Use the sample resume or choose a PDF to update its preview details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border">
            <FileText />
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-medium">{resume.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF · {formatFileSize(resume.sizeBytes)} · Updated {resume.lastUpdated}
            </p>
            <Badge className="mt-3" variant="outline">
              {resume.isPlaceholder ? "Sample placeholder" : "Selected for this session"}
            </Badge>
          </div>
        </div>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="resume-upload">Replace resume</FieldLabel>
          <Input
            id="resume-upload"
            type="file"
            accept="application/pdf,.pdf"
            aria-describedby="resume-upload-help"
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              if (file) onFileSelected(file)
            }}
          />
          <FieldDescription id="resume-upload-help">
            PDF only, up to 10 MB. Demo mode shows the selected file details but does not upload or store the document.
          </FieldDescription>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </Field>
      </CardContent>
    </Card>
  )
}
