"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { contactColumns, contactFromRow, type Contact, type ContactRow } from "@/lib/networking"
import { createClient } from "@/lib/supabase/client"

export type ContactDraft = Omit<Contact, "id" | "applicationId">

function toRow(draft: Partial<ContactDraft>) {
  const row: Record<string, unknown> = {}
  const text = (value: string | undefined) => (value === undefined ? undefined : value.trim() || null)
  if (draft.name !== undefined) row.name = draft.name.trim()
  if (draft.title !== undefined) row.title = draft.title.trim()
  if (draft.relationship !== undefined) row.relationship = draft.relationship
  if (draft.linkedinUrl !== undefined) row.linkedin_url = text(draft.linkedinUrl)
  if (draft.email !== undefined) row.email = text(draft.email)
  if (draft.outreachStatus !== undefined) row.outreach_status = draft.outreachStatus
  if (draft.lastContactedOn !== undefined) row.last_contacted_on = draft.lastContactedOn || null
  if (draft.notes !== undefined) row.notes = draft.notes.trim()
  return row
}

/** Contacts for one application, with optimistic saves */
export function useApplicationContacts(applicationId: string) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const contactsRef = useRef(contacts)
  contactsRef.current = contacts

  useEffect(() => {
    let cancelled = false
    setStatus("loading")

    createClient()
      .from("application_contacts")
      .select(contactColumns)
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true })
      .then(({ data, error }: { data: ContactRow[] | null; error: { message: string } | null }) => {
        if (cancelled) return
        if (error) {
          console.error("Loading contacts failed:", error.message)
          setStatus("error")
          return
        }
        setContacts((data ?? []).map(contactFromRow))
        setStatus("ready")
      })

    return () => {
      cancelled = true
    }
  }, [applicationId])

  const addContact = useCallback(
    async (draft: ContactDraft) => {
      const { data, error } = await createClient()
        .from("application_contacts")
        .insert({ application_id: applicationId, ...toRow(draft) })
        .select(contactColumns)
        .single()

      if (error) {
        console.error("Adding contact failed:", error.message)
        toast.error("Couldn't save this contact. Please try again.")
        return false
      }
      setContacts((current) => [...current, contactFromRow(data as ContactRow)])
      return true
    },
    [applicationId],
  )

  const updateContact = useCallback(async (contactId: string, patch: Partial<ContactDraft>) => {
    const previous = contactsRef.current.find((contact) => contact.id === contactId)
    if (!previous) return false
    setContacts((current) => current.map((contact) => (contact.id === contactId ? { ...contact, ...patch } : contact)))

    const { data, error } = await createClient()
      .from("application_contacts")
      .update(toRow(patch))
      .eq("id", contactId)
      .select(contactColumns)
      .single()

    if (error) {
      console.error("Updating contact failed:", error.message)
      setContacts((current) => current.map((contact) => (contact.id === contactId ? previous : contact)))
      toast.error("Couldn't update this contact. Your change was undone.")
      return false
    }
    setContacts((current) => current.map((contact) => (contact.id === contactId ? contactFromRow(data as ContactRow) : contact)))
    return true
  }, [])

  const deleteContact = useCallback(async (contactId: string) => {
    const previous = contactsRef.current
    setContacts((current) => current.filter((contact) => contact.id !== contactId))

    const { error } = await createClient().from("application_contacts").delete().eq("id", contactId)
    if (error) {
      console.error("Deleting contact failed:", error.message)
      setContacts(previous)
      toast.error("Couldn't delete this contact. Please try again.")
      return false
    }
    return true
  }, [])

  return { contacts, status, addContact, updateContact, deleteContact }
}
