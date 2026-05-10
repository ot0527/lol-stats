import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SyncButton } from "@/components/SyncButton";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "LoL Personal Stats",
  description: "League of Legends 個人戦績分析ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <TooltipProvider>
          <header className="lol-header sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="text-lg font-bold gold-text tracking-wider mr-6 hover:opacity-80 transition-opacity"
                >
                  LoL Stats
                </Link>
                <NavLink href="/">ダッシュボード</NavLink>
                <NavLink href="/matchup">マッチアップ</NavLink>
                <NavLink href="/champion">チャンピオン</NavLink>
              </nav>
              <SyncButton />
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      {children}
    </Link>
  );
}
