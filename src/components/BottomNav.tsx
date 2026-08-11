"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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

const LEFT_TABS = TABS.slice(0, 2);
const RIGHT_TABS = TABS.slice(2);

function NavTab({ href, label, icon, iconInactive, active }: {
  href: string;
  label: string;
  icon: typeof homeIcon;
  iconInactive: typeof homeIcon;
  active: boolean;
}) {
  const color = active ? "text-[#2E7DF2]" : "text-zinc-400";
  return (
    <li className="flex-1">
      <Link href={href} className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${color}`}>
        <Image src={active ? icon : iconInactive} alt="" width={30} height={30} loading="eager" />
        {label}
      </Link>
    </li>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isCommunity = pathname.startsWith("/community");

  if (isCommunity) {
    return (
      <nav className="shrink-0 border-t border-black/5 bg-white">
        <ul className="flex items-center">
          {LEFT_TABS.map(({ href, label, icon, iconInactive }) => (
            <NavTab key={href} href={href} label={label} icon={icon} iconInactive={iconInactive} active={pathname.startsWith(href)} />
          ))}
          <li className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/community/new")}
              className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2E7DF2] to-[#17B89B] text-white shadow-lg -translate-y-1 transition-transform duration-200 ease-out hover:scale-125 active:scale-95"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </li>
          {RIGHT_TABS.map(({ href, label, icon, iconInactive }) => (
            <NavTab key={href} href={href} label={label} icon={icon} iconInactive={iconInactive} active={pathname.startsWith(href)} />
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="shrink-0 border-t border-black/5 bg-white">
      <ul className="flex">
        {TABS.map(({ href, label, icon, iconInactive }) => (
          <NavTab key={href} href={href} label={label} icon={icon} iconInactive={iconInactive} active={pathname.startsWith(href)} />
        ))}
      </ul>
    </nav>
  );
}
