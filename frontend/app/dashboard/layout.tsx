import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simtestlab EMS",
  description: "Real-time energy monitoring dashboard created by Simtestlab Sweden AB. Visit simtestlab.se for more information.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {children}
    </div>
  );
}
