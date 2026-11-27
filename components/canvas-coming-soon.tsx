"use client"

import { useState, type FormEvent } from "react"
import { CircleCheck, LayoutGrid, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useJobProfile } from "@/components/job-profile-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

type Interest = { email: string; note: string }

export function CanvasComingSoon({ existing }: { existing: Interest | null }) {
  const { email: accountEmail } = useJobProfile()
  const [saved, setSaved] = useState<Interest | null>(existing)
  const [editing, setEditing] = useState(existing === null)
  const [email, setEmail] = useState(existing?.email ?? accountEmail)
  const [note, setNote] = useState(existing?.note ?? "")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const interest = { email: email.trim(), note: note.trim() }
    if (!interest.email) return

    setSubmitting(true)
    const { error } = await createClient()
      .from("feature_interest")
      .upsert({ feature: "canvas", ...interest }, { onConflict: "user_id,feature" })
    setSubmitting(false)

    if (error) {
      console.error("Failed to save Canvas interest:", error.message)
      toast.error("Couldn't save your email. Please try again.")
      return
    }
    setSaved(interest)
    setEditing(false)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar activePage="canvas" />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <section aria-labelledby="page-title" className="mx-auto max-w-xl pt-6 sm:pt-12">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted/40">
                <LayoutGrid aria-hidden="true" className="size-5 text-muted-foreground" />
              </span>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <h1 id="page-title" className="mt-5 text-[28px] font-medium tracking-tight sm:text-[32px]">Canvas</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We&apos;re building Canvas: open roles from companies&apos; own job boards, ranked by how well they fit your
              profile, so you can add the good ones straight to your tracker.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Interested, or want to help shape it? Leave your email and we&apos;ll reach out.
            </p>

            <Card className="mt-6">
              <CardContent>
                {saved && !editing ? (
                  <div role="status" className="flex flex-col gap-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <CircleCheck aria-hidden="true" className="size-4 text-success" />
                      You&apos;re on the list
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll be in touch at <span className="font-medium text-foreground">{saved.email}</span>.
                      {saved.note && " Thanks for sharing your thoughts."}
                    </p>
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                        Update my details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="canvas-interest-email">Email</FieldLabel>
                        <Input
                          id="canvas-interest-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="canvas-interest-note">What would make Canvas useful to you?</FieldLabel>
                        <Textarea
                          id="canvas-interest-note"
                          value={note}
                          maxLength={2000}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Roles, companies or filters you'd want to see"
                        />
                        <FieldDescription>Optional</FieldDescription>
                      </Field>
                      <div>
                        <Button type="submit" disabled={submitting || !email.trim()}>
                          {submitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
                          {saved ? "Save changes" : "Count me in"}
                        </Button>
                      </div>
                    </FieldGroup>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}
