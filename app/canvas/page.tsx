import type { Metadata } from "next"

import { CanvasPage } from "@/components/canvas-page"

export const metadata: Metadata = {
  title: "Canvas | Pursuit",
  description: "Explore product design roles, save interesting opportunities to your Wishlist, and prepare application materials.",
}

export default function CanvasRoute() {
  return <CanvasPage />
}
