// Company job boards to pull from. Every board here was checked to respond.
// To add a company: find its careers page. If the "apply" links go to
//   boards.greenhouse.io/<board> → source "greenhouse"
//   jobs.lever.co/<board>        → source "lever"
//   jobs.ashbyhq.com/<board>     → source "ashby"
export type JobSourceKind = "greenhouse" | "lever" | "ashby"

export type JobBoard = {
  source: JobSourceKind
  board: string
  company: string
  domain: string
  industry: string
}

export const jobBoards: JobBoard[] = [
  // Greenhouse
  { source: "greenhouse", board: "airbnb", company: "Airbnb", domain: "airbnb.com", industry: "Travel & hospitality" },
  { source: "greenhouse", board: "affirm", company: "Affirm", domain: "affirm.com", industry: "Fintech" },
  { source: "greenhouse", board: "airtable", company: "Airtable", domain: "airtable.com", industry: "Productivity software" },
  { source: "greenhouse", board: "anthropic", company: "Anthropic", domain: "anthropic.com", industry: "AI" },
  { source: "greenhouse", board: "asana", company: "Asana", domain: "asana.com", industry: "Productivity software" },
  { source: "greenhouse", board: "brex", company: "Brex", domain: "brex.com", industry: "Fintech" },
  { source: "greenhouse", board: "calendly", company: "Calendly", domain: "calendly.com", industry: "Productivity software" },
  { source: "greenhouse", board: "carta", company: "Carta", domain: "carta.com", industry: "Fintech" },
  { source: "greenhouse", board: "chime", company: "Chime", domain: "chime.com", industry: "Fintech" },
  { source: "greenhouse", board: "cloudflare", company: "Cloudflare", domain: "cloudflare.com", industry: "Cloud infrastructure" },
  { source: "greenhouse", board: "coinbase", company: "Coinbase", domain: "coinbase.com", industry: "Crypto" },
  { source: "greenhouse", board: "databricks", company: "Databricks", domain: "databricks.com", industry: "Data & AI" },
  { source: "greenhouse", board: "datadog", company: "Datadog", domain: "datadoghq.com", industry: "Developer tools" },
  { source: "greenhouse", board: "discord", company: "Discord", domain: "discord.com", industry: "Social & communication" },
  { source: "greenhouse", board: "dropbox", company: "Dropbox", domain: "dropbox.com", industry: "Productivity software" },
  { source: "greenhouse", board: "duolingo", company: "Duolingo", domain: "duolingo.com", industry: "Education" },
  { source: "greenhouse", board: "faire", company: "Faire", domain: "faire.com", industry: "E-commerce" },
  { source: "greenhouse", board: "figma", company: "Figma", domain: "figma.com", industry: "Design tools" },
  { source: "greenhouse", board: "gitlab", company: "GitLab", domain: "gitlab.com", industry: "Developer tools" },
  { source: "greenhouse", board: "gusto", company: "Gusto", domain: "gusto.com", industry: "HR & payroll" },
  { source: "greenhouse", board: "instacart", company: "Instacart", domain: "instacart.com", industry: "E-commerce" },
  { source: "greenhouse", board: "lyft", company: "Lyft", domain: "lyft.com", industry: "Transportation" },
  { source: "greenhouse", board: "mercury", company: "Mercury", domain: "mercury.com", industry: "Fintech" },
  { source: "greenhouse", board: "pinterest", company: "Pinterest", domain: "pinterest.com", industry: "Social media" },
  { source: "greenhouse", board: "reddit", company: "Reddit", domain: "reddit.com", industry: "Social media" },
  { source: "greenhouse", board: "robinhood", company: "Robinhood", domain: "robinhood.com", industry: "Fintech" },
  { source: "greenhouse", board: "squarespace", company: "Squarespace", domain: "squarespace.com", industry: "Website builders" },
  { source: "greenhouse", board: "stripe", company: "Stripe", domain: "stripe.com", industry: "Fintech" },
  { source: "greenhouse", board: "twilio", company: "Twilio", domain: "twilio.com", industry: "Communications" },
  { source: "greenhouse", board: "vercel", company: "Vercel", domain: "vercel.com", industry: "Developer tools" },
  { source: "greenhouse", board: "webflow", company: "Webflow", domain: "webflow.com", industry: "Website builders" },
  // Lever
  { source: "lever", board: "palantir", company: "Palantir", domain: "palantir.com", industry: "Data & analytics" },
  { source: "lever", board: "spotify", company: "Spotify", domain: "spotify.com", industry: "Music & audio streaming" },
  // Ashby
  { source: "ashby", board: "cursor", company: "Cursor", domain: "cursor.com", industry: "AI developer tools" },
  { source: "ashby", board: "linear", company: "Linear", domain: "linear.app", industry: "Productivity software" },
  { source: "ashby", board: "notion", company: "Notion", domain: "notion.so", industry: "Productivity software" },
  { source: "ashby", board: "openai", company: "OpenAI", domain: "openai.com", industry: "AI" },
  { source: "ashby", board: "perplexity", company: "Perplexity", domain: "perplexity.ai", industry: "AI" },
  { source: "ashby", board: "posthog", company: "PostHog", domain: "posthog.com", industry: "Developer tools" },
  { source: "ashby", board: "ramp", company: "Ramp", domain: "ramp.com", industry: "Fintech" },
  { source: "ashby", board: "replit", company: "Replit", domain: "replit.com", industry: "Developer tools" },
  { source: "ashby", board: "runway", company: "Runway", domain: "runwayml.com", industry: "AI" },
  { source: "ashby", board: "sentry", company: "Sentry", domain: "sentry.io", industry: "Developer tools" },
  { source: "ashby", board: "supabase", company: "Supabase", domain: "supabase.com", industry: "Developer tools" },
  { source: "ashby", board: "vanta", company: "Vanta", domain: "vanta.com", industry: "Security & compliance" },
  { source: "ashby", board: "zapier", company: "Zapier", domain: "zapier.com", industry: "Automation" },
]

export function companyLogoUrl(domain?: string | null) {
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : undefined
}
