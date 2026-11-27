import { redirect } from "next/navigation"

import { ApplicationsProvider } from "@/components/applications-provider"
import { JobProfileProvider } from "@/components/job-profile-provider"
import { loadUserData } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

// Always render with the signed-in user's latest data
export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const data = await loadUserData(supabase)

  if (!data) redirect("/login")

  return (
    <ApplicationsProvider
      key={data.userId}
      initialApplications={data.applications}
      initialStatusEvents={data.statusEvents}
      initialInterviewProgress={data.interviewProgress}
    >
      <JobProfileProvider
        userId={data.userId}
        email={data.email}
        initialProfile={data.profile}
        initialAvatar={data.avatar}
      >
        {children}
      </JobProfileProvider>
    </ApplicationsProvider>
  )
}
