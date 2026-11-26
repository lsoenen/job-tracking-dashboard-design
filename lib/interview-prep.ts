export const interviewPersonas = [
  {
    slug: "recruiter",
    label: "Recruiter",
    title: "Recruiter screen",
    focus: "Your story, role fit, motivation, and the practical details.",
    questions: [
      {
        id: "recruiter-background",
        prompt: "Walk me through your background and what brings you to this role.",
        why: "They want a concise story that connects your experience to this opening.",
        cues: ["Start with your current focus", "Choose one relevant turning point", "Connect your next step to this role"],
      },
      {
        id: "recruiter-interest",
        prompt: "Why are you interested in this company and position?",
        why: "Recruiters are listening for a specific reason, not a generic compliment.",
        cues: ["Name a product or company detail", "Connect it to your strengths", "Share what you hope to contribute"],
      },
      {
        id: "recruiter-search",
        prompt: "What are you looking for in your next opportunity?",
        why: "This helps check whether the role, team, and working style match your priorities.",
        cues: ["Pick two priorities", "Explain why they matter to you", "Relate them to the role"],
      },
      {
        id: "recruiter-logistics",
        prompt: "What would you like to know about the role or hiring process?",
        why: "Thoughtful questions show preparation and help you decide whether the opportunity fits.",
        cues: ["Ask about the team or success measures", "Clarify the next steps", "Keep compensation and timing questions direct"],
      },
    ],
  },
  {
    slug: "hiring-manager",
    label: "Hiring manager",
    title: "Hiring manager conversation",
    focus: "How you make decisions, take ownership, and create impact with a team.",
    questions: [
      {
        id: "manager-project",
        prompt: "Tell me about a project you owned from the initial problem through delivery.",
        why: "They want to understand your judgment, role, and contribution—not only the final artifact.",
        cues: ["Set the problem and stakes", "Be clear about your decisions", "Close with outcomes and what you learned"],
      },
      {
        id: "manager-ambiguity",
        prompt: "How do you make progress when the problem or requirements are unclear?",
        why: "This reveals how you create alignment and move work forward without waiting for perfect information.",
        cues: ["Explain what you needed to learn", "Describe how you aligned people", "Share the first useful decision or experiment"],
      },
      {
        id: "manager-priorities",
        prompt: "How do you balance user needs, business goals, and delivery constraints?",
        why: "The interviewer is looking for explicit trade-offs and a repeatable decision process.",
        cues: ["Name the competing needs", "Explain the evidence you used", "Describe the trade-off and its result"],
      },
      {
        id: "manager-feedback",
        prompt: "Tell me about a time feedback changed your approach.",
        why: "They want to see curiosity, resilience, and how you turn feedback into better work.",
        cues: ["Choose a real moment", "Show how you evaluated the feedback", "Explain what changed afterward"],
      },
    ],
  },
  {
    slug: "design-lead",
    label: "Design lead",
    title: "Design and craft interview",
    focus: "Your product thinking, craft, process, and the reasoning behind your work.",
    questions: [
      {
        id: "design-case-study",
        prompt: "Take me through a case study where you had to make a difficult product decision.",
        why: "They are listening for the path from evidence to decision, not a slide-by-slide tour.",
        cues: ["Frame the user problem", "Show the options and trade-offs", "Explain the outcome and your role"],
      },
      {
        id: "design-system",
        prompt: "How have you improved consistency without slowing a team down?",
        why: "This explores how you balance a coherent system with the needs of individual product teams.",
        cues: ["Identify the friction", "Describe the smallest useful system change", "Share how adoption or quality improved"],
      },
      {
        id: "design-research",
        prompt: "How do you decide what to validate with research or experimentation?",
        why: "They want to see how you reduce meaningful uncertainty and choose an appropriate level of evidence.",
        cues: ["Name the riskiest assumption", "Match the method to the question", "Show how the result changed the work"],
      },
      {
        id: "design-critique",
        prompt: "How do you give and receive design critique?",
        why: "Good craft depends on useful critique that stays focused on the problem and moves the work forward.",
        cues: ["Set the context and feedback goal", "Separate preference from evidence", "Describe how you turn feedback into a next step"],
      },
    ],
  },
  {
    slug: "cross-functional",
    label: "Cross-functional partner",
    title: "Cross-functional interview",
    focus: "How you collaborate with product, engineering, research, and other partners.",
    questions: [
      {
        id: "partner-disagreement",
        prompt: "Tell me about a disagreement with a product or engineering partner.",
        why: "They want to know whether you can surface tension early and find a shared path forward.",
        cues: ["Describe the shared goal", "Explain how you listened and made your case", "Share the resolution and relationship afterward"],
      },
      {
        id: "partner-influence",
        prompt: "How do you influence a decision when you do not own the final call?",
        why: "This shows how you build trust and use evidence without relying on authority.",
        cues: ["Understand the decision owner’s constraints", "Bring the clearest evidence you have", "Offer a practical path, not just a critique"],
      },
      {
        id: "partner-communication",
        prompt: "How do you adapt your communication for different partners?",
        why: "Strong collaboration means making the important context easy for each person to act on.",
        cues: ["Choose a real example", "Explain what each partner needed", "Show how the communication changed the outcome"],
      },
      {
        id: "partner-tradeoff",
        prompt: "What do you do when a launch date conflicts with the quality bar?",
        why: "This explores how you protect essential quality while making delivery trade-offs visible.",
        cues: ["Separate must-haves from polish", "Make risks and options explicit", "Agree on an owner and follow-up"],
      },
    ],
  },
  {
    slug: "executive",
    label: "Executive",
    title: "Executive conversation",
    focus: "Your strategic perspective, judgment, and the impact you can have over time.",
    questions: [
      {
        id: "executive-strategy",
        prompt: "Where do you think design can have the greatest impact on our business?",
        why: "They are looking for a point of view that connects customer value to company outcomes.",
        cues: ["Start with a customer or market observation", "Connect it to a business opportunity", "Be clear about what you would validate"],
      },
      {
        id: "executive-leadership",
        prompt: "How do you raise the quality of work across a team?",
        why: "This reveals how you create leverage through collaboration, standards, and shared learning.",
        cues: ["Describe the environment you create", "Give one example of growing others", "Connect the change to team outcomes"],
      },
      {
        id: "executive-priorities",
        prompt: "How do you decide what not to work on?",
        why: "Senior partners want to see focus, sound judgment, and a clear way to communicate trade-offs.",
        cues: ["State the goal or constraint", "Explain the opportunity cost", "Show how you aligned people around the choice"],
      },
      {
        id: "executive-first-year",
        prompt: "What would success look like for you in your first year here?",
        why: "This surfaces how you think about learning, outcomes, and building trust before prescribing solutions.",
        cues: ["Start with listening and context", "Name outcomes rather than a fixed solution", "Explain how you would measure progress"],
      },
    ],
  },
] as const

export function getInterviewPersona(slug: string) {
  return interviewPersonas.find((persona) => persona.slug === slug)
}
