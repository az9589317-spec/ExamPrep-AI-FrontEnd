import type { Metadata } from "next";
import AdminSidebar from "@/components/app/admin-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Admin - ExamPrep AI",
  description: "Admin panel for ExamPrep AI.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
