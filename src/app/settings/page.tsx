
'use client';

import Header from '@/components/app/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { allCategories } from '@/lib/categories';
import { getUserPreferences, updateUserPreferences } from '@/services/user';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/app/auth-provider';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserPreferences(user.uid)
                .then(prefs => {
                    setSelectedCategories(new Set(prefs));
                })
                .catch(err => {
                    console.error("Failed to load user preferences", err);
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not load your preferences.' });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [user, toast]);

    const handleCategoryToggle = (categoryName: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName);
            } else {
                newSet.add(categoryName);
            }
            return newSet;
        });
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        
        setIsSaving(true);
        try {
            await updateUserPreferences(user.uid, Array.from(selectedCategories));
            toast({
                title: 'Preferences Saved',
                description: 'Your exam preferences have been updated.'
            });
        } catch (error) {
            console.error("Failed to save preferences", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your preferences. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const categoriesToDisplay = allCategories.filter(cat => cat.name !== 'Daily Quiz');

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Your Preferences</CardTitle>
                            <CardDescription>Select the exam categories you are interested in. This will help us personalize your experience.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isAuthLoading || isLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full rounded-full" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {categoriesToDisplay.map(category => {
                                        const isSelected = selectedCategories.has(category.name);
                                        return (
                                            <button
                                                key={category.name}
                                                onClick={() => handleCategoryToggle(category.name)}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                                                    isSelected 
                                                        ? "bg-primary text-primary-foreground border-transparent" 
                                                        : "bg-transparent hover:bg-accent"
                                                )}
                                            >
                                                {isSelected && <Check className="h-4 w-4" />}
                                                {category.icon}
                                                {category.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                             <div className="mt-8 flex justify-end">
                                <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
