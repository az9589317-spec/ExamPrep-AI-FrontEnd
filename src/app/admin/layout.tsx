'use client';

import type { Metadata } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/app/admin-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd have a more robust auth check.
    // For now, we'll use sessionStorage.
    const isAdmin = sessionStorage.getItem('admin-auth') === 'true';
    if (!isAdmin && pathname !== '/admin/login') {
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </div>
        <main className="flex-1 p-8">
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        {children}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <>
      {/* <p className="text-sm">Note: Admin panel metadata is not being applied due to client-side rendering for auth.</p> */}
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
