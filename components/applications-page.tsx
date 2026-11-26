import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { ApplicationsTable } from "@/components/applications-table"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Badge } from "@/components/ui/badge"
import { applications } from "@/lib/applications"

export function ApplicationsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="applications" />
      <main className="mx-auto min-w-0 w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to overview
        </Link>
        <section aria-labelledby="page-title" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Applications</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your active applications, organized in one place.</p>
          </div>
          <Badge variant="outline" className="h-9 w-fit gap-2 rounded-md px-3 text-sm font-normal text-foreground">
            {applications.length} active
          </Badge>
        </section>
        <ApplicationsTable />
      </main>
    </div>
  )
}
