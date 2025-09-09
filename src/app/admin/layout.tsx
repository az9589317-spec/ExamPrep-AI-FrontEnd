
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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
  const isUserAdmin = !isLoading && user && isAdminUser(user.email);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // If not logged in, redirect to login page if not already there.
        if (pathname !== '/admin/login') {
            router.replace('/admin/login');
        }
      } else if (!isUserAdmin) {
        // If logged in but not an admin, redirect to the homepage.
        router.replace('/');
      } else {
        // If logged in as an admin, redirect to dashboard if on the login page.
        if (pathname === '/admin/login') {
            router.replace('/admin');
        }
      }
    }
  }, [isLoading, user, isUserAdmin, pathname, router]);

  const LoadingSkeleton = () => (
    <div className="flex min-h-screen">
      <div className="w-64 p-4 border-r bg-muted/40">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>
      <main className="flex-1 p-8">
        <Skeleton className="h-32 w-full" />
      </main>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // If user is an admin but on the login page, a redirect is in progress.
  if (isUserAdmin && pathname === '/admin/login') {
    return <LoadingSkeleton />;
  }
  
  // If we are on the login page (and user is not an admin), show the page.
  if (pathname === '/admin/login') {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            {children}
        </div>
    );
  }

  // If user is an admin and on an admin page, show the admin layout.
  if (isUserAdmin) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
              <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                  {children}
              </main>
            </SidebarInset>
        </SidebarProvider>
    );
  }

  // For any other state (e.g., non-admin on a protected route before redirect),
  // show a loader.
  return <LoadingSkeleton />;
}
