import AppTabShell from "@/components/AppTabShell";

export default function AppTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppTabShell>{children}</AppTabShell>;
}
