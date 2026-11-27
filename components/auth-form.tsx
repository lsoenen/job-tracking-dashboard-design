"use client"

import { useActionState } from "react"
import Link from "next/link"
import { LoaderCircle } from "lucide-react"

import type { AuthFormState } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthField = "fullName" | "email" | "password" | "newPassword"

type AuthFormProps = {
  title: string
  description: string
  submitLabel: string
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
  fields: AuthField[]
  next?: string
  initialError?: string
  footer?: React.ReactNode
  showForgotPassword?: boolean
}

export function AuthForm({
  title,
  description,
  submitLabel,
  action,
  fields,
  next,
  initialError,
  footer,
  showForgotPassword,
}: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, { error: initialError })
  const sent = Boolean(state.message)

  return (
    <Card className="w-full max-w-[400px] border-border shadow-none">
      <CardHeader>
        <h1 className="text-xl font-medium tracking-tight">{title}</h1>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p role="status" className="rounded-md border border-border bg-muted/40 p-4 text-sm">
            {state.message}
          </p>
        ) : (
          <form action={formAction} noValidate={false}>
            {next && <input type="hidden" name="next" value={next} />}
            <FieldGroup>
              {fields.includes("fullName") && (
                <Field>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <Input id="fullName" name="fullName" autoComplete="name" required />
                </Field>
              )}
              {fields.includes("email") && (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={state.email}
                    required
                  />
                </Field>
              )}
              {fields.includes("password") && (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    {showForgotPassword && (
                      <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={showForgotPassword ? "current-password" : "new-password"}
                    minLength={showForgotPassword ? undefined : 8}
                    required
                  />
                  {!showForgotPassword && <FieldDescription>At least 8 characters.</FieldDescription>}
                </Field>
              )}
              {fields.includes("newPassword") && (
                <Field>
                  <FieldLabel htmlFor="password">New password</FieldLabel>
                  <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                  <FieldDescription>At least 8 characters.</FieldDescription>
                </Field>
              )}
              {state.error && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />}
                {submitLabel}
              </Button>
            </FieldGroup>
          </form>
        )}
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  )
}
