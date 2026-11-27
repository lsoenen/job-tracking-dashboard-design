"use client"

import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, ExternalLink } from "lucide-react"

import { ApplicationWorkspaceTabs } from "@/components/application-workspace-tabs"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useApplications } from "@/components/applications-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { applicationStatusClassName, safeExternalUrl } from "@/lib/application-helpers"

export function ApplicationDetailsPage({ applicationId }: { applicationId: string }) {
  const { applications } = useApplications()
  const application = applications.find((item) => item.id === applicationId)
  const jobPostingUrl = application ? safeExternalUrl(application.sourceUrl) : undefined

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="applications" />
      <main className="mx-auto min-w-0 w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <Link href="/applications" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to applications
        </Link>

        {application ? (
          <div className="mx-auto max-w-[1180px]">
            <ApplicationWorkspaceTabs
              application={application}
              header={(
                <header className="flex flex-col justify-between gap-5 pb-6 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className={`size-14 shrink-0 border border-border ${application.company === "Vercel" ? "bg-black" : "bg-background"}`}>
                      {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
                      <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">{application.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-muted-foreground">{application.company}</p>
                      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{application.role}</h1>
                      <p className="mt-1 text-sm text-muted-foreground">Your dedicated workspace for this application</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {jobPostingUrl && (
                      <a href={jobPostingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
                        View job posting <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    )}
                    <Badge variant="outline" className={`w-fit rounded-full px-3 py-1.5 text-sm font-normal ${applicationStatusClassName(application.status)}`}>
                      {application.status}
                    </Badge>
                  </div>
                </header>
              )}
            />
          </div>
        ) : (
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
        )}
      </main>
    </div>
  )
}
