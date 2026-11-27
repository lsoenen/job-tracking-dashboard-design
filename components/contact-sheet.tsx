"use client"

import { useEffect, useState, type FormEvent } from "react"
import { LoaderCircle, Save } from "lucide-react"

import type { ContactDraft } from "@/components/use-application-contacts"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  contactRelationships,
  outreachLabels,
  outreachStatuses,
  relationshipLabels,
  type ContactRelationship,
  type OutreachStatus,
} from "@/lib/networking"

export const emptyContactDraft: ContactDraft = {
  name: "",
  title: "",
  relationship: "teammate",
  linkedinUrl: "",
  email: "",
  outreachStatus: "not-contacted",
  lastContactedOn: "",
  notes: "",
}

function todayIsoDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function ContactSheet({
  open,
  mode,
  initial,
  company,
  onOpenChange,
  onSave,
}: {
  open: boolean
  mode: "add" | "edit"
  initial: ContactDraft
  company: string
  onOpenChange: (open: boolean) => void
  onSave: (draft: ContactDraft) => Promise<boolean>
}) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(initial)
      setError(null)
    }
    // Reset each time the panel opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function update<Key extends keyof ContactDraft>(key: Key, value: ContactDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!draft.name.trim()) {
      setError("Add the person's name.")
      return
    }
    let linkedinUrl = draft.linkedinUrl?.trim()
    if (linkedinUrl) {
      try {
        const url = new URL(/^https?:\/\//i.test(linkedinUrl) ? linkedinUrl : `https://${linkedinUrl}`)
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad")
        linkedinUrl = url.toString()
      } catch {
        setError("Enter a valid LinkedIn link, or leave it blank.")
        return
      }
    }
    const email = draft.email?.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address, or leave it blank.")
      return
    }

    setIsSaving(true)
    const saved = await onSave({ ...draft, linkedinUrl, email })
    setIsSaving(false)
    if (saved) onOpenChange(false)
    else setError("This contact couldn't be saved. Please try again.")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === "add" ? "Add a contact" : "Edit contact"}</SheetTitle>
          <SheetDescription>Someone at {company} connected to this role.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                <Input id="contact-name" value={draft.name} onChange={(event) => update("name", event.target.value)} maxLength={120} autoFocus />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-title">Title</FieldLabel>
                <Input
                  id="contact-title"
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="e.g. Design Manager, Payments"
                  maxLength={160}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-relationship">Connection to this role</FieldLabel>
                <Select value={draft.relationship} onValueChange={(value) => value && update("relationship", value as ContactRelationship)}>
                  <SelectTrigger id="contact-relationship" className="w-full">
                    <SelectValue>{(value: ContactRelationship) => relationshipLabels[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {contactRelationships.map((relationship) => (
                        <SelectItem key={relationship} value={relationship}>{relationshipLabels[relationship]}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-linkedin">LinkedIn profile</FieldLabel>
                <Input
                  id="contact-linkedin"
                  type="url"
                  value={draft.linkedinUrl ?? ""}
                  onChange={(event) => update("linkedinUrl", event.target.value)}
                  placeholder="https://www.linkedin.com/in/…"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                <Input id="contact-email" type="email" value={draft.email ?? ""} onChange={(event) => update("email", event.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="contact-status">Outreach</FieldLabel>
                  <Select
                    value={draft.outreachStatus}
                    onValueChange={(value) => {
                      if (!value) return
                      update("outreachStatus", value as OutreachStatus)
                      if (value !== "not-contacted" && !draft.lastContactedOn) update("lastContactedOn", todayIsoDate())
                    }}
                  >
                    <SelectTrigger id="contact-status" className="w-full">
                      <SelectValue>{(value: OutreachStatus) => outreachLabels[value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {outreachStatuses.map((status) => (
                          <SelectItem key={status} value={status}>{outreachLabels[status]}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact-last">Last contacted</FieldLabel>
                  <Input
                    id="contact-last"
                    type="date"
                    value={draft.lastContactedOn ?? ""}
                    max={todayIsoDate()}
                    onChange={(event) => update("lastContactedOn", event.target.value)}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="contact-notes">Notes</FieldLabel>
                <Textarea
                  id="contact-notes"
                  value={draft.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  rows={4}
                  maxLength={3000}
                />
                <FieldDescription>How you know them, what you talked about, when to follow up.</FieldDescription>
              </Field>
            </FieldGroup>
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" disabled={isSaving} />}>Cancel</SheetClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" /> : <Save data-icon="inline-start" aria-hidden="true" />}
              {mode === "add" ? "Add contact" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
