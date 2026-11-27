import type { Metadata } from "next"
import Link from "next/link"

import { requestPasswordReset } from "@/app/auth/actions"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Reset password | Pursuit" }

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="Reset your password"
      description="We'll email you a link to choose a new one."
      submitLabel="Send reset link"
      action={requestPasswordReset}
      fields={["email"]}
      footer={
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Back to log in
        </Link>
      }
    />
  )
}
