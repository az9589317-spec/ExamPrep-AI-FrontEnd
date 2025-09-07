
// src/app/admin/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/app/auth-provider';
import { signInWithGoogle } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

export default function AdminLoginPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isLoading && user) {
            router.push('/admin');
        }
    }, [user, isLoading, router]);

    const handleLogin = async () => {
        const user = await signInWithGoogle();
        if (user) {
            toast({
                title: "Login Successful",
                description: "Redirecting to the admin dashboard...",
            });
            router.push('/admin');
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Could not sign you in with Google. Please try again.",
            });
        }
    };
    
    if (isLoading || user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
        <CardDescription>
          Please sign in with Google to access the admin panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleLogin} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
