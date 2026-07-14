"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import homeIcon from "@/assets/icons/nav/nav-home.png";
import homeIconInactive from "@/assets/icons/nav/nav-home-inactive.png";
import scheduleIcon from "@/assets/icons/nav/nav-schedule.png";
import scheduleIconInactive from "@/assets/icons/nav/nav-schedule-inactive.png";
import communityIcon from "@/assets/icons/nav/nav-community.png";
import communityIconInactive from "@/assets/icons/nav/nav-community-inactive.png";
import profileIcon from "@/assets/icons/nav/nav-profile.png";
import profileIconInactive from "@/assets/icons/nav/nav-profile-inactive.png";

const TABS = [
  { href: "/home", label: "홈", icon: homeIcon, iconInactive: homeIconInactive },
  { href: "/trips", label: "일정", icon: scheduleIcon, iconInactive: scheduleIconInactive },
  { href: "/community", label: "커뮤니티", icon: communityIcon, iconInactive: communityIconInactive },
  { href: "/profile", label: "내 정보", icon: profileIcon, iconInactive: profileIconInactive },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-black/5 bg-white">
      <ul className="flex">
        {TABS.map(({ href, label, icon, iconInactive }) => {
          const active = pathname.startsWith(href);
          const color = active ? "text-[#2E7DF2]" : "text-zinc-400";
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${color}`}
              >
                <Image
                  src={active ? icon : iconInactive}
                  alt=""
                  width={30}
                  height={30}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

