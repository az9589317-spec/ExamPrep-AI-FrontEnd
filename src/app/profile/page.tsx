
'use client';

import { useAuth } from '@/components/app/auth-provider';
import Header from '@/components/app/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/services/user';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  if (isAuthLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center p-4 md:p-8">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className='flex items-center gap-4'>
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className='space-y-2 flex-1'>
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-24 ml-auto" />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  if (!user) {
    // Redirect to login or show a message if the user is not authenticated.
    // This should ideally be handled by a higher-level component or route protection.
    router.push('/');
    return null;
  }

  const handleSave = async () => {
    if (!user || !displayName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Invalid Name',
            description: 'Display name cannot be empty.'
        });
        return;
    }

    setIsSaving(true);
    try {
        await updateUserProfile(user, { displayName });
        toast({
            title: 'Profile Updated',
            description: 'Your display name has been successfully updated.'
        });
        // The auth state will update automatically via onAuthStateChanged in AuthProvider
    } catch (error) {
        console.error('Failed to update profile:', error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update your profile. Please try again.'
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Profile</CardTitle>
                    <CardDescription>View and edit your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-semibold">{user.displayName}</h2>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input 
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>
                     <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving || displayName === user.displayName}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
