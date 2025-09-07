
'use client';

import type { Metadata } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/app/admin-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/app/auth-provider";
import { isAdminUser } from "@/lib/auth-config";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        if (pathname !== '/admin/login') {
            router.replace('/admin/login');
        }
      } else if (!isAdminUser(user.email)) {
        // If the user is not an admin, redirect them to the homepage.
        router.replace('/');
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading || !user) {
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

  // If we are here, the user is an admin.
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
