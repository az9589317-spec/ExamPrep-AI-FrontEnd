'use client';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
  } from '@/components/ui/sidebar';
import Link from 'next/link';
import { BrainCircuit, LayoutDashboard, FileText, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path || (path !== '/admin' && pathname.startsWith(path));

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            <span className="font-headline text-xl">ExamPrep AI</span>
                        </Link>
                        <SidebarTrigger className="md:hidden"/>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/admin">
                            <SidebarMenuButton isActive={isActive('/admin')} tooltip={{children: 'Dashboard'}}>
                                <LayoutDashboard />
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/users">
                            <SidebarMenuButton isActive={isActive('/admin/users')} tooltip={{children: 'Users'}}>
                                <Users />
                                <span>Users</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}
