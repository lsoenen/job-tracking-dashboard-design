import type { Metadata } from "next"

import { CanvasPage } from "@/components/canvas-page"

export const metadata: Metadata = {
  title: "Canvas | Pursuit",
  description: "Discover product design roles matched to your profile and add opportunities to your application list.",
}

export default function CanvasRoute() {
  return <CanvasPage />
}
