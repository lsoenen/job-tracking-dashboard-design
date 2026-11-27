"use client"

import { useState, type ReactNode } from "react"
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, FileText, MessageSquareText, Sparkles, SquareChartGantt, Users } from "lucide-react"

import { ApplicationInterviewPrep } from "@/components/application-interview-prep"
import { ApplicationNetworking } from "@/components/application-networking"
import { ApplicationOverview } from "@/components/application-overview"
import { ApplicationMaterialCard } from "@/components/application-material-card"
import { TailoredResumeCard } from "@/components/tailored-resume-card"
import { ApplicationMaterialsDialog, type ApplicationMaterialMode } from "@/components/application-materials-dialog"
import { useApplicationMaterials } from "@/components/use-application-materials"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { applicationStatusClassName, safeExternalUrl } from "@/lib/application-helpers"
import type { Application } from "@/lib/applications"
import { StatusLabel } from "@/components/status-label"

export function ApplicationWorkspaceTabs({
  application,
  header,
}: {
  application: Application
  header: ReactNode
}) {
  const [materialMode, setMaterialMode] = useState<ApplicationMaterialMode | null>(null)
  const [generateOnOpen, setGenerateOnOpen] = useState(false)
  const { materials, status: materialsStatus, saveMaterial } = useApplicationMaterials(application.id)

  function openMaterial(mode: ApplicationMaterialMode, generate: boolean) {
    setGenerateOnOpen(generate)
    setMaterialMode(mode)
  }
  const jobPostingUrl = safeExternalUrl(application.sourceUrl)

  return (
    <>
      <Tabs defaultValue="overview" className="flex flex-col gap-5">
        <div className="w-full">
          <div className="mx-auto w-full max-w-[1480px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-9">
            <div className="mx-auto max-w-[1180px]">
              {header}
              <TabsList variant="line" className="h-auto w-full justify-start gap-2 p-0 group-data-horizontal/tabs:h-auto">
                <TabsTrigger value="overview" className="h-11 flex-none gap-2 rounded-none px-3">
                  <SquareChartGantt aria-hidden="true" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="resources" className="h-11 flex-none gap-2 rounded-none px-3">
                  <FileText aria-hidden="true" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="networking" className="h-11 flex-none gap-2 rounded-none px-3">
                  <Users aria-hidden="true" />
                  Networking
                </TabsTrigger>
                <TabsTrigger value="interview" className="h-11 flex-none gap-2 rounded-none px-3">
                  <MessageSquareText aria-hidden="true" />
                  Interview prep
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8">
          <TabsContent value="overview" className="mx-auto w-full max-w-[1180px]">
            <ApplicationOverview application={application} />
          </TabsContent>
          <TabsContent value="resources" className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="grid items-start gap-4 md:grid-cols-2">
                <ApplicationMaterialCard
                  kind="cover-letter"
                  saved={materials["cover-letter"]}
                  isLoading={materialsStatus === "loading"}
                  onOpen={() => openMaterial("cover-letter", false)}
                  onGenerate={() => openMaterial("cover-letter", true)}
                />
                <TailoredResumeCard
                  application={application}
                  saved={materials.resume?.content}
                  isLoading={materialsStatus === "loading"}
                />
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
                      <Badge variant="outline" className={`mt-2 rounded-full font-normal ${applicationStatusClassName(application.status)}`}>
                        <StatusLabel status={application.status} />
                      </Badge>
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

          <TabsContent value="interview" className="mx-auto w-full max-w-[1180px]">
            <ApplicationInterviewPrep application={application} />
          </TabsContent>
          <TabsContent value="networking" className="mx-auto w-full max-w-[1180px]">
            <ApplicationNetworking application={application} />
          </TabsContent>
        </div>
      </Tabs>

      {materialMode && (
        <ApplicationMaterialsDialog
          application={application}
          mode={materialMode}
          saved={materials}
          onSave={saveMaterial}
          generateOnOpen={generateOnOpen}
          onOpenChange={(open) => {
            if (!open) setMaterialMode(null)
          }}
        />
      )}
    </>
  )
}
