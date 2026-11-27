import type { Metadata } from "next"

import { updatePassword } from "@/app/auth/actions"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Choose a new password | Pursuit" }

export default function ResetPasswordPage() {
  return (
    <AuthForm
      title="Choose a new password"
      description="You'll be signed in once it's saved."
      submitLabel="Save password"
      action={updatePassword}
      fields={["newPassword"]}
    />
  )
}
