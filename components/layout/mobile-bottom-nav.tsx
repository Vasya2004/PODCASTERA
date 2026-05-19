"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, Lightbulb, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: BarChart3 },
  { href: "/podcasts", label: "Подкасты", icon: BookOpen },
  { href: "/insights", label: "Заметки", icon: Lightbulb },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href);
    }
  }, [router]);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-[1.6rem] border border-border/80 bg-card/75 px-2 py-2 shadow-lg backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-2 text-xs font-medium transition-[background-color,transform,color] duration-150 active:scale-[0.97] active:bg-muted/80",
              isActive
                ? "bg-foreground text-background active:bg-foreground/90"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
