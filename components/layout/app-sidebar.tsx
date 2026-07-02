import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Lightbulb,
  LogOut,
  Settings,
} from "lucide-react";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: BarChart3 },
  { href: "/podcasts", label: "Подкасты", icon: BookOpen },
  { href: "/insights", label: "Заметки", icon: Lightbulb },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function AppSidebar({ email }: { email: string }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card/90 backdrop-blur md:block">
        <div className="px-5 py-6">
          <BrandLogo email={email} />
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="absolute bottom-4 w-full px-3">
          <Button variant="ghost" type="submit" className="w-full justify-start">
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </form>
      </aside>

      <MobileBottomNav />
    </>
  );
}
