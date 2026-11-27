"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Bookmark, FileText, PenLine } from "lucide-react"

import { ApplicationMaterialsDialog, type ApplicationMaterialMode } from "@/components/application-materials-dialog"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApplications } from "@/components/applications-provider"
import type { Application, ApplicationStatus } from "@/lib/applications"

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

type WishlistCardProps = {
  application: Application
  onPrepare: (application: Application, mode: ApplicationMaterialMode) => void
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void
}

function WishlistCard({ application, onPrepare, onStatusChange }: WishlistCardProps) {
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
      <CardFooter className="flex flex-col items-stretch gap-2 border-t border-border sm:flex-row">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onPrepare(application, "resume")}>
          <FileText aria-hidden="true" data-icon="inline-start" />
          Tailor resume
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => onPrepare(application, "cover-letter")}>
          <PenLine aria-hidden="true" data-icon="inline-start" />
          Cover letter
        </Button>
      </CardFooter>
    </Card>
  )
}

type MaterialRequest = {
  application: Application
  mode: ApplicationMaterialMode
} | null

export function WishlistPage() {
  const { applications, updateApplicationStatus } = useApplications()
  const [materialRequest, setMaterialRequest] = useState<MaterialRequest>(null)
  const interestedApplications = useMemo(
    () => applications.filter((application) => application.status === "Interested"),
    [applications],
  )

  function openMaterial(application: Application, mode: ApplicationMaterialMode) {
    setMaterialRequest({ application, mode })
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="wishlist" />
      <main className="mx-auto min-w-0 w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <section aria-labelledby="page-title" className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Wishlist</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Keep promising roles here while you prepare. Tailor your resume or draft a cover letter, then move a role to Applied when you&apos;re ready.
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
                onPrepare={openMaterial}
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
      {materialRequest && (
        <ApplicationMaterialsDialog
          key={`${materialRequest.application.id}:${materialRequest.mode}`}
          application={materialRequest.application}
          mode={materialRequest.mode}
          onOpenChange={(open) => {
            if (!open) setMaterialRequest(null)
          }}
        />
      )}
    </div>
  )
}
