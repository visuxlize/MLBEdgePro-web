import { AppSidebar } from "@/components/web-tool/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppSidebar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
