'use client';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from '@/components/ui/sidebar';
import Link from 'next/link';
import { BrainCircuit, LayoutDashboard, FileText, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    <Link href="/" className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span className="font-headline text-xl">ExamPrep AI</span>
                    </Link>
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
                         <Link href="/admin/exams">
                            <SidebarMenuButton isActive={isActive('/admin/exams')} tooltip={{children: 'Exams'}}>
                                <FileText />
                                <span>Exams</span>
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
