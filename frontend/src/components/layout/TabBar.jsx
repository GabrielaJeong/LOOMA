"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "홈", icon: Home, matcher: (pathname) => pathname.startsWith("/home") },
  { href: "/mypage", label: "내 정보", icon: UserRound, matcher: (pathname) => pathname.startsWith("/mypage") },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[393px] -translate-x-1/2 items-start justify-around border-t border-[#E2E9F4] bg-white px-8 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3">
      {tabs.map(({ href, label, icon: Icon, matcher }) => {
        const isActive = matcher(pathname);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-[84px] flex-col items-center gap-1",
              isActive ? "text-[#1F2733]" : "text-[#BEC9DD]"
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2.1} />
            <span className={cn("text-[13px] font-bold tracking-[-0.02em]", !isActive && "font-medium")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
