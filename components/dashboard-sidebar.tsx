"use client"

import { useState } from "react"
import Link from "next/link"
import { BriefcaseBusiness, ChartNoAxesCombined, LayoutGrid, MessageSquareText, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useApplications } from "@/components/applications-provider"
import { useJobProfile } from "@/components/job-profile-provider"
import { isInterviewStatus } from "@/lib/applications"
import { profileInitials } from "@/lib/job-profile"

type DashboardPage = "overview" | "canvas" | "applications" | "interview" | "account"

const navigation: {
  id: DashboardPage
  label: string
  href: string
  icon: typeof ChartNoAxesCombined
  count?: string
  comingSoon?: boolean
}[] = [
  { id: "overview", label: "Overview", href: "/", icon: ChartNoAxesCombined },
  { id: "applications", label: "Applications", href: "/applications", icon: BriefcaseBusiness },
  { id: "interview", label: "Interview", href: "/interviews", icon: MessageSquareText },
  { id: "canvas", label: "Canvas", href: "/canvas", icon: LayoutGrid, comingSoon: true },
]

function PursuitLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
      <img src="/pursuit-mark.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
      <span
        className={`relative hidden h-6 shrink-0 overflow-hidden transition-[width,opacity] duration-300 md:block ${collapsed ? "w-0 opacity-0" : "w-[78px] opacity-100"}`}
      >
        <img src="/pursuit-wordmark.svg" alt="" width={76} height={24} className="h-6 w-[76px] max-w-none" />
      </span>
    </span>
  )
}

export function DashboardSidebar({ activePage }: { activePage: DashboardPage }) {
  const [collapsed, setCollapsed] = useState(false)
  const { profile, email, avatarUrl } = useJobProfile()
  const { applications } = useApplications()
  const displayName = profile.fullName.trim() || email
  const interviewCount = applications.filter((application) => isInterviewStatus(application.status)).length.toString()
  const applicationCount = applications.length.toString()

  return (
    <aside
      className={`sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-[68px] md:w-[224px]"}`}
    >
      <div
        className={`flex items-center px-2 py-4 transition-all duration-300 ${collapsed ? "flex-col gap-1 md:py-4" : "justify-center md:justify-between md:gap-3 md:px-5 md:py-6"}`}
      >
        <Link href="/" className="flex min-w-0 items-center justify-center" aria-label="Pursuit home">
          <PursuitLogo collapsed={collapsed} />
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="main-navigation"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
          className="hidden text-muted-foreground md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        </Button>
      </div>

      <div className={`px-2 pt-4 transition-all duration-300 ${collapsed ? "md:px-2" : "md:px-4"}`}>
        <p className={collapsed ? "hidden" : "hidden px-3 pb-2 text-[11px] font-medium text-muted-foreground md:block"}>
          WORKSPACE
        </p>
        <nav id="main-navigation" aria-label="Main navigation" className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = item.id === activePage
            const count =
              item.id === "interview"
                ? interviewCount
                : item.id === "applications"
                  ? applicationCount
                  : item.count
            const itemLabelClassName = collapsed
              ? "hidden"
              : "hidden min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-[max-width,opacity] duration-200 md:inline-block md:max-w-[9rem] md:opacity-100"
            const accessibleLabel = item.comingSoon
              ? `${item.label}, coming soon`
              : count
                ? `${item.label}, ${count}`
                : item.label

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={accessibleLabel}
                title={collapsed ? accessibleLabel : undefined}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center rounded-md px-2 py-2.5 text-sm transition-all duration-200 ${collapsed ? "justify-center gap-1 md:px-0" : "justify-center gap-3 md:justify-start md:px-3"} ${active ? "font-semibold text-primary" : item.comingSoon ? "text-muted-foreground hover:bg-muted/70" : "text-foreground hover:bg-muted/70"}`}
              >
                <Icon aria-hidden="true" className={`size-[17px] shrink-0 ${active ? "fill-primary text-primary" : ""}`} />
                <span className={itemLabelClassName}>{item.label}</span>
                {item.comingSoon && !collapsed && (
                  <span className="ml-auto hidden rounded-full border border-border px-1.5 py-px text-[10px] font-medium text-muted-foreground md:inline">
                    Soon
                  </span>
                )}
                {count && (
                  <span className={`text-[10px] text-muted-foreground md:text-xs ${collapsed ? "" : "ml-auto"}`}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className={`mt-auto pb-5 pt-8 transition-all duration-300 ${collapsed ? "px-2 md:px-2" : "px-2 md:px-6"}`}>
        <Link
          href="/account"
          aria-label={`Account: ${displayName}`}
          aria-current={activePage === "account" ? "page" : undefined}
          title={collapsed ? `Account: ${displayName}` : undefined}
          className={`flex items-center gap-3 rounded-md border-t border-border pt-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${collapsed ? "justify-center" : "justify-center md:justify-start"}`}
        >
          <Avatar className="size-8 shrink-0 border border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
              {profileInitials(displayName) || "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-xs font-medium">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{profile.headline || "Add your profile"}</p>
            </div>
          )}
        </Link>
        {!collapsed && <p className="mt-5 hidden text-[11px] text-muted-foreground md:block">Your search, on your terms.</p>}
      </div>
    </aside>
  )
}
