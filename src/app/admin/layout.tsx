'use client';

import type { Metadata } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/app/admin-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/app/auth-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [isLoading, user, pathname, router]);

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

  if (!user) {
    return null; // Or a loading spinner, while redirecting
  }

  return (
    <>
      <SidebarProvider>
          <AdminSidebar />
          <SidebarInset>
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
          </SidebarInset>
      </SidebarProvider>
    </>
  );
}
