"use client"

import { Copy, FileText, PenLine, Sparkles, WandSparkles } from "lucide-react"
import { toast } from "sonner"

import type { CoverLetterContent, MaterialKind, ResumeContent } from "@/components/use-application-materials"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

const copy = {
  "cover-letter": {
    title: "Cover letter",
    description: "A personal, role-specific letter grounded in your background and the company's opportunity.",
    emptyTitle: "No cover letter generated yet",
    emptyDescription: "Generate a first draft from your profile and this role, then edit it in your own voice.",
    generate: "Generate cover letter",
  },
  resume: {
    title: "Tailored resume",
    description: "A summary and skills list that bring your most relevant experience forward for this role.",
    emptyTitle: "No tailored resume yet",
    emptyDescription: "Tailor your summary and skills to this role. Your profile stays the source of truth.",
    generate: "Tailor resume",
  },
} as const

/** A stack of pages with a sparkle, drawn in the theme's primary color */
export function DraftIllustration({ kind }: { kind: MaterialKind }) {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true" className="h-20 w-auto text-primary">
      <rect x="30" y="14" width="52" height="68" rx="6" className="fill-primary/5 stroke-primary/20" strokeWidth="1.5" transform="rotate(-8 56 48)" />
      <rect x="36" y="10" width="52" height="68" rx="6" className="fill-background stroke-primary/30" strokeWidth="1.5" />
      {kind === "cover-letter" ? (
        <>
          <rect x="44" y="22" width="22" height="4" rx="2" className="fill-primary/35" />
          <rect x="44" y="33" width="36" height="3" rx="1.5" className="fill-primary/15" />
          <rect x="44" y="40" width="34" height="3" rx="1.5" className="fill-primary/15" />
          <rect x="44" y="47" width="36" height="3" rx="1.5" className="fill-primary/15" />
          <rect x="44" y="54" width="24" height="3" rx="1.5" className="fill-primary/15" />
          <path d="M44 66c4-4 7 3 11-1s6 2 9-1" className="stroke-primary/40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="50" cy="25" r="6" className="fill-primary/20" />
          <rect x="60" y="21" width="20" height="3" rx="1.5" className="fill-primary/35" />
          <rect x="60" y="27" width="14" height="3" rx="1.5" className="fill-primary/15" />
          <rect x="44" y="39" width="36" height="3" rx="1.5" className="fill-primary/15" />
          <rect x="44" y="46" width="30" height="3" rx="1.5" className="fill-primary/15" />
          <rect x="44" y="58" width="12" height="6" rx="3" className="fill-primary/20" />
          <rect x="58" y="58" width="14" height="6" rx="3" className="fill-primary/20" />
          <rect x="44" y="67" width="16" height="6" rx="3" className="fill-primary/20" />
        </>
      )}
      <path d="M94 16l2.2 5.8L102 24l-5.8 2.2L94 32l-2.2-5.8L86 24l5.8-2.2z" className="fill-primary" />
      <path d="M22 62l1.4 3.6L27 67l-3.6 1.4L22 72l-1.4-3.6L17 67l3.6-1.4z" className="fill-primary/50" />
    </svg>
  )
}

function previewText(kind: MaterialKind, content: CoverLetterContent | ResumeContent) {
  if (kind === "cover-letter") return (content as CoverLetterContent).text
  const resume = content as ResumeContent
  return [resume.summary, resume.skills && `Skills: ${resume.skills}`].filter(Boolean).join("\n\n")
}

function fullText(kind: MaterialKind, content: CoverLetterContent | ResumeContent) {
  if (kind === "cover-letter") return (content as CoverLetterContent).text
  const resume = content as ResumeContent
  return `${resume.summary}\n\nCore skills\n${resume.skills}`.trim()
}

export function ApplicationMaterialCard({
  kind,
  saved,
  isLoading,
  onOpen,
  onGenerate,
}: {
  kind: MaterialKind
  saved?: { content: CoverLetterContent | ResumeContent; updatedAt: string }
  isLoading: boolean
  onOpen: () => void
  onGenerate: () => void
}) {
  const text = copy[kind]
  const Icon = kind === "cover-letter" ? WandSparkles : FileText

  async function copyDraft() {
    if (!saved) return
    try {
      await navigator.clipboard.writeText(fullText(kind, saved.content))
      toast.success(kind === "cover-letter" ? "Cover letter copied" : "Resume content copied")
    } catch {
      toast.error("Copy isn’t available here. Open the draft and copy it manually.")
    }
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-[18px]" />
          </span>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <Sparkles aria-hidden="true" className="size-3" />
            AI-assisted
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">{text.title}</CardTitle>
          <CardDescription className="mt-1.5 leading-relaxed">{text.description}</CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <div aria-label="Loading draft" className="flex h-44 animate-pulse flex-col gap-2 rounded-lg bg-muted/50 p-4">
            <span className="h-3 w-2/3 rounded bg-muted" />
            <span className="h-3 w-full rounded bg-muted" />
            <span className="h-3 w-5/6 rounded bg-muted" />
          </div>
        </CardContent>
      ) : saved ? (
        <>
          <CardContent className="flex flex-col gap-2">
            <p className="line-clamp-5 whitespace-pre-line rounded-lg border border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              {previewText(kind, saved.content)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Saved{" "}
              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
                new Date(saved.updatedAt),
              )}
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onOpen}>
              <PenLine aria-hidden="true" data-icon="inline-start" />
              Open draft
            </Button>
            <Button type="button" variant="ghost" onClick={copyDraft} aria-label={`Copy ${text.title.toLowerCase()}`}>
              <Copy aria-hidden="true" data-icon="inline-start" />
              Copy
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent>
          <Empty className="gap-3 border border-dashed border-border bg-muted/20 p-5">
            <EmptyHeader className="gap-1">
              <EmptyMedia>
                <DraftIllustration kind={kind} />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-medium">{text.emptyTitle}</EmptyTitle>
              <EmptyDescription className="text-xs">{text.emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" variant="secondary" size="sm" onClick={onGenerate}>
                <WandSparkles aria-hidden="true" data-icon="inline-start" />
                {text.generate}
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      )}
    </Card>
  )
}
