import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="grid size-28 place-items-center rounded-2xl bg-black/5 text-sm text-zinc-400">
          로고
        </div>
        <p className="text-center text-zinc-600">크하 하 하 하 하 하 하</p>
      </div>

      <Link
        href="/home"
        className="mb-12 w-full rounded-full bg-[#2E7DF2] py-3.5 text-center font-medium text-white transition-colors hover:bg-[#2569d8]"
      >
        구글로 시작하기
      </Link>
    </div>
  );
}
