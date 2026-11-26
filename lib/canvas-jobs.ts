export type CanvasJob = {
  id: string
  company: string
  title: string
  postedAt: string
  source: string
  logo: string
  summary: string
  matchTerms: string[]
  minimumExperienceYears: number
}

export const canvasJobs: CanvasJob[] = [
  {
    id: "airbnb-guest-experience",
    company: "Airbnb",
    title: "Senior Product Designer, Guest Experience",
    postedAt: "2026-11-26",
    source: "LinkedIn",
    logo: "https://thesvg.org/icons/airbnb/default.svg",
    summary: "Shape the end-to-end booking experience for guests around the world.",
    matchTerms: ["user research", "service design", "mobile design", "prototyping", "product designer"],
    minimumExperienceYears: 5,
  },
  {
    id: "figma-ai-experiences",
    company: "Figma",
    title: "Product Designer, AI Experiences",
    postedAt: "2026-11-25",
    source: "Wellfound",
    logo: "https://thesvg.org/icons/figma/default.svg",
    summary: "Design approachable AI tools that help teams move from idea to interface.",
    matchTerms: ["ai product design", "prototyping", "interaction design", "product strategy", "product designer"],
    minimumExperienceYears: 4,
  },
  {
    id: "stripe-billing",
    company: "Stripe",
    title: "Product Designer, Billing",
    postedAt: "2026-11-24",
    source: "Indeed",
    logo: "https://thesvg.org/icons/stripe/default.svg",
    summary: "Make complex billing workflows clear for businesses of every size.",
    matchTerms: ["billing", "fintech", "information architecture", "product strategy", "product designer"],
    minimumExperienceYears: 5,
  },
  {
    id: "notion-publishing",
    company: "Notion",
    title: "Product Designer, Publishing",
    postedAt: "2026-11-23",
    source: "Wellhub",
    logo: "https://thesvg.org/icons/notion/default.svg",
    summary: "Help people create, share, and discover useful work in Notion.",
    matchTerms: ["content design", "collaboration", "information architecture", "design systems", "product designer"],
    minimumExperienceYears: 4,
  },
  {
    id: "linear-design-systems",
    company: "Linear",
    title: "Senior Product Designer, Design Systems",
    postedAt: "2026-11-22",
    source: "Built In",
    logo: "https://thesvg.org/icons/linear/default.svg",
    summary: "Evolve the systems and patterns behind a fast, focused product.",
    matchTerms: ["design systems", "prototyping", "interaction design", "product designer", "accessibility"],
    minimumExperienceYears: 6,
  },
  {
    id: "miro-collaboration",
    company: "Miro",
    title: "Product Designer, Collaboration",
    postedAt: "2026-11-21",
    source: "Glassdoor",
    logo: "https://thesvg.org/icons/miro/default.svg",
    summary: "Create better ways for distributed teams to think and work together.",
    matchTerms: ["collaboration", "remote", "workshop facilitation", "prototyping", "product designer"],
    minimumExperienceYears: 4,
  },
  {
    id: "spotify-creator-tools",
    company: "Spotify",
    title: "Product Designer, Creator Tools",
    postedAt: "2026-11-20",
    source: "Dribbble",
    logo: "https://thesvg.org/icons/spotify/default.svg",
    summary: "Build tools that help artists connect with their listeners.",
    matchTerms: ["creator tools", "mobile design", "user research", "content design", "product designer"],
    minimumExperienceYears: 4,
  },
  {
    id: "webflow-growth",
    company: "Webflow",
    title: "Product Designer, Growth",
    postedAt: "2026-11-19",
    source: "Otta",
    logo: "https://thesvg.org/icons/webflow/default.svg",
    summary: "Improve the journey from a first project to a thriving website.",
    matchTerms: ["growth", "experimentation", "web design", "product strategy", "product designer"],
    minimumExperienceYears: 3,
  },
  {
    id: "asana-workflows",
    company: "Asana",
    title: "Product Designer, Workflows",
    postedAt: "2026-11-18",
    source: "Indeed",
    logo: "https://thesvg.org/icons/asana/default.svg",
    summary: "Make everyday planning and cross-team workflows feel effortless.",
    matchTerms: ["workflow", "information architecture", "product strategy", "prototyping", "product designer"],
    minimumExperienceYears: 4,
  },
  {
    id: "adobe-creative-cloud",
    company: "Adobe",
    title: "Product Designer, Creative Cloud",
    postedAt: "2026-11-17",
    source: "LinkedIn",
    logo: "https://thesvg.org/icons/adobe/default.svg",
    summary: "Bring thoughtful product experiences to creative tools used worldwide.",
    matchTerms: ["creative tools", "design systems", "interaction design", "accessibility", "product designer"],
    minimumExperienceYears: 5,
  },
]
