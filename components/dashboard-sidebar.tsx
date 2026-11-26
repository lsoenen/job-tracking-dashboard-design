import Link from "next/link"
import { BriefcaseBusiness, LayoutDashboard, ListChecks } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const pursuitLogoSource =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_fqy74wfqy74wfqy7-x8BCS3oCuas7TgUq32jxqsnj5s9Vvz.jpeg"

type DashboardPage = "overview" | "applications" | "next-steps"

const navigation: {
  id: DashboardPage
  label: string
  href: string
  icon: typeof LayoutDashboard
  count?: string
}[] = [
  { id: "overview", label: "Overview", href: "/", icon: LayoutDashboard },
  { id: "applications", label: "Applications", href: "/applications", icon: BriefcaseBusiness, count: "48" },
  { id: "next-steps", label: "Next steps", href: "/#next-steps", icon: ListChecks, count: "3" },
]

function PursuitLogo() {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
      <span className="relative size-8 shrink-0 overflow-hidden rounded-sm bg-sidebar">
        <img
          src={pursuitLogoSource}
          alt=""
          className="absolute left-[-12px] top-[-4px] size-[56px] max-w-none mix-blend-multiply"
        />
      </span>
      <span className="relative hidden h-6 w-[78px] shrink-0 overflow-hidden md:block">
        <img
          src={pursuitLogoSource}
          alt=""
          className="absolute left-[-25px] top-[-85px] size-[128px] max-w-none mix-blend-multiply"
        />
      </span>
    </span>
  )
}

export function DashboardSidebar({ activePage }: { activePage: DashboardPage }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[68px] shrink-0 flex-col border-r border-border bg-sidebar md:w-[224px]">
      <Link href="/" className="flex items-center justify-center px-2 py-5 md:justify-start md:px-6 md:py-6" aria-label="Pursuit home">
        <PursuitLogo />
      </Link>

      <div className="px-2 pt-4 md:px-4">
        <p className="hidden px-3 pb-2 text-[11px] font-medium text-muted-foreground md:block">WORKSPACE</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = item.id === activePage

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.count ? `${item.label}, ${item.count}` : item.label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors md:justify-start md:px-3 ${active ? "font-semibold text-primary" : "text-foreground hover:bg-muted/70"}`}
              >
                <Icon aria-hidden="true" className={`size-[17px] shrink-0 ${active ? "fill-primary text-primary" : ""}`} />
                <span className="hidden md:inline">{item.label}</span>
                {item.count && <span className="ml-auto hidden text-xs text-muted-foreground md:inline">{item.count}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto px-2 pb-5 pt-8 md:px-6">
        <div className="flex items-center justify-center gap-3 border-t border-border pt-4 md:justify-start">
          <Avatar className="size-8 shrink-0 border border-border">
            <AvatarImage src="/profile-avatar.png" alt="Alex Taylor" />
            <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">AT</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-xs font-medium">Alex Taylor</p>
            <p className="truncate text-[11px] text-muted-foreground">Product designer</p>
          </div>
        </div>
        <p className="mt-5 hidden text-[11px] text-muted-foreground md:block">Your search, on your terms.</p>
      </div>
    </aside>
  )
}
