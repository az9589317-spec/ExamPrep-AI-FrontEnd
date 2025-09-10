
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateCustomMockExamAction } from '@/app/actions';
import { getUniqueSectionAndTopicNames } from '@/services/firestore';

const formSchema = z.object({
  section: z.string().min(1, 'Section is required.'),
  topic: z.string().optional(),
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
  const [sectionAndTopicData, setSectionAndTopicData] = useState<{ sections: string[], topicsBySection: Record<string, string[]> }>({ sections: [], topicsBySection: {} });
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      section: '',
      topic: '',
      difficulty: 'medium',
      numberOfQuestions: 10,
    },
  });

  useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      getUniqueSectionAndTopicNames()
        .then(data => {
          setSectionAndTopicData(data);
        })
        .catch(err => {
          console.error("Failed to load section/topic data", err);
          toast({ variant: 'destructive', title: "Error", description: "Could not load exam sections."})
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [open, toast]);

  const selectedSection = useWatch({
    control: form.control,
    name: 'section',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const examInput = {
        ...values,
      };
      
      const generatedExam = await generateCustomMockExamAction(examInput);

      toast({
        title: "Exam Generated!",
        description: "Your custom exam is ready. Redirecting you now...",
      });

      setOpen(false);
      form.reset();

      // In a real app, we would use the ID returned from the server action.
      // For now, we use a placeholder ID and store the exam data in session storage.
      sessionStorage.setItem('customExam', JSON.stringify(generatedExam));
      router.push('/exam/custom');

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
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('topic', '');
                  }} defaultValue={field.value} disabled={isLoadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingData ? "Loading sections..." : "Select a section"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sectionAndTopicData.sections.map(section => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic (Optional)</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedSection || isLoadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedSection ? "Select a section first" : "Select a topic"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(sectionAndTopicData.topicsBySection[selectedSection] || []).map(topic => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={isLoading || isLoadingData}>
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
