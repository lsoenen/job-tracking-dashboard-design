import type { Metadata } from "next"

import { CanvasPage } from "@/components/canvas-page"

export const metadata: Metadata = {
  title: "Canvas | Pursuit",
  description: "Explore mock product design roles from multiple job boards, see where each was posted, and add opportunities to your application list.",
}

export default function CanvasRoute() {
  return <CanvasPage />
}
