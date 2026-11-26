import type { CanvasJob } from "@/lib/canvas-jobs"
import type { JobProfile } from "@/lib/job-profile"

export function calculateJobFitScore(
  job: Pick<CanvasJob, "matchTerms" | "minimumExperienceYears">,
  profile: JobProfile,
) {
  const profileText = [profile.headline, profile.background, profile.skills].join(" ").toLowerCase()
  const matchingTerms = job.matchTerms.filter((term) => profileText.includes(term.toLowerCase()))
  const profileMatch = matchingTerms.length / Math.max(job.matchTerms.length, 1)
  const experienceMatch = Math.min(
    Math.max(profile.yearsExperience, 0) / Math.max(job.minimumExperienceYears, 1),
    1,
  )

  return Math.round((profileMatch * 0.85 + experienceMatch * 0.15) * 100)
}
