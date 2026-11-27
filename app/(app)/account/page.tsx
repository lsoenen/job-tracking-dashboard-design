import type { Metadata } from "next"

import { AccountPage } from "@/components/account-page"

export const metadata: Metadata = {
  title: "Account | Pursuit",
  description: "Manage your job profile and resume details for more relevant role recommendations.",
}

export default function AccountRoute() {
  return <AccountPage />
}
