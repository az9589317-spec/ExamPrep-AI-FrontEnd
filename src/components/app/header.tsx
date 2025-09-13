
'use client';

import { BrainCircuit, CircleUser, Menu, Search, MoreVertical, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
import { useAuth } from './auth-provider';
import { signInWithGoogle, signOut } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { createUserIfNotExists } from '@/services/user';

export default function Header() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleLogin = async () => {
    const { user, isCancelled } = await signInWithGoogle();
    if (isCancelled) return;

    if (user) {
      await createUserIfNotExists(user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.displayName}!`,
      });
    } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not sign you in with Google. Please try again.",
        });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/mock-tests?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const UserMenu = () => (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} data-ai-hint="person avatar"/>
                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <nav className="hidden w-full flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base whitespace-nowrap"
        >
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">ExamPrep AI</span>
        </Link>
        <div className="flex w-full items-center gap-4 md:ml-auto md:justify-end md:gap-2 lg:gap-4">
          <form className="hidden flex-initial sm:block" onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search exams..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Toggle main menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/mock-tests">Mock Tests</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/analytics">Analytics</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user ? <UserMenu /> : (
            <Button onClick={handleLogin}>
                <LogIn className="mr-2 h-4 w-4" />
                Login
            </Button>
          )}
        </div>
      </nav>
      {/* Mobile Header */}
      <div className="flex w-full items-center justify-between md:hidden">
        <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold whitespace-nowrap"
            >
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl">ExamPrep AI</span>
        </Link>
        <div className="flex items-center gap-2">
            {user ? (
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
                            className="flex items-center gap-2 text-lg font-semibold whitespace-nowrap"
                            >
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            <span className="font-headline text-xl">ExamPrep AI</span>
                            </Link>
                        </SheetTitle>
                    </SheetHeader>
                    <form className="mt-4" onSubmit={handleSearch}>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search exams..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </form>
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
                                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} data-ai-hint="person avatar"/>
                                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span>My Account</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)]">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Button variant="outline" onClick={handleLogin}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                </Button>
            )}
        </div>
      </div>
    </header>
  );
}
