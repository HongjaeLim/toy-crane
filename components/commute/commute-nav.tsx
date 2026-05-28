"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "오늘", icon: Home },
  { href: "/mileage", label: "마일리지", icon: CalendarDays },
] as const;

export function CommuteNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 grid grid-cols-2 gap-2 border-t pt-3">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm",
              active ? "bg-muted font-bold text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
