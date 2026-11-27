import type { CanvasJob } from "@/lib/jobs/types"
import type { JobProfile } from "@/lib/job-profile"

const stopWords = new Set(["and", "the", "for", "with", "of", "at", "in", "a", "an", "to", "&", "i", "am"])

function words(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length > 1 && !stopWords.has(word))
}

export type JobFit = {
  score: number
  matchedSkills: string[]
}

/**
 * How well a posting fits someone's profile, 0–100:
 *  45% skills from their profile that the posting mentions
 *  35% words from their headline that appear in the job title
 *  20% years of experience vs. the seniority the title implies
 */
export function calculateJobFit(
  job: Pick<CanvasJob, "title" | "summary" | "keywords" | "minYears">,
  profile: Pick<JobProfile, "headline" | "skills" | "yearsExperience">,
): JobFit {
  const haystack = `${job.title} ${job.summary} ${job.keywords.join(" ")}`.toLowerCase()
  const skills = profile.skills
    .split(/[,\n;]+/)
    .map((skill) => skill.trim())
    .filter(Boolean)
  const matchedSkills = skills.filter((skill) => {
    const lower = skill.toLowerCase()
    return haystack.includes(lower) || job.keywords.some((keyword) => keyword.toLowerCase() === lower)
  })
  const skillScore = skills.length === 0 ? 0 : Math.min(1, matchedSkills.length / Math.min(5, skills.length))

  const headlineWords = words(profile.headline)
  const titleWords = new Set(words(job.title))
  const titleScore =
    headlineWords.length === 0 ? 0 : headlineWords.filter((word) => titleWords.has(word)).length / headlineWords.length

  const years = Math.max(profile.yearsExperience, 0)
  const experienceScore = job.minYears === 0 ? (years <= 3 ? 1 : 0.6) : Math.min(years / job.minYears, 1)

  return {
    score: Math.round((skillScore * 0.45 + titleScore * 0.35 + experienceScore * 0.2) * 100),
    matchedSkills,
  }
}
