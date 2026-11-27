"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, ChevronUp, Copy, Download, LoaderCircle, RefreshCw, Sparkles, WandSparkles } from "lucide-react"
import { toast } from "sonner"

import { DraftIllustration } from "@/components/application-material-card"
import { useJobProfile } from "@/components/job-profile-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { Application } from "@/lib/applications"
import type { GeneratedCoverLetter } from "@/lib/generated-cover-letter"

function isGenerated(value: unknown): value is GeneratedCoverLetter {
  return Boolean(value && typeof value === "object" && (value as GeneratedCoverLetter).format === "docx")
}

function startDownload(url: string) {
  // The link carries a download filename, so this saves the file instead of opening it
  window.location.assign(url)
}

export function CoverLetterCard({
  application,
  saved,
  isLoading,
  onGenerated,
}: {
  application: Application
  /** The saved "cover-letter" material (older text drafts are ignored) */
  saved?: unknown
  isLoading: boolean
  /** Called with each new letter, so the page keeps it */
  onGenerated?: (letter: GeneratedCoverLetter) => void
}) {
  const { profile } = useJobProfile()
  const [latest, setLatest] = useState<GeneratedCoverLetter | null>(null)
  const [isWriting, setIsWriting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasSample = Boolean(profile.coverLetter?.path && /\.docx$/i.test(profile.coverLetter.path))

  // Newest wins: whatever the page has saved, or a letter written in this card
  const savedLetter = isGenerated(saved) ? saved : null
  const current = latest && (!savedLetter || latest.generatedAt >= savedLetter.generatedAt) ? latest : (savedLetter ?? latest)

  async function write() {
    setIsWriting(true)
    setError(null)
    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      })
      const payload = (await response.json()) as { letter?: GeneratedCoverLetter; url?: string; error?: string }
      if (!response.ok || !payload.letter) throw new Error(payload.error || "The cover letter couldn't be written.")
      setLatest(payload.letter)
      onGenerated?.(payload.letter)
      setExpanded(true)
      toast.success("Cover letter ready", {
        action: payload.url ? { label: "Download", onClick: () => startDownload(payload.url!) } : undefined,
      })
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : "The cover letter couldn't be written.")
    } finally {
      setIsWriting(false)
    }
  }

  async function download() {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/cover-letter?applicationId=${encodeURIComponent(application.id)}`)
      const payload = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !payload.url) throw new Error(payload.error)
      startDownload(payload.url)
    } catch {
      toast.error("The download couldn't start. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  async function copyText() {
    if (!current) return
    try {
      await navigator.clipboard.writeText(`${current.salutation}\n\n${current.text}`)
      toast.success("Cover letter copied")
    } catch {
      toast.error("Copy isn’t available here. Download the letter instead.")
    }
  }

  const paragraphs = current?.text.split(/\n{2,}/) ?? []

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <WandSparkles className="size-[18px]" />
          </span>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <Sparkles aria-hidden="true" className="size-3" />
            AI-assisted
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">Cover letter</CardTitle>
          <CardDescription className="mt-1.5 leading-relaxed">
            Written in the voice and layout of your sample letter, drawing on your resume and this posting.
          </CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <div aria-label="Loading" className="h-44 animate-pulse rounded-lg bg-muted/50" />
        </CardContent>
      ) : isWriting ? (
        <CardContent>
          <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Writing your cover letter…</p>
            <p className="text-xs text-muted-foreground">Studying your sample&apos;s voice, your resume, and the posting. This can take up to two minutes.</p>
          </div>
        </CardContent>
      ) : current ? (
        <>
          <CardContent className="flex flex-col gap-3">
            <div className={`relative rounded-lg border border-border bg-muted/20 p-4 text-sm leading-relaxed ${expanded ? "" : "max-h-48 overflow-hidden"}`}>
              <p className="mb-3">{current.salutation}</p>
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
              ))}
              {!expanded && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-lg bg-gradient-to-t from-card to-transparent" />}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" className="px-0 hover:bg-transparent" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
                {expanded ? <ChevronUp data-icon="inline-start" aria-hidden="true" /> : <ChevronDown data-icon="inline-start" aria-hidden="true" />}
                {expanded ? "Show less" : "Read the full letter"}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(current.generatedAt))}
              </span>
            </div>
            {current.summary && <p className="text-xs leading-relaxed text-muted-foreground">{current.summary}</p>}
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button type="button" className="flex-1" onClick={() => void download()} disabled={isDownloading}>
              {isDownloading ? <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" /> : <Download data-icon="inline-start" aria-hidden="true" />}
              Download .docx
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyText()}>
              <Copy data-icon="inline-start" aria-hidden="true" />
              Copy text
            </Button>
            <Button type="button" variant="ghost" onClick={() => void write()} disabled={!hasSample} title="Write a new version">
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
                <DraftIllustration kind="cover-letter" />
              </EmptyMedia>
              {hasSample ? (
                <>
                  <EmptyTitle className="text-sm font-medium">No cover letter generated yet</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Writes a letter for {application.company} in the voice and layout of {profile.coverLetter?.name ?? "your sample"}.
                  </EmptyDescription>
                </>
              ) : (
                <>
                  <EmptyTitle className="text-sm font-medium">Add a sample cover letter</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Upload a cover letter you&apos;ve written before (Word, .docx). New letters copy its voice, style, and layout.
                  </EmptyDescription>
                </>
              )}
            </EmptyHeader>
            <EmptyContent>
              {hasSample ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => void write()}>
                  <WandSparkles data-icon="inline-start" aria-hidden="true" />
                  Write my cover letter
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
