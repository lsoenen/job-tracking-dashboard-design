"use client"

import { useState } from "react"
import { LoaderCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useApplications } from "@/components/applications-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Application } from "@/lib/applications"

export function DeleteApplicationDialog({
  application,
  onOpenChange,
  onDeleted,
}: {
  /** The application to delete; null keeps the dialog closed */
  application: Application | null
  onOpenChange: (open: boolean) => void
  onDeleted?: (applicationId: string) => void
}) {
  const { deleteApplication } = useApplications()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!application) return
    setIsDeleting(true)
    const deleted = await deleteApplication(application.id)
    setIsDeleting(false)

    if (deleted) {
      toast(`Deleted ${application.role} at ${application.company}`)
      onDeleted?.(application.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={application !== null} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
      {application && (
        <DialogContent className="sm:max-w-md">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Delete this application?</DialogTitle>
              <DialogDescription>
                {application.role} at {application.company} will be removed from your tracker, along with its status history
                and interview practice. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isDeleting} />}>Cancel</DialogClose>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <LoaderCircle data-icon="inline-start" aria-hidden="true" className="animate-spin" />
              ) : (
                <Trash2 data-icon="inline-start" aria-hidden="true" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
