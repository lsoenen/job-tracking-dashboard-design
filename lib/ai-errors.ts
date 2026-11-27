import "server-only"

import Anthropic from "@anthropic-ai/sdk"

/** A friendly, specific explanation of why an AI call failed, plus a short code for logs and the UI */
export type AiFailure = { code: string; message: string; status: number }

/**
 * Turn an AI SDK / AI Gateway error into something a person can act on.
 * Errors are matched by name, so this doesn't depend on importing the gateway package.
 */
export function describeAiError(error: unknown): AiFailure {
  const name = error instanceof Error ? error.name : ""
  const text = error instanceof Error ? error.message : String(error)

  if (/GatewayAuthenticationError|GatewayForbiddenError|GatewayAccessPolicyDeniedError/.test(name) || /unauthori[sz]ed|authenticat|api key|oidc/i.test(text)) {
    return {
      code: "ai-not-configured",
      message:
        "AI isn't set up for this site yet. In Vercel, open your team's AI Gateway tab and enable it, then redeploy. (On a local copy, add an AI_GATEWAY_API_KEY to .env.local.)",
      status: 503,
    }
  }
  if (/insufficient|credit|billing|payment|quota/i.test(text)) {
    return {
      code: "ai-no-credits",
      message: "The AI Gateway account is out of credits. Add credits in Vercel → AI Gateway, then try again.",
      status: 503,
    }
  }
  if (/GatewayRateLimitError/.test(name) || /rate.?limit|too many requests|429/i.test(text)) {
    return { code: "ai-rate-limited", message: "The AI service is busy right now. Wait a minute and try again.", status: 429 }
  }
  if (/GatewayModelNotFoundError/.test(name) || /model.*not.*found|unknown model/i.test(text)) {
    return { code: "ai-model-unavailable", message: "The AI model this feature uses isn't available. It needs to be switched to another model.", status: 503 }
  }
  if (/AbortError|TimeoutError/.test(name) || /aborted|timed? ?out/i.test(text)) {
    return { code: "ai-timeout", message: "The AI took too long to respond. Please try again.", status: 504 }
  }
  if (error instanceof SyntaxError || /unusable|parse|JSON/i.test(text)) {
    return { code: "ai-bad-response", message: "The AI returned an answer that couldn't be used. Please try again.", status: 502 }
  }
  return { code: "ai-error", message: "The AI service returned an error. Please try again in a moment.", status: 502 }
}

/** Pull the first JSON object out of a model reply, or throw a SyntaxError */
export function parseJsonObject<T>(text: string): T {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start < 0 || end <= start) throw new SyntaxError("The AI reply had no JSON object")
  return JSON.parse(text.slice(start, end + 1)) as T
}

// ---------------------------------------------------------------------------
// Claude (Anthropic SDK)
// ---------------------------------------------------------------------------

const claudeNotConfigured: AiFailure = {
  code: "ai-not-configured",
  message:
    "Claude isn't set up for this site yet. Add an ANTHROPIC_API_KEY environment variable in Vercel (and .env.local for local use), then redeploy.",
  status: 503,
}

/** Typed Anthropic SDK errors, most specific first, mapped to something a person can act on */
export function describeClaudeError(error: unknown): AiFailure {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return claudeNotConfigured
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { code: "ai-rate-limited", message: "Claude is handling a lot of requests right now. Wait a minute and try again.", status: 429 }
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return { code: "ai-timeout", message: "Claude took too long to respond. Please try again.", status: 504 }
  }
  if (error instanceof Anthropic.BadRequestError && /credit balance|billing/i.test(error.message)) {
    return {
      code: "ai-no-credits",
      message: "The Anthropic account is out of credits. Add credits in the Claude Console (Billing), then try again.",
      status: 503,
    }
  }
  if (error instanceof Anthropic.APIError && (error.status === 529 || (error.status ?? 0) >= 500)) {
    return { code: "ai-overloaded", message: "Claude is temporarily overloaded. Please try again in a moment.", status: 503 }
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { code: "ai-unreachable", message: "Couldn't reach Claude. Please try again.", status: 503 }
  }
  if (error instanceof Anthropic.AnthropicError && /ANTHROPIC_API_KEY|apiKey/i.test(error.message)) {
    return claudeNotConfigured
  }
  return describeAiError(error)
}

export function claudeIsConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export { claudeNotConfigured }
