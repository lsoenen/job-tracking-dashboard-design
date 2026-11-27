import type { Metadata } from "next"

import { WishlistPage } from "@/components/wishlist-page"

export const metadata: Metadata = {
  title: "Wishlist | Pursuit",
  description: "Keep job opportunities you’re interested in, prepare application materials, and move ready roles into Applications.",
}

export default function WishlistRoute() {
  return <WishlistPage />
}
