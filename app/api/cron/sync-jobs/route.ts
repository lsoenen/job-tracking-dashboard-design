import { NextResponse, type NextRequest } from "next/server"

import { fetchBoardJobs, type JobRecord } from "@/lib/jobs/fetchers"
import { jobBoards, type JobBoard } from "@/lib/jobs/sources"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 300
export const dynamic = "force-dynamic"

const concurrency = 6

type BoardResult = { board: string; found: number; closed: number; error?: string }

/**
 * Pulls product/UX roles from every board in lib/jobs/sources.ts into the `jobs` table.
 * Vercel Cron calls this daily (see vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 * Run it by hand with:  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-jobs
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startedAt = Date.now()
  const results: BoardResult[] = []
  const queue = [...jobBoards]

  async function syncBoard(board: JobBoard): Promise<BoardResult> {
    const label = `${board.source}:${board.board}`
    let jobs: JobRecord[]

    try {
      jobs = await fetchBoardJobs(board)
    } catch (error) {
      // Leave this board's existing jobs alone if its feed is temporarily down
      return { board: label, found: 0, closed: 0, error: error instanceof Error ? error.message : String(error) }
    }

    for (let index = 0; index < jobs.length; index += 200) {
      const { error } = await supabase.from("jobs").upsert(jobs.slice(index, index + 200), { onConflict: "id" })
      if (error) return { board: label, found: jobs.length, closed: 0, error: error.message }
    }

    // Anything we had for this board that is no longer listed has closed
    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("id")
      .eq("source", board.source)
      .eq("board", board.board)
      .eq("is_active", true)
    if (existingError) return { board: label, found: jobs.length, closed: 0, error: existingError.message }

    const currentIds = new Set(jobs.map((job) => job.id))
    const closedIds = (existing ?? []).map((row) => row.id as string).filter((id) => !currentIds.has(id))

    if (closedIds.length > 0) {
      const { error } = await supabase.from("jobs").update({ is_active: false }).in("id", closedIds)
      if (error) return { board: label, found: jobs.length, closed: 0, error: error.message }
    }

    return { board: label, found: jobs.length, closed: closedIds.length }
  }

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let board = queue.shift(); board; board = queue.shift()) {
        results.push(await syncBoard(board))
      }
    }),
  )

  const failed = results.filter((result) => result.error)
  for (const result of failed) console.error(`Job sync failed for ${result.board}: ${result.error}`)

  return NextResponse.json({
    ok: failed.length === 0,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    boards: results.length,
    jobsFound: results.reduce((total, result) => total + result.found, 0),
    jobsClosed: results.reduce((total, result) => total + result.closed, 0),
    failed,
    results: results.sort((left, right) => left.board.localeCompare(right.board)),
  })
}
