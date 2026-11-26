import { ApplicationsTable } from "@/components/applications-table"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export function ApplicationsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="applications" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 id="page-title" className="text-[28px] font-medium tracking-tight sm:text-[32px]">Applications</h1>
              <p className="mt-2 text-sm text-muted-foreground">Update a stage here to surface interviews in your prep space. Status changes and new entries are session-only in this prototype.</p>
            </div>
          </section>
          <ApplicationsTable />
        </main>
      </div>
    </div>
  )
}
