import { CanvasPage } from "@/components/canvas-page"
import { familiesForHeadline, roleFamilies } from "@/lib/jobs/roles"
import { canvasJobColumns, canvasJobFromRow, type CanvasJobRow } from "@/lib/jobs/types"
import { createClient } from "@/lib/supabase/server"

/** The full Canvas job board. Shown by ./page.tsx once Canvas launches. */
export async function CanvasBoard() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const { data: profile } = await supabase
    .from("profiles")
    .select("headline")
    .eq("id", claims?.claims?.sub ?? "")
    .maybeSingle()

  const headline = (profile?.headline as string | undefined) ?? ""
  const matchedFamilies = familiesForHeadline(headline)
  // Nothing matches yet (e.g. empty headline): show every family we support
  const families = matchedFamilies.length > 0 ? matchedFamilies : roleFamilies

  const { data, error } = await supabase
    .from("jobs")
    .select(canvasJobColumns)
    .in("role_family", families.map((family) => family.id))
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(600)

  if (error) console.error("Failed to load Canvas jobs:", error.message)

  return (
    <CanvasPage
      jobs={((data ?? []) as CanvasJobRow[]).map(canvasJobFromRow)}
      familyLabels={families.map((family) => family.label)}
      headlineMatched={matchedFamilies.length > 0}
      loadFailed={Boolean(error)}
    />
  )
}
