import type { Metadata } from "next"

import { CanvasComingSoon } from "@/components/canvas-coming-soon"
import { createClient } from "@/lib/supabase/server"
import { CanvasBoard } from "./canvas-board"

// Canvas is paused while we gather interest. Set to true to bring the full job board back.
const canvasLaunched = false

export const metadata: Metadata = {
  title: "Canvas | Pursuit",
  description: canvasLaunched
    ? "Open roles from company job boards, ranked by how well they fit your profile."
    : "Canvas is coming soon. Leave your email to hear when it's ready or help shape it.",
}

export default async function CanvasRoute() {
  if (canvasLaunched) return <CanvasBoard />

  // Show the person's earlier sign-up, if they've already left one
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("feature_interest")
    .select("email, note")
    .eq("feature", "canvas")
    .maybeSingle()

  if (error) console.error("Failed to load Canvas interest:", error.message)

  return <CanvasComingSoon existing={data ? { email: data.email as string, note: data.note as string } : null} />
}
