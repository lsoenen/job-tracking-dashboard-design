"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, ExternalLink, Pencil, Trash2, X } from "lucide-react"

import { useApplications } from "@/components/applications-provider"
import { Input } from "@/components/ui/input"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { applicationStatusClassName, safeExternalUrl } from "@/lib/application-helpers"
import { furthestStageLabels, type Application } from "@/lib/applications"
import { StatusLabel } from "@/components/status-label"

export function ApplicationPreviewPanel({
  application,
  onClose,
  onEdit,
  onDelete,
}: {
  application: Application
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const jobPostingUrl = safeExternalUrl(application.sourceUrl)
  const { updateApplication } = useApplications()
  const savedNextStep = application.nextStep === "—" ? "" : application.nextStep
  const [nextStep, setNextStep] = useState(savedNextStep)

  // Pick up changes saved elsewhere (e.g. the edit panel)
  useEffect(() => setNextStep(savedNextStep), [savedNextStep])

  function saveNextStep() {
    if (nextStep.trim() !== savedNextStep) updateApplication(application.id, { nextStep: nextStep.trim() })
  }

  return (
    <aside
      aria-labelledby="application-preview-title"
      className="min-w-0 border-t border-border bg-background lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:border-l lg:border-t-0"
    >
      <div className="flex items-start gap-3 border-b border-border p-5">
        <Avatar className={`size-11 shrink-0 border border-border bg-background`}>
          {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
          <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">{application.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{application.company}</p>
          <h2 id="application-preview-title" className="mt-1 text-lg font-semibold leading-snug tracking-tight">
            <Link href={`/applications/${encodeURIComponent(application.id)}`} className="inline-flex items-start gap-1 text-foreground underline-offset-4 hover:text-primary hover:underline">
              {application.role}
              <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0" />
            </Link>
          </h2>
          <Badge variant="outline" className={`mt-2 rounded-full px-2.5 py-1 text-xs font-normal ${applicationStatusClassName(application.status)}`}>
            <StatusLabel status={application.status} />
          </Badge>
          {application.status === "Not moving forward" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Reached: {furthestStageLabels[application.interviewStage ?? "none"].toLowerCase()}
              {!application.interviewStage && (
                <>
                  {" · "}
                  <button type="button" onClick={onEdit} className="underline underline-offset-2 hover:text-foreground">
                    Got further?
                  </button>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit application" title="Edit" onClick={onEdit}>
            <Pencil aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close application preview" title="Close" onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <section aria-labelledby="preview-overview-title">
          <h3 id="preview-overview-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Application overview
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <dt className="text-xs text-muted-foreground">Company</dt>
              <dd className="mt-1 truncate text-sm font-medium">{application.company}</dd>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <dt>
                <label htmlFor="preview-follow-up" className="text-xs text-muted-foreground">Follow-up</label>
              </dt>
              <dd className="mt-1">
                <Input
                  id="preview-follow-up"
                  type="date"
                  value={application.dueDate ?? ""}
                  onChange={(event) => updateApplication(application.id, { dueDate: event.currentTarget.value })}
                  className="h-7 px-1.5 text-sm font-medium"
                />
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="preview-next-step-title">
          <h3 id="preview-next-step-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <label htmlFor="preview-next-step">Next step</label>
          </h3>
          <Input
            id="preview-next-step"
            value={nextStep}
            maxLength={200}
            placeholder="e.g. Follow up with recruiter"
            onChange={(event) => setNextStep(event.currentTarget.value)}
            onBlur={saveNextStep}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur()
            }}
            className="mt-3 border-primary/15 bg-primary/[0.04] text-sm font-medium"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">Saves when you click away. Shows on your dashboard.</p>
        </section>

        <section aria-labelledby="preview-role-details-title">
          <h3 id="preview-role-details-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Role details
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {application.description?.trim() || "No additional role notes have been added yet."}
          </p>
          {jobPostingUrl ? (
            <a
              href={jobPostingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View job posting
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No job posting link added.</p>
          )}
        </section>

        <Link
          href={`/applications/${encodeURIComponent(application.id)}`}
          className="inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View full application
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Edit details
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onDelete}>
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Delete application
          </Button>
        </div>
      </div>
    </aside>
  )
}
