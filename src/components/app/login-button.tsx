
'use client';

import { LogIn } from 'lucide-react';
import { useAuth } from '@/components/app/auth-provider';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginButton() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    const user = await signInWithGoogle();
    if (user) {
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

  return (
    <Button onClick={handleLogin}>
      <LogIn className="mr-2 h-4 w-4" />
      Login
    </Button>
  );
}
