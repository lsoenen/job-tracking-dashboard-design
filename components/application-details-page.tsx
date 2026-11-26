"use client"

import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ExternalLink } from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useApplications } from "@/components/applications-provider"
import { applicationStatusClassName, safeExternalUrl } from "@/lib/application-helpers"

export function ApplicationDetailsPage({ applicationId }: { applicationId: string }) {
  const { applications } = useApplications()
  const application = applications.find((item) => item.id === applicationId)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="applications" />
      <main className="mx-auto min-w-0 w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <Link href="/applications" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to applications
        </Link>

        {application ? (
          <div className="mx-auto flex max-w-5xl flex-col gap-5">
            <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className={`size-12 shrink-0 border border-border ${application.company === "Vercel" ? "bg-black" : "bg-background"}`}>
                  {application.logo && <AvatarImage src={application.logo} alt={`${application.company} logo`} className="object-contain p-1" />}
                  <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">{application.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-muted-foreground">{application.company}</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{application.role}</h1>
                </div>
              </div>
              <Badge variant="outline" className={`w-fit rounded-full px-3 py-1.5 text-sm font-normal ${applicationStatusClassName(application.status)}`}>
                {application.status}
              </Badge>
            </header>

            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <Card className="border-border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Application details</CardTitle>
                  <CardDescription>Everything currently recorded for this role.</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Company</dt>
                      <dd className="mt-1 text-sm font-medium">{application.company}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Job title</dt>
                      <dd className="mt-1 text-sm font-medium">{application.role}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Stage</dt>
                      <dd className="mt-1 text-sm font-medium">{application.status}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Follow-up date</dt>
                      <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                        <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
                        {application.due && application.due !== "—" ? application.due : "No date set"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card className="border-border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Next step</CardTitle>
                  <CardDescription>Keep the application moving.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4 text-sm font-medium leading-relaxed">
                    {application.nextStep || "No next step set"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Role information</CardTitle>
                <CardDescription>Notes and source details saved with this application.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <section aria-labelledby="role-notes-title">
                  <h2 id="role-notes-title" className="text-xs font-medium text-muted-foreground">Notes</h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {application.description?.trim() || "No additional role notes have been added yet."}
                  </p>
                </section>
                <section aria-labelledby="posting-link-title">
                  <h2 id="posting-link-title" className="text-xs font-medium text-muted-foreground">Job posting</h2>
                  {safeExternalUrl(application.sourceUrl) ? (
                    <a
                      href={safeExternalUrl(application.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Open original job posting
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">No job posting link added.</p>
                  )}
                </section>
              </CardContent>
            </Card>
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
