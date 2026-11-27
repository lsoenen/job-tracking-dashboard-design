"use client"

import { useCallback, useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

export type MaterialKind = "cover-letter" | "resume"

export type CoverLetterContent = { text: string }
export type ResumeContent = { summary: string; skills: string }

export type SavedMaterials = {
  "cover-letter"?: { content: CoverLetterContent; updatedAt: string }
  resume?: { content: ResumeContent; updatedAt: string }
}

type MaterialRow = { kind: MaterialKind; content: CoverLetterContent | ResumeContent; updated_at: string }

/** Loads and saves the AI drafts (cover letter, tailored resume) for one application */
export function useApplicationMaterials(applicationId: string) {
  const [materials, setMaterials] = useState<SavedMaterials>({})
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let cancelled = false
    setStatus("loading")

    createClient()
      .from("application_materials")
      .select("kind, content, updated_at")
      .eq("application_id", applicationId)
      .then(({ data, error }: { data: MaterialRow[] | null; error: { message: string } | null }) => {
        if (cancelled) return
        if (error) {
          console.error("Loading drafts failed:", error.message)
          setStatus("error")
          return
        }
        const next: SavedMaterials = {}
        for (const row of data ?? []) {
          if (row.kind === "cover-letter") next["cover-letter"] = { content: row.content as CoverLetterContent, updatedAt: row.updated_at }
          if (row.kind === "resume") next.resume = { content: row.content as ResumeContent, updatedAt: row.updated_at }
        }
        setMaterials(next)
        setStatus("ready")
      })

    return () => {
      cancelled = true
    }
  }, [applicationId])

  /** Returns true when saved */
  const saveMaterial = useCallback(
    async (kind: MaterialKind, content: CoverLetterContent | ResumeContent) => {
      const { data, error } = await createClient()
        .from("application_materials")
        .upsert({ application_id: applicationId, kind, content }, { onConflict: "application_id,kind" })
        .select("kind, content, updated_at")
        .single()

      if (error) {
        console.error("Saving draft failed:", error.message)
        return false
      }

      const row = data as MaterialRow
      setMaterials((current) => ({ ...current, [kind]: { content: row.content, updatedAt: row.updated_at } }))
      return true
    },
    [applicationId],
  )

  /** Keep a draft the server already saved (e.g. a tailored resume), so it survives tab switches */
  const rememberMaterial = useCallback((kind: MaterialKind, content: unknown, updatedAt: string) => {
    setMaterials((current) => ({ ...current, [kind]: { content, updatedAt } }))
  }, [])

  return { materials, status, saveMaterial, rememberMaterial }
}
