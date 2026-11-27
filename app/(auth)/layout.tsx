export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-sidebar px-4 py-10 text-foreground">
      {/* Full Pursuit logo (mark + wordmark), vector with a transparent background */}
      <img src="/pursuit-logo.svg" alt="Pursuit" width={632} height={724} className="h-24 w-auto" />
      {children}
      <p className="text-xs text-muted-foreground">Your search, on your terms.</p>
    </main>
  )
}
