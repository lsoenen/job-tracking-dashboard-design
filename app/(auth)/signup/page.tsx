import type { Metadata } from "next"
import Link from "next/link"

import { signUp } from "@/app/auth/actions"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Create account | Pursuit" }

export default function SignupPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Track every application, see what's working, and know what's next."
      submitLabel="Create account"
      action={signUp}
      fields={["fullName", "email", "password"]}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Log in
          </Link>
        </>
      }
    />
  )
}
