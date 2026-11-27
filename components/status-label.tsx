import { statusLabel, type ApplicationStatus } from "@/lib/applications"

/** Status text for pills and badges. "Awaiting response" gets a small pending dot. */
export function StatusLabel({ status }: { status: ApplicationStatus }) {
  return (
    <>
      {status === "Applied" && (
        <span aria-hidden="true" className="relative inline-flex size-1.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-40 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      <span className="truncate">{statusLabel(status)}</span>
    </>
  )
}
