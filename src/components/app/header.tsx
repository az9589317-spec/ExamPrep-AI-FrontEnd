

import { BrainCircuit, CircleUser, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ExamGenerator from './exam-generator';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <nav className="hidden w-full flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">ExamPrep AI</span>
        </Link>
        <Link
          href="/dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Dashboard
        </Link>
        <Link
          href="/mock-tests"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Mock Tests
        </Link>
        <Link
          href="/analytics"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Analytics
        </Link>
        <div className="flex w-full items-center gap-4 md:ml-auto md:justify-end md:gap-2 lg:gap-4">
          <form className="hidden flex-initial sm:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search exams..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://picsum.photos/32/32" alt="User" data-ai-hint="person avatar"/>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/admin">Admin Panel</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      {/* Mobile Header */}
      <div className="flex w-full items-center justify-between md:hidden">
        <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
            >
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl">ExamPrep AI</span>
        </Link>
        <div className="flex items-center gap-2">
            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>
                        <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold"
                        >
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span className="font-headline text-xl">ExamPrep AI</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-6 text-lg font-medium mt-4">
                    <Link href="/dashboard" className="hover:text-foreground">
                    Dashboard
                    </Link>
                    <Link
                    href="/mock-tests"
                    className="text-muted-foreground hover:text-foreground"
                    >
                    Mock Tests
                    </Link>
                    <Link
                    href="/analytics"
                    className="text-muted-foreground hover:text-foreground"
                    >
                    Analytics
                    </Link>
                </nav>
                 <div className="absolute bottom-4 left-4 right-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="outline" className="w-full justify-start gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src="https://picsum.photos/32/32" alt="User" data-ai-hint="person avatar"/>
                                <AvatarFallback>U</AvatarFallback>
                             </Avatar>
                             <span>My Account</span>
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)]">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/admin">Admin Panel</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
