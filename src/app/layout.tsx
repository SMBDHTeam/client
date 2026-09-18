import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "부산 여행 일정",
  description: "부산 여행 일정을 짜는 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full bg-[#E3E8F0] antialiased">
      <body className="min-h-full flex flex-col bg-[#E3E8F0] text-zinc-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
