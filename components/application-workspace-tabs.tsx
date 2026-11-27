"use client"

import { useState } from "react"
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, FileText, MessageSquareText, Sparkles, WandSparkles } from "lucide-react"

import { ApplicationInterviewPrep } from "@/components/application-interview-prep"
import { ApplicationMaterialsDialog, type ApplicationMaterialMode } from "@/components/application-materials-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { safeExternalUrl } from "@/lib/application-helpers"
import type { Application } from "@/lib/applications"

export function ApplicationWorkspaceTabs({ application }: { application: Application }) {
  const [materialMode, setMaterialMode] = useState<ApplicationMaterialMode | null>(null)
  const jobPostingUrl = safeExternalUrl(application.sourceUrl)

  return (
    <>
      <Tabs defaultValue="resources" className="flex flex-col gap-5">
        <TabsList variant="line" className="w-full justify-start gap-2 border-b border-border p-0 sm:w-fit">
          <TabsTrigger value="resources" className="h-11 flex-none gap-2 rounded-none px-3">
            <FileText aria-hidden="true" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="interview" className="h-11 flex-none gap-2 rounded-none px-3">
            <MessageSquareText aria-hidden="true" />
            Interview prep
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="flex flex-col gap-5">
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Application toolkit</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Put your best work forward</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Build a focused first draft for {application.role}. Your profile and the role notes help keep every suggestion relevant to you.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border shadow-none">
                  <CardHeader className="gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <WandSparkles className="size-[18px]" />
                      </span>
                      <Badge variant="outline" className="gap-1.5 font-normal"><Sparkles aria-hidden="true" className="size-3" />AI-assisted</Badge>
                    </div>
                    <div>
                      <CardTitle className="text-base">Cover letter</CardTitle>
                      <CardDescription className="mt-1.5 leading-relaxed">A personal, role-specific letter grounded in your background and the company&apos;s opportunity.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs leading-relaxed text-muted-foreground">
                    Review the draft, edit it in your own voice, then copy it into your application.
                  </CardContent>
                  <CardFooter>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setMaterialMode("cover-letter")}>
                      <WandSparkles aria-hidden="true" data-icon="inline-start" />
                      Generate cover letter
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-border shadow-none">
                  <CardHeader className="gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                        <FileText className="size-[18px]" />
                      </span>
                      <Badge variant="outline" className="gap-1.5 font-normal"><Sparkles aria-hidden="true" className="size-3" />AI-assisted</Badge>
                    </div>
                    <div>
                      <CardTitle className="text-base">Tailor your resume</CardTitle>
                      <CardDescription className="mt-1.5 leading-relaxed">Refine your summary and bring the most relevant skills forward for this position.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs leading-relaxed text-muted-foreground">
                    Keep every claim accurate. Your existing profile is the source of truth.
                  </CardContent>
                  <CardFooter>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setMaterialMode("resume")}>
                      <WandSparkles aria-hidden="true" data-icon="inline-start" />
                      Tailor resume
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Card className="border-border shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BriefcaseBusiness aria-hidden="true" className="size-4 text-muted-foreground" />
                    Role notes
                  </CardTitle>
                  <CardDescription>Use the saved details as context for your application materials.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <section aria-labelledby="role-notes-heading">
                    <h3 id="role-notes-heading" className="text-xs font-medium text-muted-foreground">Position overview</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {application.description?.trim() || "No role description has been added yet. Add a few notes about the position to make your AI-generated materials more specific."}
                    </p>
                  </section>
                  <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Application stage</p>
                      <Badge variant="outline" className="mt-2 rounded-full font-normal">{application.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Follow-up</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                        <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
                        {application.due && application.due !== "—" ? application.due : "No date set"}
                      </p>
                    </div>
                  </div>
                  {jobPostingUrl && (
                    <a href={jobPostingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
                      Open original job posting <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/15 bg-primary/[0.035] shadow-none">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles aria-hidden="true" className="size-4" />
                </div>
                <CardTitle className="text-base">Your next step</CardTitle>
                <CardDescription>One clear move keeps the momentum going.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium leading-relaxed">{application.nextStep || "Choose a next step for this application."}</p>
                {application.due && application.due !== "—" && (
                  <p className="mt-3 text-xs text-muted-foreground">Due {application.due}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interview">
          <ApplicationInterviewPrep application={application} />
        </TabsContent>
      </Tabs>

      {materialMode && (
        <ApplicationMaterialsDialog
          application={application}
          mode={materialMode}
          onOpenChange={(open) => {
            if (!open) setMaterialMode(null)
          }}
        />
      )}
    </>
  )
}
