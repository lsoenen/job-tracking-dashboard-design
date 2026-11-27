"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Ellipsis, ExternalLink, Pencil, Plus, RefreshCw, Search, Trash2, UserRound, Users } from "lucide-react"
import { toast } from "sonner"

import { ContactSheet, emptyContactDraft } from "@/components/contact-sheet"
import { useApplicationContacts, type ContactDraft } from "@/components/use-application-contacts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { companyInitials } from "@/lib/data"
import type { Application } from "@/lib/applications"
import {
  linkedInPeopleSearchUrl,
  outreachLabels,
  outreachStatuses,
  relationshipLabels,
  searchKeywords,
  webPeopleSearchUrl,
  type Contact,
  type ContactRelationship,
  type NetworkingPlan,
  type NetworkingTarget,
  type OutreachStatus,
} from "@/lib/networking"

const relationshipClassName: Record<ContactRelationship, string> = {
  "hiring-manager": "border-primary/20 bg-primary/5 text-primary",
  recruiter: "border-info/20 bg-info/5 text-info",
  teammate: "border-success/20 bg-success/5 text-success",
  partner: "border-border bg-muted text-muted-foreground",
  leader: "border-warning/25 bg-warning/10 text-warning",
  referral: "border-success/20 bg-success/5 text-success",
  other: "border-border bg-muted text-muted-foreground",
}

const outreachClassName: Record<OutreachStatus, string> = {
  "not-contacted": "text-muted-foreground",
  "reached-out": "text-warning",
  replied: "text-primary",
  referred: "text-success",
  "no-response": "text-muted-foreground",
}

function todayIsoDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function formatDate(value?: string) {
  if (!value) return undefined
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`))
}

function SuggestionRow({
  target,
  company,
  addedContact,
  onAdd,
}: {
  target: NetworkingTarget
  company: string
  addedContact?: Contact
  onAdd: () => void
}) {
  const keywords = searchKeywords(company, target)

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`font-normal ${relationshipClassName[target.relationship]}`}>
          {target.namedPerson ? "Named in posting" : relationshipLabels[target.relationship]}
        </Badge>
        {addedContact && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Check aria-hidden="true" className="size-3.5" />
            Added {addedContact.name}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium leading-snug">
          {target.namedPerson ? `${target.namedPerson} · ${target.role}` : target.role}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{target.why}</p>
        {target.evidence && (
          <blockquote className="mt-2 border-l-2 border-primary/30 pl-3 text-xs italic leading-relaxed text-muted-foreground">
            “{target.evidence}”
          </blockquote>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={linkedInPeopleSearchUrl(keywords)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
        >
          <Search aria-hidden="true" className="size-3.5" />
          Search LinkedIn
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a
          href={webPeopleSearchUrl(company, target.namedPerson ?? target.role)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Search Google for LinkedIn profiles. Works without signing in."
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          Google
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2.5 text-xs" onClick={onAdd}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add person
        </Button>
      </div>
    </li>
  )
}

export function ApplicationNetworking({ application }: { application: Application }) {
  const { contacts, status: contactsStatus, addContact, updateContact, deleteContact } = useApplicationContacts(application.id)
  const [plan, setPlan] = useState<NetworkingPlan | null>(null)
  const [planStatus, setPlanStatus] = useState<"loading" | "ready" | "error" | "refreshing">("loading")
  const [sheet, setSheet] = useState<{ mode: "add" | "edit"; contactId?: string; initial: ContactDraft } | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)

  const loadPlan = useCallback(
    async (refresh: boolean) => {
      setPlanStatus(refresh ? "refreshing" : "loading")
      try {
        const response = await fetch("/api/networking-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: application.id, refresh }),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const { plan: next } = (await response.json()) as { plan: NetworkingPlan }
        setPlan(next)
        setPlanStatus("ready")
        if (refresh) toast.success("Suggestions refreshed")
      } catch (error) {
        console.error("Loading networking plan failed:", error)
        setPlanStatus("error")
      }
    },
    [application.id],
  )

  useEffect(() => {
    void loadPlan(false)
  }, [loadPlan])

  function contactFor(target: NetworkingTarget) {
    return contacts.find(
      (contact) =>
        (target.namedPerson && contact.name.toLowerCase() === target.namedPerson.toLowerCase()) ||
        (contact.relationship === target.relationship && contact.title.toLowerCase() === target.role.toLowerCase()),
    )
  }

  function openAdd(target?: NetworkingTarget) {
    setSheet({
      mode: "add",
      initial: {
        ...emptyContactDraft,
        name: target?.namedPerson ?? "",
        title: target && target.role !== "Named in the posting" ? target.role : "",
        relationship: target?.relationship ?? "teammate",
      },
    })
  }

  function setOutreach(contact: Contact, outreachStatus: OutreachStatus) {
    void updateContact(contact.id, {
      outreachStatus,
      ...(outreachStatus !== "not-contacted" && !contact.lastContactedOn ? { lastContactedOn: todayIsoDate() } : {}),
    })
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Who to look for */}
      <Card className="border-border shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Who to look for</CardTitle>
              <CardDescription className="mt-1 leading-relaxed">
                Roles at {application.company} tied to this posting, and what in the posting points to them.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Refresh suggestions"
              title="Refresh suggestions"
              disabled={planStatus === "loading" || planStatus === "refreshing"}
              onClick={() => void loadPlan(true)}
            >
              <RefreshCw aria-hidden="true" className={planStatus === "refreshing" ? "animate-spin" : undefined} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {planStatus === "loading" ? (
            <div aria-label="Loading suggestions" className="flex flex-col gap-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex animate-pulse flex-col gap-2">
                  <span className="h-4 w-24 rounded bg-muted" />
                  <span className="h-4 w-2/3 rounded bg-muted" />
                  <span className="h-3 w-full rounded bg-muted/70" />
                </div>
              ))}
            </div>
          ) : planStatus === "error" && !plan ? (
            <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
              Suggestions couldn&apos;t be loaded.
              <Button type="button" size="sm" variant="outline" onClick={() => void loadPlan(false)}>
                Try again
              </Button>
            </div>
          ) : plan ? (
            <>
              <ol className="flex flex-col divide-y divide-border">
                {plan.targets.map((target) => (
                  <SuggestionRow
                    key={target.id}
                    target={target}
                    company={application.company}
                    addedContact={contactFor(target)}
                    onAdd={() => openAdd(target)}
                  />
                ))}
              </ol>
              <p className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                {plan.generatedWith === "ai" ? "Refined with AI from the posting" : "Based on the job title and posting"}. Searches open
                in your browser, so you see real, current people in your own network. Nothing is collected automatically.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Your contacts */}
      <Card className="border-border shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Your contacts{contacts.length > 0 ? ` (${contacts.length})` : ""}
              </CardTitle>
              <CardDescription className="mt-1">People you&apos;ve found for this role and where your outreach stands.</CardDescription>
            </div>
            {contacts.length > 0 && (
              <Button type="button" size="sm" variant="outline" onClick={() => openAdd()}>
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contactsStatus === "loading" ? (
            <div aria-label="Loading contacts" className="h-32 animate-pulse rounded-lg bg-muted/50" />
          ) : contactsStatus === "error" ? (
            <p className="text-sm text-muted-foreground">Contacts couldn&apos;t be loaded. Refresh the page to try again.</p>
          ) : contacts.length === 0 ? (
            <Empty className="gap-3 border border-dashed border-border bg-muted/20 p-6">
              <EmptyHeader className="gap-1">
                <EmptyMedia variant="icon" className="size-11 rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle className="text-sm font-medium">No contacts yet</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Use a search on the left to find the hiring manager or a teammate, then add them here to track your outreach.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" variant="secondary" size="sm" onClick={() => openAdd()}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Add contact
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {contacts.map((contact) => (
                <li key={contact.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="mt-0.5 size-9 shrink-0 border border-border">
                    <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                      {companyInitials(contact.name) || <UserRound aria-hidden="true" className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      {contact.linkedinUrl ? (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-w-0 items-center gap-1 truncate text-sm font-medium hover:text-primary hover:underline"
                        >
                          <span className="truncate">{contact.name}</span>
                          <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
                          <span className="sr-only">(LinkedIn, opens in a new tab)</span>
                        </a>
                      ) : (
                        <span className="truncate text-sm font-medium">{contact.name}</span>
                      )}
                      <Badge variant="outline" className={`font-normal ${relationshipClassName[contact.relationship]}`}>
                        {relationshipLabels[contact.relationship]}
                      </Badge>
                    </div>
                    {contact.title && <p className="mt-0.5 truncate text-xs text-muted-foreground">{contact.title}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <label className="sr-only" htmlFor={`outreach-${contact.id}`}>Outreach status for {contact.name}</label>
                      <select
                        id={`outreach-${contact.id}`}
                        value={contact.outreachStatus}
                        onChange={(event) => setOutreach(contact, event.target.value as OutreachStatus)}
                        className={`h-7 rounded-md border border-input bg-background px-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${outreachClassName[contact.outreachStatus]}`}
                      >
                        {outreachStatuses.map((status) => (
                          <option key={status} value={status}>{outreachLabels[status]}</option>
                        ))}
                      </select>
                      {contact.lastContactedOn && (
                        <span className="text-muted-foreground">Last contact {formatDate(contact.lastContactedOn)}</span>
                      )}
                      {contact.email && (
                        <span className="truncate text-muted-foreground" title={contact.email}>{contact.email}</span>
                      )}
                    </div>
                    {contact.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{contact.notes}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={`Actions for ${contact.name}`} className="text-muted-foreground" />
                      }
                    >
                      <Ellipsis aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-36">
                      <DropdownMenuItem
                        onClick={() =>
                          setSheet({
                            mode: "edit",
                            contactId: contact.id,
                            initial: {
                              name: contact.name,
                              title: contact.title,
                              relationship: contact.relationship,
                              linkedinUrl: contact.linkedinUrl ?? "",
                              email: contact.email ?? "",
                              outreachStatus: contact.outreachStatus,
                              lastContactedOn: contact.lastContactedOn ?? "",
                              notes: contact.notes,
                            },
                          })
                        }
                      >
                        <Pencil aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleting(contact)}
                        className="text-destructive data-highlighted:bg-destructive/10 [&_svg]:text-destructive"
                      >
                        <Trash2 aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ContactSheet
        open={sheet !== null}
        mode={sheet?.mode ?? "add"}
        initial={sheet?.initial ?? emptyContactDraft}
        company={application.company}
        onOpenChange={(open) => !open && setSheet(null)}
        onSave={async (draft) => {
          if (!sheet) return false
          const saved = sheet.mode === "add" ? await addContact(draft) : await updateContact(sheet.contactId!, draft)
          if (saved) toast.success(sheet.mode === "add" ? `Added ${draft.name.trim()}` : "Contact updated")
          return saved
        }}
      />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        {deleting && (
          <DialogContent className="sm:max-w-md">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>Remove {deleting.name}?</DialogTitle>
                <DialogDescription>They&apos;ll be removed from this application&apos;s contacts, along with your notes.</DialogDescription>
              </DialogHeader>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  const contact = deleting
                  setDeleting(null)
                  if (await deleteContact(contact.id)) toast(`Removed ${contact.name}`)
                }}
              >
                <Trash2 data-icon="inline-start" aria-hidden="true" />
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

