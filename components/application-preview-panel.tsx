import Link from "next/link"
import { ArrowRight, ArrowUpRight, CalendarDays, ExternalLink, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { applicationStatusClassName, safeExternalUrl } from "@/lib/application-helpers"
import type { Application } from "@/lib/applications"

export function ApplicationPreviewPanel({
  application,
  onClose,
}: {
  application: Application
  onClose: () => void
}) {
  const jobPostingUrl = safeExternalUrl(application.sourceUrl)

  return (
    <aside
      aria-labelledby="application-preview-title"
      className="min-w-0 border-t border-border bg-background lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:border-l lg:border-t-0"
    >
      <div className="flex items-start gap-3 border-b border-border p-5">
        <Avatar className={`size-11 shrink-0 border border-border ${application.company === "Vercel" ? "bg-black" : "bg-background"}`}>
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
            {application.status}
          </Badge>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close application preview" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
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
              <dt className="text-xs text-muted-foreground">Follow-up</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                {application.due && application.due !== "—" ? application.due : "No date set"}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="preview-next-step-title">
          <h3 id="preview-next-step-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Next step
          </h3>
          <p className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.04] p-4 text-sm font-medium leading-relaxed">
            {application.nextStep || "No next step set"}
          </p>
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
      </div>
    </aside>
  )
}
