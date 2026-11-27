import type { Metadata } from "next"
import Link from "next/link"

import { signIn } from "@/app/auth/actions"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Log in | Pursuit" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  return (
    <AuthForm
      title="Welcome back"
      description="Log in to pick up where you left off."
      submitLabel="Log in"
      action={signIn}
      fields={["email", "password"]}
      next={next}
      showForgotPassword
      initialError={error === "link" ? "That link is invalid or has expired. Log in or request a new one." : undefined}
      footer={
        <>
          New to Pursuit?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </>
      }
    />
  )
}
