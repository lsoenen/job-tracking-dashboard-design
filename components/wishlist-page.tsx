"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Bookmark, Check, ExternalLink, FileText, PenLine, UsersRound } from "lucide-react"

import { ApplicationContactsDialog } from "@/components/application-contacts-dialog"
import { ApplicationMaterialsDialog, type ApplicationMaterialMode } from "@/components/application-materials-dialog"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApplications } from "@/components/applications-provider"
import { canvasJobs } from "@/lib/canvas-jobs"
import { safeExternalUrl } from "@/lib/application-helpers"
import type { Application, ApplicationStatus } from "@/lib/applications"
import { cn } from "@/lib/utils"

function companyInitials(company: string) {
  return company
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

const readinessTasks: Array<{ id: string; label: string; mode?: ApplicationMaterialMode }> = [
  { id: "tailor-resume", label: "Tailor resume", mode: "resume" },
  { id: "write-cover-letter", label: "Write a cover letter", mode: "cover-letter" },
  { id: "contact-hiring-manager", label: "Reach out to hiring manager" },
  { id: "contact-recruiter", label: "Reach out to recruiter" },
]

type ApplicationReadinessChecklistProps = {
  application: Application
  completedTaskIds: string[]
  onTaskChange: (taskId: string, isComplete: boolean) => void
  onPrepare: (mode: ApplicationMaterialMode) => void
  onContacts: () => void
}

function ApplicationReadinessChecklist({ application, completedTaskIds, onTaskChange, onPrepare, onContacts }: ApplicationReadinessChecklistProps) {
  const completedCount = readinessTasks.filter((task) => completedTaskIds.includes(task.id)).length
  const progressPercent = Math.round((completedCount / readinessTasks.length) * 100)
  const isReady = completedCount === readinessTasks.length
  const applicationLabel = `${application.role} at ${application.company}`

  return (
    <section aria-label={`Application readiness checklist for ${applicationLabel}`} className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Readiness checklist</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isReady ? "Every prep step is complete." : `${completedCount} of ${readinessTasks.length} steps complete`}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-full",
            isReady ? "border-success/25 bg-success/10 text-success" : "border-border bg-background text-muted-foreground",
          )}
        >
          {isReady ? <><Check aria-hidden="true" className="mr-1 size-3.5" />Ready to apply</> : "Preparing"}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div
          role="progressbar"
          aria-label={`${applicationLabel} application readiness`}
          aria-valuemin={0}
          aria-valuemax={readinessTasks.length}
          aria-valuenow={completedCount}
          className={cn("h-1.5 flex-1 overflow-hidden rounded-full", isReady ? "bg-success/10" : "bg-primary/10")}
        >
          <div
            className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", isReady ? "bg-success" : "bg-primary")}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
          {completedCount}/{readinessTasks.length}
        </span>
      </div>
      <ul className="mt-2 list-none divide-y divide-border/70">
        {readinessTasks.map((task) => {
          const isComplete = completedTaskIds.includes(task.id)
          const checkboxId = `${application.id}-readiness-${task.id}`

          return (
            <li key={task.id} className="flex min-h-9 items-center gap-2 py-1.5">
              <input
                id={checkboxId}
                type="checkbox"
                checked={isComplete}
                onChange={(event) => onTaskChange(task.id, event.currentTarget.checked)}
                aria-label={`${task.label} for ${applicationLabel}`}
                className="size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <label
                htmlFor={checkboxId}
                className={cn("min-w-0 flex-1 cursor-pointer truncate text-xs leading-5", isComplete && "text-muted-foreground line-through")}
              >
                {task.label}
              </label>
              {task.id === "contact-hiring-manager" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2"
                  aria-haspopup="dialog"
                  aria-label={`Open high-leverage contacts for ${applicationLabel}`}
                  onClick={onContacts}
                >
                  <UsersRound aria-hidden="true" data-icon="inline-start" />
                  Contacts
                </Button>
              )}
              {task.mode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2"
                  aria-label={`${isComplete ? "Open" : "Prepare"} ${task.mode === "resume" ? "resume draft" : "cover letter draft"} for ${applicationLabel}`}
                  onClick={() => task.mode && onPrepare(task.mode)}
                >
                  {task.mode === "resume" ? <FileText aria-hidden="true" data-icon="inline-start" /> : <PenLine aria-hidden="true" data-icon="inline-start" />}
                  {isComplete ? "Open" : "Prepare"}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {isReady && (
        <p className="mt-2 border-t border-border/70 pt-2 text-xs leading-relaxed text-success">
          Your prep is complete. Paste your tailored materials into the employer&apos;s application site.
        </p>
      )}
    </section>
  )
}

type WishlistCardProps = {
  application: Application
  completedTaskIds: string[]
  onPrepare: (application: Application, mode: ApplicationMaterialMode) => void
  onContacts: (application: Application) => void
  onReadinessTaskChange: (applicationId: string, taskId: string, isComplete: boolean) => void
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void
}

function WishlistCard({ application, completedTaskIds, onPrepare, onContacts, onReadinessTaskChange, onStatusChange }: WishlistCardProps) {
  const companyUrl = safeExternalUrl(application.companyUrl)
  return (
    <Card className="flex h-full flex-col border-border shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className={`size-10 shrink-0 rounded-full border-0 after:hidden ${application.company === "Vercel" ? "bg-black" : "bg-muted"}`}>
            {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="rounded-full object-contain" />}
            <AvatarFallback className="rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {application.initials || companyInitials(application.company)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{application.company}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{application.role}</CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 rounded-full border-primary/20 bg-primary/5 text-primary">
          Interested
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {application.description || `Explore the ${application.role} opportunity at ${application.company}.`}
        </p>
        {companyUrl && (
          <a
            href={companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View company on LinkedIn
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        )}
        <ApplicationReadinessChecklist
          application={application}
          completedTaskIds={completedTaskIds}
          onTaskChange={(taskId, isComplete) => onReadinessTaskChange(application.id, taskId, isComplete)}
          onPrepare={(mode) => onPrepare(application, mode)}
          onContacts={() => onContacts(application)}
        />
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Select
            value="Interested"
            onValueChange={(value) => {
              if (value === "Applied") onStatusChange(application.id, value)
            }}
          >
            <SelectTrigger size="sm" aria-label={`Update status for ${application.role} at ${application.company}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="Interested">Interested</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Copy finished drafts, then paste them into any employer&apos;s application form.
        </p>
      </CardFooter>
    </Card>
  )
}

type MaterialRequest = {
  application: Application
  mode: ApplicationMaterialMode
} | null

export function WishlistPage() {
  const { applications, readinessProgress, setReadinessTaskCompletion, updateApplicationStatus } = useApplications()
  const [materialRequest, setMaterialRequest] = useState<MaterialRequest>(null)
  const [contactsRequest, setContactsRequest] = useState<Application | null>(null)
  const interestedApplications = useMemo(
    () => applications.filter((application) => application.status === "Interested"),
    [applications],
  )

  function openMaterial(application: Application, mode: ApplicationMaterialMode) {
    setMaterialRequest({ application, mode })
  }

  function openContacts(application: Application) {
    setContactsRequest(application)
  }

  const contacts = contactsRequest
    ? canvasJobs.find((job) => job.id === contactsRequest.canvasJobId)?.contacts ?? []
    : []

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="wishlist" />
      <main className="mx-auto min-w-0 w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <section aria-labelledby="page-title" className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Wishlist</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Use each role&apos;s checklist to strengthen your application. Draft and copy materials here, mark outreach complete, then apply when you&apos;re ready.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
            <Bookmark aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="font-medium">{interestedApplications.length}</span>
            <span className="text-muted-foreground">saved roles</span>
          </div>
        </section>

        {interestedApplications.length > 0 ? (
          <section aria-label="Interested roles" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {interestedApplications.map((application) => (
              <WishlistCard
                key={application.id}
                application={application}
                completedTaskIds={readinessProgress[application.id] ?? []}
                onPrepare={openMaterial}
                onContacts={openContacts}
                onReadinessTaskChange={setReadinessTaskCompletion}
                onStatusChange={updateApplicationStatus}
              />
            ))}
          </section>
        ) : (
          <Card className="border-dashed border-border shadow-none">
            <CardContent className="p-6 sm:p-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Bookmark aria-hidden="true" /></EmptyMedia>
                  <EmptyTitle>Your wishlist is empty</EmptyTitle>
                  <EmptyDescription>
                    Save roles from Canvas as Interested. They&apos;ll stay here until you&apos;re ready to move them into Applications.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link href="/canvas" className={buttonVariants({ variant: "default" })}>Explore Canvas</Link>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        )}
      </main>
      {contactsRequest && (
        <ApplicationContactsDialog
          application={contactsRequest}
          contacts={contacts}
          onOpenChange={(open) => {
            if (!open) setContactsRequest(null)
          }}
        />
      )}
      {materialRequest && (
        <ApplicationMaterialsDialog
          key={`${materialRequest.application.id}:${materialRequest.mode}`}
          application={materialRequest.application}
          mode={materialRequest.mode}
          onCopied={() =>
            setReadinessTaskCompletion(
              materialRequest.application.id,
              materialRequest.mode === "resume" ? "tailor-resume" : "write-cover-letter",
              true,
            )
          }
          onOpenChange={(open) => {
            if (!open) setMaterialRequest(null)
          }}
        />
      )}
    </div>
  )
}
