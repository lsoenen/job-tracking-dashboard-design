export type CanvasJobContact = {
  name: string
  title: string
  avatar: string
  avatarIndex: number
  avatarCropTop: number
  linkedinSearchQuery: string
}

export type CanvasJob = {
  id: string
  company: string
  title: string
  postedAt: string
  source: string
  logo: string
  summary: string
  description: {
    overview: string
    responsibilities: string[]
    qualifications: string[]
  }
  contacts: CanvasJobContact[]
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
    description: {
      overview: "Airbnb is looking for a Senior Product Designer to make it easier for guests to move from trip inspiration to a confident booking. You will work across discovery, listing evaluation, checkout, and post-booking support, shaping a connected experience used by travelers with different needs, budgets, and levels of familiarity with a destination.",
      responsibilities: [
        "Lead design from early opportunity framing through prototyping, launch, and iteration with product, engineering, research, content design, and data partners.",
        "Use guest research and product signals to uncover friction in destination discovery, listing comparison, pricing transparency, and booking decisions.",
        "Design clear, accessible flows for complex decisions while accounting for trust, localization, and a wide range of travel contexts.",
        "Communicate design rationale, align stakeholders, and contribute reusable patterns across the guest experience.",
      ],
      qualifications: [
        "At least five years designing and shipping consumer digital products, with a portfolio showing end-to-end ownership.",
        "Strong interaction and systems thinking, including experience simplifying multi-step or high-consideration journeys.",
        "Comfortable pairing qualitative research with behavioral data to make and explain product decisions.",
        "Clear communicator who can collaborate across disciplines and move work forward amid ambiguity.",
      ],
    },
    contacts: [
      { name: "Aditi Mehta", title: "Product Design Talent Partner", avatar: "/contact-portraits/airbnb.png", avatarIndex: 0, avatarCropTop: 25, linkedinSearchQuery: "Airbnb product design recruiter talent partner" },
      { name: "Marcus Reed", title: "Design Lead, Guest Experience", avatar: "/contact-portraits/airbnb.png", avatarIndex: 1, avatarCropTop: 25, linkedinSearchQuery: "Airbnb Guest Experience design lead" },
      { name: "Hana Ito", title: "Product Designer, Guest Experience", avatar: "/contact-portraits/airbnb.png", avatarIndex: 2, avatarCropTop: 25, linkedinSearchQuery: "Airbnb product designer Guest Experience" },
    ],
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
    description: {
      overview: "Figma is seeking a Product Designer to help teams use AI naturally within their creative workflow. You will shape experiences that help people explore ideas, make progress on real design work, and stay in control of the result. The role calls for thoughtful interaction design, rapid prototyping, and close partnership with teams building emerging product capabilities.",
      responsibilities: [
        "Translate customer needs and product strategy into clear AI-assisted workflows across ideation, editing, and collaboration.",
        "Prototype a range of interaction models and use feedback to improve discoverability, usefulness, and user control.",
        "Work closely with product managers, engineers, researchers, and content designers to deliver cohesive experiences.",
        "Define patterns for communicating system status, uncertainty, and recovery when generated results need refinement.",
      ],
      qualifications: [
        "Four or more years of product design experience and a portfolio that demonstrates shipped work and strong craft.",
        "Experience designing complex tools, collaborative products, or workflows with multiple steps and user intents.",
        "Ability to move between detailed interaction design and broad product framing.",
        "Curiosity about AI capabilities and limitations, with a user-centered approach to trust and transparency.",
      ],
    },
    contacts: [
      { name: "Maya Brooks", title: "Product Design Recruiter", avatar: "/contact-portraits/figma.png", avatarIndex: 0, avatarCropTop: 10, linkedinSearchQuery: "Figma product design recruiter" },
      { name: "Gabriel Santos", title: "Design Lead, AI Experiences", avatar: "/contact-portraits/figma.png", avatarIndex: 1, avatarCropTop: 10, linkedinSearchQuery: "Figma AI Experiences design lead" },
      { name: "Claire Ellis", title: "Product Designer, AI", avatar: "/contact-portraits/figma.png", avatarIndex: 2, avatarCropTop: 10, linkedinSearchQuery: "Figma AI product designer" },
    ],
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
    description: {
      overview: "Stripe is looking for a Product Designer to improve the tools businesses use to manage subscriptions, invoices, and recurring revenue. Billing workflows can be powerful but difficult to understand, especially as a company grows. You will help make setup and ongoing administration more predictable for users, while supporting the flexibility needed by businesses with different models.",
      responsibilities: [
        "Own design projects across billing setup, plan changes, invoices, and subscription management from discovery through launch.",
        "Partner with product, engineering, research, and content design to turn complex billing rules into understandable workflows.",
        "Use customer conversations, support themes, and product data to identify opportunities and evaluate design decisions.",
        "Maintain quality across edge cases, permissions, responsive layouts, and the broader Stripe product ecosystem.",
      ],
      qualifications: [
        "Five or more years of experience designing software products, ideally for business or financial workflows.",
        "A portfolio demonstrating strong information architecture and the ability to simplify complex systems.",
        "Experience collaborating closely with engineering and adapting designs to technical and operational constraints.",
        "Strong written and verbal communication skills, with care for accessibility and interaction details.",
      ],
    },
    contacts: [
      { name: "Kenji Sato", title: "Product Design Talent Partner", avatar: "/contact-portraits/stripe.png", avatarIndex: 0, avatarCropTop: 25, linkedinSearchQuery: "Stripe product design recruiter" },
      { name: "Imani Clarke", title: "Design Lead, Billing", avatar: "/contact-portraits/stripe.png", avatarIndex: 1, avatarCropTop: 25, linkedinSearchQuery: "Stripe Billing design lead" },
      { name: "Arjun Patel", title: "Product Designer, Billing", avatar: "/contact-portraits/stripe.png", avatarIndex: 2, avatarCropTop: 25, linkedinSearchQuery: "Stripe product designer Billing" },
    ],
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
    description: {
      overview: "Notion is looking for a Product Designer to make publishing work feel simple from the first draft through sharing and discovery. You will help people turn their knowledge into pages and sites that are useful to an audience, whether they are sharing with a small group or making something publicly available. The team values thoughtful defaults, flexible tools, and a coherent experience across the product.",
      responsibilities: [
        "Design publishing and sharing workflows, including the decisions people make around audience, access, and presentation.",
        "Partner with product managers, engineers, researchers, and content designers to identify user needs and deliver improvements.",
        "Explore concepts through sketches and prototypes, then refine them using customer feedback and product insights.",
        "Work with adjacent teams to create consistent patterns across editing, collaboration, and public-facing pages.",
      ],
      qualifications: [
        "Four or more years designing digital products, with examples of work from discovery through delivery.",
        "Strong product judgment and ability to make complex functionality approachable without limiting flexibility.",
        "Experience with collaboration, content creation, publishing, or information-rich products is valuable.",
        "Comfortable sharing work early, incorporating feedback, and articulating tradeoffs to partners.",
      ],
    },
    contacts: [
      { name: "Lucia Reyes", title: "Product Design Recruiter", avatar: "/contact-portraits/notion.png", avatarIndex: 0, avatarCropTop: 10, linkedinSearchQuery: "Notion product design recruiter" },
      { name: "Min Park", title: "Design Lead, Publishing", avatar: "/contact-portraits/notion.png", avatarIndex: 1, avatarCropTop: 10, linkedinSearchQuery: "Notion Publishing design lead" },
      { name: "Asha Bennett", title: "Product Designer, Publishing", avatar: "/contact-portraits/notion.png", avatarIndex: 2, avatarCropTop: 10, linkedinSearchQuery: "Notion product designer publishing" },
    ],
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
    description: {
      overview: "Linear is seeking a Senior Product Designer to evolve the shared patterns that make its product feel clear and consistent. You will work across the design system and the product surfaces that depend on it, helping the team move quickly without sacrificing craft. This role combines hands-on interface design with the systems thinking needed to make patterns useful to designers and engineers alike.",
      responsibilities: [
        "Improve core component patterns, interaction behavior, and documentation in partnership with design and engineering.",
        "Collaborate with product teams to identify where shared patterns help and where a specific workflow needs a considered exception.",
        "Prototype and validate improvements to navigation, controls, accessibility, and responsive behavior.",
        "Help establish a consistent quality bar through reviews, examples, and practical design-system guidance.",
      ],
      qualifications: [
        "Six or more years in product design, including experience working with or contributing to a design system.",
        "Excellent interaction and visual design craft, with a portfolio showing thoughtful product details.",
        "Ability to work closely with engineers and reason about reusable components and implementation constraints.",
        "A pragmatic approach to consistency, accessibility, and evolving established patterns.",
      ],
    },
    contacts: [
      { name: "Emma Foster", title: "Product Design Talent Partner", avatar: "/contact-portraits/linear.png", avatarIndex: 0, avatarCropTop: 10, linkedinSearchQuery: "Linear product design recruiter" },
      { name: "Andre Lewis", title: "Design Lead, Design Systems", avatar: "/contact-portraits/linear.png", avatarIndex: 1, avatarCropTop: 10, linkedinSearchQuery: "Linear design systems design lead" },
      { name: "Rina Shah", title: "Product Designer, Design Systems", avatar: "/contact-portraits/linear.png", avatarIndex: 2, avatarCropTop: 10, linkedinSearchQuery: "Linear product designer design systems" },
    ],
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
    description: {
      overview: "Miro is looking for a Product Designer to help distributed teams collaborate effectively before, during, and after shared work sessions. You will explore how people contribute ideas, stay aligned, and turn a collaborative canvas into clear next steps. The work spans individual and team needs, with an emphasis on making complex group workflows feel welcoming and easy to follow.",
      responsibilities: [
        "Lead design for collaboration workflows, from understanding team needs to defining and shipping product improvements.",
        "Facilitate discovery with customers and internal partners to understand how teams use collaborative tools in practice.",
        "Create prototypes that test new interaction models for live and asynchronous collaboration.",
        "Partner with engineering, research, and product to measure outcomes and iterate on launched work.",
      ],
      qualifications: [
        "Four or more years of product design experience and a portfolio with shipped collaborative or productivity tools.",
        "Strong facilitation and communication skills, including the ability to make group needs actionable.",
        "Comfort working across discovery, interaction design, prototyping, and delivery.",
        "Experience designing for distributed teams or complex multi-user workflows is a plus.",
      ],
    },
    contacts: [
      { name: "Yuna Mori", title: "Product Design Recruiter", avatar: "/contact-portraits/miro.png", avatarIndex: 0, avatarCropTop: 25, linkedinSearchQuery: "Miro product design recruiter" },
      { name: "Rafael Cruz", title: "Design Lead, Collaboration", avatar: "/contact-portraits/miro.png", avatarIndex: 1, avatarCropTop: 25, linkedinSearchQuery: "Miro Collaboration design lead" },
      { name: "Talia Brooks", title: "Product Designer, Collaboration", avatar: "/contact-portraits/miro.png", avatarIndex: 2, avatarCropTop: 25, linkedinSearchQuery: "Miro product designer collaboration" },
    ],
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
    description: {
      overview: "Spotify is seeking a Product Designer to improve the tools creators use to understand and grow their audience. You will help artists make sense of performance insights, manage their presence, and take meaningful actions for their work. The role brings together data-heavy interfaces and creator-focused workflows, with a goal of making useful information feel clear and actionable.",
      responsibilities: [
        "Design and ship creator-facing features across analytics, content management, and audience engagement.",
        "Work with creators and internal partners to understand different goals, levels of experience, and working contexts.",
        "Turn complex data and platform capabilities into interfaces that support confident decisions.",
        "Partner with product, engineering, research, and content design to iterate based on feedback and measurable outcomes.",
      ],
      qualifications: [
        "Four or more years of product design experience, ideally with creator, media, or data-rich products.",
        "Portfolio evidence of making complex information understandable and useful.",
        "Strong interaction design and prototyping skills, with care for mobile and responsive experiences.",
        "Ability to balance creator needs with platform requirements and cross-functional constraints.",
      ],
    },
    contacts: [
      { name: "Darius Cole", title: "Product Design Talent Partner", avatar: "/contact-portraits/spotify.png", avatarIndex: 0, avatarCropTop: 25, linkedinSearchQuery: "Spotify product design recruiter creator tools" },
      { name: "Sana Iyer", title: "Design Lead, Creator Tools", avatar: "/contact-portraits/spotify.png", avatarIndex: 1, avatarCropTop: 25, linkedinSearchQuery: "Spotify Creator Tools design lead" },
      { name: "Elliot Morgan", title: "Product Designer, Creator Tools", avatar: "/contact-portraits/spotify.png", avatarIndex: 2, avatarCropTop: 25, linkedinSearchQuery: "Spotify product designer creator tools" },
    ],
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
    description: {
      overview: "Webflow is looking for a Product Designer to help more people reach value as they learn, build, and publish with the platform. You will focus on the journey from a first project toward a useful, successful website, identifying where people need clearer guidance or better tools. The role combines product craft with experimentation and close attention to both new and returning customers.",
      responsibilities: [
        "Map key onboarding and activation journeys and identify opportunities to reduce friction.",
        "Design experiments and product improvements with product managers, engineering, research, analytics, and marketing partners.",
        "Use customer research and funnel data to form hypotheses, assess results, and guide follow-up work.",
        "Create clear, accessible experiences that help customers make progress without compromising the flexibility of the product.",
      ],
      qualifications: [
        "Three or more years of product design experience with examples of work that improved a customer journey.",
        "Comfort using qualitative and quantitative signals to inform design decisions.",
        "Strong interaction design and prototyping skills, with an iterative approach to testing ideas.",
        "Experience with growth, onboarding, experimentation, or website-building products is a plus.",
      ],
    },
    contacts: [
      { name: "Grace Miller", title: "Product Design Recruiter", avatar: "/contact-portraits/webflow.png", avatarIndex: 0, avatarCropTop: 20, linkedinSearchQuery: "Webflow product design recruiter" },
      { name: "Nikhil Rao", title: "Design Lead, Growth", avatar: "/contact-portraits/webflow.png", avatarIndex: 1, avatarCropTop: 20, linkedinSearchQuery: "Webflow Growth design lead" },
      { name: "Evan Lin", title: "Product Designer, Growth", avatar: "/contact-portraits/webflow.png", avatarIndex: 2, avatarCropTop: 20, linkedinSearchQuery: "Webflow product designer growth" },
    ],
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
    description: {
      overview: "Asana is seeking a Product Designer to make it easier for teams to coordinate work across projects, tools, and roles. You will help people understand what needs attention, define repeatable processes, and keep work moving without adding unnecessary overhead. The role requires careful systems thinking and the ability to make flexible workflow capabilities approachable for a broad range of teams.",
      responsibilities: [
        "Design end-to-end workflow experiences, from early customer problems through detailed interaction design and launch.",
        "Partner with product, engineering, research, and data teams to prioritize opportunities and deliver cohesive solutions.",
        "Explore how teams create, automate, and monitor work while accounting for different permissions and levels of complexity.",
        "Evaluate shipped experiences using customer feedback and product signals, then identify practical improvements.",
      ],
      qualifications: [
        "Four or more years designing software products, with a portfolio that shows clear problem solving and execution.",
        "Strong information architecture and systems thinking for multi-step or cross-team experiences.",
        "Experience collaborating with technical partners to deliver robust workflows and edge cases.",
        "A thoughtful approach to accessibility, product consistency, and communicating design tradeoffs.",
      ],
    },
    contacts: [
      { name: "Layla Haddad", title: "Product Design Talent Partner", avatar: "/contact-portraits/asana.png", avatarIndex: 0, avatarCropTop: 10, linkedinSearchQuery: "Asana product design recruiter" },
      { name: "Malik Turner", title: "Design Lead, Workflows", avatar: "/contact-portraits/asana.png", avatarIndex: 1, avatarCropTop: 10, linkedinSearchQuery: "Asana Workflows design lead" },
      { name: "Mei Zhou", title: "Product Designer, Workflows", avatar: "/contact-portraits/asana.png", avatarIndex: 2, avatarCropTop: 10, linkedinSearchQuery: "Asana product designer workflows" },
    ],
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
    description: {
      overview: "Adobe is looking for a Product Designer to help improve creative workflows across Creative Cloud. You will work on experiences that support people as they move between inspiration, creation, and sharing, considering a broad range of skill levels and devices. The team is looking for someone who can bring strong craft to detailed interactions while keeping the needs of creative professionals and everyday makers in view.",
      responsibilities: [
        "Define and deliver product experiences in partnership with product management, engineering, research, and content design.",
        "Explore creative workflows through customer conversations, competitive research, and collaborative prototyping.",
        "Design clear, accessible interactions that work across connected tools and fit within established product patterns.",
        "Present work, incorporate feedback, and contribute to a high bar for quality from concept through implementation.",
      ],
      qualifications: [
        "Five or more years of product design experience with a portfolio demonstrating shipped, polished work.",
        "Strong visual and interaction design skills, including the ability to work within and improve shared systems.",
        "Experience designing creative, productivity, or other tools with meaningful workflow complexity.",
        "Comfort partnering with engineers to refine designs and resolve implementation details.",
      ],
    },
    contacts: [
      { name: "Rhea Das", title: "Product Design Recruiter", avatar: "/contact-portraits/adobe.png", avatarIndex: 0, avatarCropTop: 10, linkedinSearchQuery: "Adobe Creative Cloud product design recruiter" },
      { name: "Javier Torres", title: "Design Lead, Creative Cloud", avatar: "/contact-portraits/adobe.png", avatarIndex: 1, avatarCropTop: 10, linkedinSearchQuery: "Adobe Creative Cloud design lead" },
      { name: "Imani Reed", title: "Product Designer, Creative Cloud", avatar: "/contact-portraits/adobe.png", avatarIndex: 2, avatarCropTop: 10, linkedinSearchQuery: "Adobe Creative Cloud product designer" },
    ],
    matchTerms: ["creative tools", "design systems", "interaction design", "accessibility", "product designer"],
    minimumExperienceYears: 5,
  },
]
