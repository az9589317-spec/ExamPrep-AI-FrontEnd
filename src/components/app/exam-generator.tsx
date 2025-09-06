"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateCustomMockExamAction } from '@/app/actions';

const formSchema = z.object({
  topics: z.string().min(3, 'Please enter at least one topic.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(5, 'Minimum 5 questions.')
    .max(50, 'Maximum 50 questions.'),
});

export default function ExamGenerator() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topics: '',
      difficulty: 'medium',
      numberOfQuestions: 10,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const topicsArray = values.topics.split(',').map(t => t.trim()).filter(Boolean);
      if (topicsArray.length === 0) {
        form.setError('topics', { message: 'Please enter valid topics.' });
        return;
      }
      
      const examInput = {
        ...values,
        topics: topicsArray,
      }
      
      // In a real app, you would save the generated exam to a database and get an ID.
      // Here, we'll just simulate this by calling the action.
      await generateCustomMockExamAction(examInput);

      toast({
        title: "Exam Generated!",
        description: "Your custom exam is ready. Redirecting you now...",
      });

      setOpen(false);
      form.reset();

      // For this demo, we redirect to a placeholder exam page.
      // The ID would come from the database in a real implementation.
      router.push('/exam/custom-exam-123');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Exam',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Generate Exam
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate Custom Mock Exam</DialogTitle>
          <DialogDescription>
            Create a personalized test based on your focus areas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topics</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Algebra, Puzzles, Reading Comprehension" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questions</FormLabel>
                    <FormControl>
                      <Input type="number" min="5" max="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Exam'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
