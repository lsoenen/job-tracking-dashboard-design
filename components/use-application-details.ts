"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import type { Application } from "@/lib/applications"
import { cleanDetails, detailsFromPosting, type JobDetails, type PostingFacts } from "@/lib/job-details"
import { jobBoards } from "@/lib/jobs/sources"
import { createClient } from "@/lib/supabase/client"

type JobRow = {
  description: string | null
  location: string | null
  is_remote: boolean
  department: string | null
  company_domain: string | null
  board: string
}

/** The details for one application, plus what its posting can fill in */
export function useApplicationDetails(application: Application) {
  const [details, setDetails] = useState<JobDetails>({})
  const [suggested, setSuggested] = useState<JobDetails>({})
  /** The best description we have when no posting text was imported: Canvas posting or saved notes */
  const [fallbackDescription, setFallbackDescription] = useState<{ text: string; source: "canvas" | "notes" } | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    setStatus("loading")

    async function load() {
      const { data, error } = await supabase.from("applications").select("details").eq("id", application.id).maybeSingle()
      if (cancelled) return
      if (error) {
        console.error("Loading job details failed:", error.message)
        setStatus("error")
        return
      }
      const loaded = ((data?.details as JobDetails | null) ?? {}) as JobDetails
      setDetails(loaded)
      setStatus("ready")

      // What the posting can fill in: the full Canvas posting when we have it, otherwise the saved notes
      const known = jobBoards.find((board) => board.company.toLowerCase() === application.company.toLowerCase())
      const facts: PostingFacts = {
        company: application.company,
        title: application.role,
        // An imported posting beats the short saved notes
        description: loaded.postingText ?? application.description,
        industry: known?.industry,
        companyDomain: known?.domain,
      }

      if (application.canvasJobId) {
        const { data: job } = await supabase
          .from("jobs")
          .select("description, location, is_remote, department, company_domain, board")
          .eq("id", application.canvasJobId)
          .maybeSingle()
        const row = job as JobRow | null
        if (row) {
          const board = jobBoards.find((item) => item.board === row.board)
          Object.assign(facts, {
            description: loaded.postingText ?? row.description ?? facts.description,
            location: row.location ?? undefined,
            isRemote: row.is_remote,
            department: row.department ?? undefined,
            companyDomain: row.company_domain ?? facts.companyDomain,
            industry: board?.industry ?? facts.industry,
          })
        }
        facts.fromCanvas = true
      }

      if (!cancelled) {
        setSuggested(detailsFromPosting(facts))
        const canvasText = application.canvasJobId && facts.description !== application.description ? facts.description : undefined
        if (canvasText && !loaded.postingText) setFallbackDescription({ text: canvasText, source: "canvas" })
        else if (application.description?.trim()) setFallbackDescription({ text: application.description, source: "notes" })
        else setFallbackDescription(null)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [application.id, application.canvasJobId, application.company, application.role, application.description])

  /** Saves the full details object; resolves true on success */
  const saveDetails = useCallback(
    async (next: JobDetails) => {
      const previous = details
      const cleaned = cleanDetails(next)
      setDetails(cleaned)

      const { error } = await createClient().from("applications").update({ details: cleaned }).eq("id", application.id)
      if (error) {
        console.error("Saving job details failed:", error.message)
        setDetails(previous)
        toast.error("Couldn't save these details. Your change was undone.")
        return false
      }
      return true
    },
    [application.id, details],
  )

  return { details, suggested, status, saveDetails, fallbackDescription }
}
