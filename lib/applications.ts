export type Application = {
  company: string
  role: string
  initials: string
  logo: string
  status: string
  nextStep: string
  due: string
}

export const applications: Application[] = [
  {
    company: "Vercel",
    role: "Senior Product Designer",
    initials: "V",
    logo: "https://thesvg.org/icons/vercel/default.svg",
    status: "Interviewing",
    nextStep: "Hiring manager interview",
    due: "Tomorrow",
  },
  {
    company: "Figma",
    role: "Product Designer, Growth",
    initials: "F",
    logo: "https://thesvg.org/icons/figma/default.svg",
    status: "Take-home",
    nextStep: "Submit design exercise",
    due: "Nov 30",
  },
  {
    company: "Linear",
    role: "Product Designer",
    initials: "L",
    logo: "https://thesvg.org/icons/linear/default.svg",
    status: "Applied",
    nextStep: "Follow up with recruiter",
    due: "Dec 2",
  },
  {
    company: "Ramp",
    role: "Staff Product Designer",
    initials: "R",
    logo: "https://thesvg.org/icons/ramp/default.svg",
    status: "Recruiter screen",
    nextStep: "Share availability",
    due: "Nov 27",
  },
]
