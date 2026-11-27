"use client"

import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, ExternalLink } from "lucide-react"

import { format, parseISO } from "date-fns"

import { ApplicationStatusControl } from "@/components/application-status-control"
import { ApplicationWorkspaceTabs } from "@/components/application-workspace-tabs"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { safeExternalUrl } from "@/lib/application-helpers"

export function ApplicationDetailsPage({ applicationId }: { applicationId: string }) {
  const { applications, updateApplicationStatus } = useApplications()
  const application = applications.find((item) => item.id === applicationId)
  const jobPostingUrl = application ? safeExternalUrl(application.sourceUrl) : undefined

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="applications" />
      <main className="min-w-0 flex-1">
        {application ? (
          <ApplicationWorkspaceTabs
            application={application}
            header={(
              <>
                <Link href="/applications" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back to applications
                </Link>
                <header className="flex min-w-0 items-start gap-4 pb-6">
                  <Avatar className="mt-1 size-14 shrink-0 border border-border bg-background">
                    {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
                    <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">{application.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-muted-foreground">{application.company}</p>
                    <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-tight sm:text-[32px]">{application.role}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                      <ApplicationStatusControl application={application} onStatusChange={updateApplicationStatus} size="md" />
                      <span>{application.appliedDate ? `Applied ${format(parseISO(application.appliedDate), "MMM d, yyyy")}` : "Not applied yet"}</span>
                      {jobPostingUrl && (
                        <>
                          <span aria-hidden="true">·</span>
                          <a href={jobPostingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline">
                            View job posting <ExternalLink aria-hidden="true" className="size-3.5" />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </header>
              </>
            )}
          />
        ) : (
          <div className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
            <Link href="/applications" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to applications
            </Link>
            <Card className="mx-auto max-w-xl border-border shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BriefcaseBusiness aria-hidden="true" className="size-4" />
                Application not found
              </CardTitle>
              <CardDescription>This application is no longer available in the current session.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/applications" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Return to applications
              </Link>
            </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
