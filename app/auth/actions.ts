"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AuthFormState = { error?: string; message?: string; email?: string }

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

/** Only allow redirects to paths inside this app */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/"
}

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const protocol = headerList.get("x-forwarded-proto") ?? "https"
  return `${protocol}://${host}`
}

export async function signIn(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email")
  const password = formData.get("password")
  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter your email and password.", email }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email first — check your inbox for the link."
        : "That email and password don't match."
    return { error: message, email }
  }

  redirect(safeNext(field(formData, "next")))
}

export async function signUp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const fullName = field(formData, "fullName")
  const email = field(formData, "email")
  const password = formData.get("password")

  if (!email || typeof password !== "string") return { error: "Enter your email and a password.", email }
  if (password.length < 8) return { error: "Use a password with at least 8 characters.", email }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
    },
  })

  if (error) {
    console.error("Sign-up failed:", error.message)
    return { error: error.code === "weak_password" ? error.message : "We couldn't create your account. Please try again.", email }
  }

  // If email confirmation is turned off in Supabase, the user is signed in immediately
  if (data.session) redirect("/")

  return { message: `Check ${email} for a link to confirm your account.`, email }
}

export async function requestPasswordReset(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email")
  if (!email) return { error: "Enter your email address." }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  })
  if (error) console.error("Password reset request failed:", error.message)

  // Same message either way so this form can't be used to check who has an account
  return { message: `If ${email} has an account, a reset link is on its way.`, email }
}

export async function updatePassword(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = formData.get("password")
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Use a password with at least 8 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: "Your reset link may have expired. Request a new one and try again." }

  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
