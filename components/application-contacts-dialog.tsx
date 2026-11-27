"use client"

import { ArrowUpRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CanvasJobContact } from "@/lib/canvas-jobs"
import type { Application } from "@/lib/applications"

type ApplicationContactsDialogProps = {
  application: Application
  contacts: CanvasJobContact[]
  onOpenChange: (open: boolean) => void
}

function getLinkedInPeopleSearchUrl(query: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`
}

export function ApplicationContactsDialog({ application, contacts, onOpenChange }: ApplicationContactsDialogProps) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <div className="min-h-0 overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>High-leverage contacts</DialogTitle>
            <DialogDescription>
              {contacts.length > 0
                ? `${application.role} at ${application.company}. These are illustrative profiles; LinkedIn links search for current people in similar roles.`
                : `Search LinkedIn for hiring managers, recruiters, and teammates at ${application.company}.`}
            </DialogDescription>
          </DialogHeader>
          {contacts.length > 0 ? (
            <ul className="mt-5 flex list-none flex-col gap-2 p-0">
              {contacts.map((contact) => (
                <li key={contact.name} className="flex min-w-0 items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                  <Avatar className="size-10 shrink-0 overflow-hidden border border-border bg-muted">
                    <AvatarImage
                      src={contact.avatar}
                      alt={`Illustrative portrait of ${contact.name}`}
                      className="absolute z-0 max-w-none rounded-none object-fill"
                      style={{
                        width: "300%",
                        height: "300%",
                        left: `-${contact.avatarIndex * 100}%`,
                        top: `-${contact.avatarCropTop * 3}%`,
                      }}
                    />
                    <AvatarFallback>{contact.name.split(/\s+/).map((part) => part[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">{contact.name}</p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">{contact.title}</p>
                  </div>
                  <a
                    href={getLinkedInPeopleSearchUrl(contact.linkedinSearchQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Search LinkedIn for ${contact.title} at ${application.company}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    LinkedIn
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/20 p-4">
              <p className="text-sm font-medium">No suggested contacts yet</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Search LinkedIn for people connected to this role and company.
              </p>
              <a
                href={getLinkedInPeopleSearchUrl(`${application.company} ${application.role} hiring manager recruiter`)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Search LinkedIn for hiring managers and recruiters at ${application.company}`}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Search LinkedIn
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
