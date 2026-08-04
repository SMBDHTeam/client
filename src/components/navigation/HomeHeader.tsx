import Image from "next/image";
import nubiLogo from "@/assets/icons/header/nubi_logo_horizontal.png";
import bellIcon from "@/assets/icons/notification-bell-inactive.png";

export default function HomeHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-[#FFFFFF]/90 px-5 py-4 backdrop-blur">
      <Image src={nubiLogo} alt="누비" className="h-9 w-auto" priority />

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="알림"
          className="grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-black/5"
        >
          <Image src={bellIcon} alt="" width={30} height={30} />
        </button>
        <button
          type="button"
          aria-label="내 정보"
          className="size-9 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B]"
        />
      </div>
    </header>
  );
}
