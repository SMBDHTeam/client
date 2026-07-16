import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#E3E8F0]`}
    >
      <body className="mx-auto w-full max-w-lg min-h-full flex flex-col bg-[#F4F5F7] text-zinc-900 shadow-[0_0_60px_-15px_rgba(15,23,42,0.25)]">
        {children}
      </body>
    </html>
  );
}
