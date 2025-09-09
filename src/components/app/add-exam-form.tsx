
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addExamAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { allCategories } from '@/lib/categories.tsx';
import { Loader2, Clock } from 'lucide-react';
import { useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

const sectionSchema = z.object({
  name: z.enum(['Reasoning Ability', 'Quantitative Aptitude', 'English Language', 'General Awareness']),
  questionsCount: z.literal(25),
  marksPerQuestion: z.literal(1),
  timeLimit: z.coerce.number().int().min(1, "Time limit is required"),
  cutoffMarks: z.coerce.number().min(0).optional(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Title is required'),
  category: z.enum(['Banking', 'SSC', 'Railway', 'Insurance', 'Other']),
  examType: z.enum(['Prelims', 'Mains']),
  status: z.enum(['published', 'draft']),
  
  sections: z.array(sectionSchema).length(4),
  
  negativeMarkPerWrong: z.literal(0.25),
  overallCutoff: z.coerce.number().min(0, "Cut-off cannot be negative"),
  hasSectionalCutoff: z.boolean().default(false),
  
  isAllTime: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}).refine(data => {
    if (data.hasSectionalCutoff) {
        return data.sections.every(s => s.cutoffMarks !== undefined && s.cutoffMarks >= 0);
    }
    return true;
}, {
    message: "Sectional cut-off marks are required for all sections when enabled.",
    path: ['sections'],
}).refine(data => data.isAllTime || (data.startTime && data.endTime), {
    message: "Start and end times are required unless the exam is available at all times.",
    path: ['startTime'],
});

type FormValues = z.infer<typeof formSchema>;

const standardSections: Array<z.infer<typeof sectionSchema>> = [
    { name: 'Reasoning Ability', questionsCount: 25, marksPerQuestion: 1, timeLimit: 20 },
    { name: 'Quantitative Aptitude', questionsCount: 25, marksPerQuestion: 1, timeLimit: 20 },
    { name: 'English Language', questionsCount: 25, marksPerQuestion: 1, timeLimit: 20 },
    { name: 'General Awareness', questionsCount: 25, marksPerQuestion: 1, timeLimit: 20 },
];

export function AddExamForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'Banking',
      examType: 'Prelims',
      status: 'published',
      sections: standardSections,
      negativeMarkPerWrong: 0.25,
      overallCutoff: 45,
      hasSectionalCutoff: false,
      isAllTime: false,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  const hasSectionalCutoff = form.watch('hasSectionalCutoff');
  const sections = form.watch('sections');
  const totalDuration = sections.reduce((acc, section) => acc + (section.timeLimit || 0), 0);
  
  const isAllTime = form.watch('isAllTime');

  useEffect(() => {
    if (isAllTime) {
      form.setValue('startTime', undefined);
      form.setValue('endTime', undefined);
    } else {
      form.setValue('startTime', form.getValues('startTime') || new Date().toISOString().slice(0, 16));
      form.setValue('endTime', form.getValues('endTime') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    }
  }, [isAllTime, form]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await addExamAction(data);
      if (result?.errors) {
        Object.entries(result.errors).forEach(([key, value]) => {
          if (value && key !== '_form' && key in form.getValues()) {
            form.setError(key as keyof FormValues, { message: (value as any)[0] });
          }
        });
        if (result.errors._form) {
          toast({ variant: 'destructive', title: 'Error', description: result.errors._form[0] });
        }
      } else if (result?.message) {
        toast({ title: 'Success', description: result.message });
        form.reset();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SBI PO Prelims Mock 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {(['Banking', 'SSC', 'Railway', 'Insurance', 'Other'] as const).map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="examType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Exam Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select an exam type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Prelims">Prelims</SelectItem>
                            <SelectItem value="Mains">Mains</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>

            <Separator />

            <div>
                <h3 className="text-lg font-medium mb-4">Exam Structure</h3>
                <Card className="bg-muted/30">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="font-semibold text-center p-2 rounded-md bg-background">Total Questions: 100</div>
                        <div className="font-semibold text-center p-2 rounded-md bg-background">Total Marks: 100</div>
                        <div className="font-semibold text-center p-2 rounded-md bg-background flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            Total Duration: {totalDuration} mins
                        </div>
                        <div className="font-semibold text-center p-2 rounded-md bg-background">Negative Marking: -{form.getValues('negativeMarkPerWrong')}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                        {fields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                            <h4 className="font-semibold mb-2">{field.name}</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                {field.questionsCount} Questions, {field.marksPerQuestion} Mark(s) each
                            </p>
                             <FormField
                                control={form.control}
                                name={`sections.${index}.timeLimit`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Time Limit (mins)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {hasSectionalCutoff && (
                                <FormField
                                    control={form.control}
                                    name={`sections.${index}.cutoffMarks`}
                                    render={({ field }) => (
                                        <FormItem className="mt-2">
                                        <FormLabel>Sectional Cutoff</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Enter cutoff" {...field} value={field.value ?? ''}/>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </Card>
                    ))}
                    </div>
                     <FormMessage>{form.formState.errors.sections?.message}</FormMessage>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Cutoff & Scheduling</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="overallCutoff"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Overall Cut-off Mark</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="hasSectionalCutoff"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full">
                                <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                <FormLabel>Enable Sectional Cutoff</FormLabel>
                                <FormDescription>
                                    Requires setting cutoffs for each section individually.
                                </FormDescription>
                                </div>
                            </FormItem>
                            )}
                        />
                    </div>
                     <div className="space-y-2 pt-2">
                        <FormField
                            control={form.control}
                            name="isAllTime"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                <FormLabel>Available at all times</FormLabel>
                                <FormDescription>
                                    If checked, this exam will not have a start or end date.
                                </FormDescription>
                                </div>
                            </FormItem>
                            )}
                        />
                    </div>

                    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 transition-opacity", isAllTime && "opacity-50 pointer-events-none")}>
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                <Input type="datetime-local" {...field} value={field.value || ''} disabled={isAllTime} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                <Input type="datetime-local" {...field} value={field.value || ''} disabled={isAllTime} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

          </div>
        </ScrollArea>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Exam
        </Button>
      </form>
    </Form>
  );
}
