"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, ChevronUp, Download, FileText, LoaderCircle, RefreshCw, Sparkles, WandSparkles } from "lucide-react"
import { toast } from "sonner"

import { DraftIllustration } from "@/components/application-material-card"
import { useJobProfile } from "@/components/job-profile-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { Application } from "@/lib/applications"
import type { TailoredResume } from "@/lib/tailored-resume"

function isTailored(value: unknown): value is TailoredResume {
  return Boolean(value && typeof value === "object" && (value as TailoredResume).format === "docx")
}

function startDownload(url: string) {
  // The link carries a download filename, so this saves the file instead of opening it
  window.location.assign(url)
}

export function TailoredResumeCard({
  application,
  saved,
  isLoading,
}: {
  application: Application
  /** The saved "resume" material, which may be an older text draft */
  saved?: unknown
  isLoading: boolean
}) {
  const { profile } = useJobProfile()
  const [resume, setResume] = useState<TailoredResume | null>(isTailored(saved) ? saved : null)
  const [isTailoring, setIsTailoring] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChanges, setShowChanges] = useState(false)
  const current = resume ?? (isTailored(saved) ? saved : null)
  const hasWordResume = Boolean(profile.resume?.path && /\.docx$/i.test(profile.resume.path))

  async function tailor() {
    setIsTailoring(true)
    setError(null)
    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      })
      const payload = (await response.json()) as { resume?: TailoredResume; url?: string; error?: string }
      if (!response.ok || !payload.resume) throw new Error(payload.error || "Your resume couldn't be tailored.")
      setResume(payload.resume)
      setShowChanges(true)
      toast.success("Tailored resume ready", {
        action: payload.url ? { label: "Download", onClick: () => startDownload(payload.url!) } : undefined,
      })
    } catch (tailorError) {
      setError(tailorError instanceof Error ? tailorError.message : "Your resume couldn't be tailored.")
    } finally {
      setIsTailoring(false)
    }
  }

  async function download() {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/resume/tailor?applicationId=${encodeURIComponent(application.id)}`)
      const payload = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !payload.url) throw new Error(payload.error)
      startDownload(payload.url)
    } catch {
      toast.error("The download couldn't start. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const reworded = current?.changes.filter((change) => change.kind === "reworded") ?? []
  const moved = current?.changes.filter((change) => change.kind === "moved") ?? []

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-[18px]" />
          </span>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <Sparkles aria-hidden="true" className="size-3" />
            AI-assisted
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">Tailored resume</CardTitle>
          <CardDescription className="mt-1.5 leading-relaxed">
            Your own Word resume, reworded and reordered toward this posting&apos;s responsibilities and qualifications. Same design.
          </CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <div aria-label="Loading" className="h-44 animate-pulse rounded-lg bg-muted/50" />
        </CardContent>
      ) : isTailoring ? (
        <CardContent>
          <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Tailoring your resume…</p>
            <p className="text-xs text-muted-foreground">Reading the posting and your resume. This can take up to two minutes.</p>
          </div>
        </CardContent>
      ) : current ? (
        <>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{current.fileName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {reworded.length} line{reworded.length === 1 ? "" : "s"} reworded
                  {moved.length > 0 ? ` · ${moved.length} bullet group${moved.length === 1 ? "" : "s"} reordered` : ""} ·{" "}
                  {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(current.generatedAt))}
                </p>
              </div>
            </div>
            {current.summary && <p className="text-xs leading-relaxed text-muted-foreground">{current.summary}</p>}

            <Button type="button" variant="ghost" size="sm" className="w-fit px-0 hover:bg-transparent" aria-expanded={showChanges} onClick={() => setShowChanges((value) => !value)}>
              {showChanges ? <ChevronUp data-icon="inline-start" aria-hidden="true" /> : <ChevronDown data-icon="inline-start" aria-hidden="true" />}
              What changed ({current.changes.length})
            </Button>
            {showChanges && (
              <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto rounded-lg border border-border p-3 text-xs leading-relaxed">
                {reworded.map((change, index) => (
                  <li key={`r${index}`} className="flex flex-col gap-1">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/50">{change.before}</span>
                    <span>{change.after}</span>
                  </li>
                ))}
                {moved.map((change, index) => (
                  <li key={`m${index}`} className="text-muted-foreground">
                    <span className="font-medium text-foreground">Moved to the top of its section:</span> {change.after}
                  </li>
                ))}
              </ul>
            )}
            {current.skipped > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {current.skipped} suggestion{current.skipped === 1 ? " was" : "s were"} skipped for adding facts that aren&apos;t in your resume or making a line long enough to change the layout.
              </p>
            )}
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="button" className="flex-1" onClick={() => void download()} disabled={isDownloading}>
              {isDownloading ? <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" /> : <Download data-icon="inline-start" aria-hidden="true" />}
              Download .docx
            </Button>
            <Button type="button" variant="ghost" onClick={() => void tailor()} disabled={!hasWordResume} title="Tailor again from your current resume">
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Redo
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent>
          <Empty className="gap-3 border border-dashed border-border bg-muted/20 p-5">
            <EmptyHeader className="gap-1">
              <EmptyMedia>
                <DraftIllustration kind="resume" />
              </EmptyMedia>
              {hasWordResume ? (
                <>
                  <EmptyTitle className="text-sm font-medium">No tailored resume yet</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Creates a copy of {profile.resume?.name ?? "your resume"} matched to this role. Your original isn&apos;t changed.
                  </EmptyDescription>
                </>
              ) : (
                <>
                  <EmptyTitle className="text-sm font-medium">Add your resume as a Word file</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Tailoring keeps your exact design, so it needs the .docx version of your resume (from Word, or Google Docs → Download → .docx).
                  </EmptyDescription>
                </>
              )}
            </EmptyHeader>
            <EmptyContent>
              {hasWordResume ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => void tailor()}>
                  <WandSparkles data-icon="inline-start" aria-hidden="true" />
                  Tailor my resume
                </Button>
              ) : (
                <Link href="/account" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Upload on Account
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              )}
            </EmptyContent>
          </Empty>
          {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
        </CardContent>
      )}
    </Card>
  )
}
