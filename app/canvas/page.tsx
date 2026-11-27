import type { Metadata } from "next"

import { CanvasPage } from "@/components/canvas-page"

export const metadata: Metadata = {
  title: "Canvas | Pursuit",
  description: "Explore product design roles and add interesting opportunities directly to your application tracker.",
}

export default function CanvasRoute() {
  return <CanvasPage />
}
