import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"

// /api/cron routes check their own CRON_SECRET instead of a user session
const publicPaths = ["/login", "/signup", "/forgot-password", "/auth", "/api/cron"]

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  // Refreshes the session cookie if needed. Do not put code between
  // createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims)
  const { pathname } = request.nextUrl
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (!isSignedIn && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in to use this feature." }, { status: 401 })
    }

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`
    return redirectWithCookies(loginUrl, response)
  }

  if (isSignedIn && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = "/"
    homeUrl.search = ""
    return redirectWithCookies(homeUrl, response)
  }

  return response
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url)
  for (const cookie of source.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}
