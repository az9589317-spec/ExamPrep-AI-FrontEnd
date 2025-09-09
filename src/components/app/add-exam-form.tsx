
'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { Loader2, Clock, PlusCircle, Trash2, Settings, Shield, Calendar, ListChecks } from 'lucide-react';
import { useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { v4 as uuidv4 } from 'uuid';
import { allCategories, categoryNames } from '@/lib/categories';
import type { Exam } from '@/lib/data-structures';
import { format } from 'date-fns';

const sectionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  name: z.string().min(2, "Section name must be at least 2 characters."),
  questionsCount: z.coerce.number().min(1, "Must have at least 1 question."),
  timeLimit: z.coerce.number().optional(),
  cutoffMarks: z.coerce.number().optional(),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.coerce.number().optional(),
  allowQuestionNavigation: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  showCalculator: z.boolean().default(false),
  instructions: z.string().optional(),
});


const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Exam name is required and must be at least 3 characters.'),
  category: z.string().min(1, 'Category is required.'),
  examType: z.enum(['Prelims', 'Mains', 'Mock Test', 'Practice', 'Custom']),
  status: z.enum(['published', 'draft', 'archived']),
  sections: z.array(sectionSchema).min(1, "An exam must have at least one section."),
  durationMin: z.coerce.number().min(1, "Total duration must be at least 1 minute."),
  hasOverallTimer: z.boolean().default(true),
  hasSectionTimer: z.boolean().default(true),
  allowBackNavigation: z.boolean().default(true),
  autoSubmit: z.boolean().default(true),
  showResults: z.boolean().default(true),
  allowReAttempt: z.boolean().default(false),
  maxAttempts: z.coerce.number().optional(),
  passingCriteria: z.enum(['overall', 'sectional', 'both']),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  requireProctoring: z.boolean().default(false),
  lockBrowser: z.boolean().default(false),
  preventCopyPaste: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  showQuestionNumbers: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  showExplanations: z.boolean().default(true),
  allowResultDownload: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return format(d, "yyyy-MM-dd'T'HH:mm");
    } catch (e) {
        return '';
    }
}

const getDefaultValues = (initialData?: Exam, defaultCategory?: string): FormValues => {
    if (initialData) {
        return {
            ...initialData,
            durationMin: initialData.durationMin || 0,
            startTime: formatDateForInput(initialData.startTime as unknown as Date | null),
            endTime: formatDateForInput(initialData.endTime as unknown as Date | null),
        };
    }
    return {
      name: '',
      category: defaultCategory || '',
      examType: 'Mock Test',
      status: 'draft',
      sections: [
        { id: uuidv4(), name: 'Quantitative Aptitude', questionsCount: 25, negativeMarking: true, negativeMarkValue: 0.25, timeLimit: 20, allowQuestionNavigation: true, randomizeQuestions: false, showCalculator: false, instructions: '' },
        { id: uuidv4(), name: 'Reasoning Ability', questionsCount: 25, negativeMarking: true, negativeMarkValue: 0.25, timeLimit: 20, allowQuestionNavigation: true, randomizeQuestions: false, showCalculator: false, instructions: '' },
      ],
      durationMin: 40,
      hasOverallTimer: true,
      hasSectionTimer: true,
      allowBackNavigation: true,
      autoSubmit: true,
      showResults: true,
      allowReAttempt: false,
      passingCriteria: 'both',
      requireProctoring: false,
      lockBrowser: false,
      preventCopyPaste: false,
      randomizeOptions: false,
      showQuestionNumbers: true,
      showCorrectAnswers: true,
      showExplanations: true,
      allowResultDownload: false,
      startTime: '',
      endTime: '',
    };
};


export function AddExamForm({ initialData, defaultCategory, onFinished }: { initialData?: Exam, defaultCategory?: string, onFinished?: () => void}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(initialData, defaultCategory),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sections',
  });
  
  const sections = useWatch({ control: form.control, name: 'sections' });
  const totalDuration = sections.reduce((acc, section) => acc + (section.timeLimit || 0), 0);
  const totalQuestions = sections.reduce((acc, section) => acc + (section.questionsCount || 0), 0);
  
  useEffect(() => {
    form.setValue('durationMin', totalDuration);
  }, [totalDuration, form]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await addExamAction(data);
      if (result?.errors) {
        Object.entries(result.errors).forEach(([key, value]) => {
          if (value && key in form.getValues()) {
            form.setError(key as keyof FormValues, { message: value[0] });
          }
        });
        if (result.errors._form) {
            toast({ variant: 'destructive', title: 'Error creating exam', description: result.errors._form[0] });
        } else {
            toast({ variant: 'destructive', title: 'Invalid Fields', description: 'Please correct the errors and try again.' });
        }
      } else if (result?.message) {
        toast({ title: 'Success!', description: result.message });
        form.reset();
        onFinished?.();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ultimate Banking Championship" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {categoryNames.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Mock Test">Mock Test</SelectItem>
                                <SelectItem value="Practice">Practice</SelectItem>
                                <SelectItem value="Prelims">Prelims</SelectItem>
                                <SelectItem value="Mains">Mains</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Sections</span>
                         <Button type="button" size="sm" variant="outline" onClick={() => append({ id: uuidv4(), name: '', questionsCount: 10, negativeMarking: false, timeLimit: 15, allowQuestionNavigation: true, randomizeQuestions: false, showCalculator: false, instructions: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div><p className="text-sm text-muted-foreground">Total Questions</p><p className="font-bold text-lg">{totalQuestions}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total Marks</p><p className="font-bold text-lg">{initialData?.totalMarks || 0}</p></div>
                        <div><p className="text-sm text-muted-foreground">Total Duration</p><p className="font-bold text-lg">{totalDuration} min</p></div>
                        <div><p className="text-sm text-muted-foreground">Total Sections</p><p className="font-bold text-lg">{fields.length}</p></div>
                    </div>
                     {fields.map((field, index) => (
                        <Card key={field.id} className="relative p-4 bg-background">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <div className="space-y-4">
                                <FormField control={form.control} name={`sections.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Section Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name={`sections.${index}.questionsCount`} render={({ field }) => (
                                        <FormItem><FormLabel>No. of Questions</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`sections.${index}.timeLimit`} render={({ field }) => (
                                        <FormItem><FormLabel>Time (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name={`sections.${index}.cutoffMarks`} render={({ field }) => (
                                        <FormItem><FormLabel>Cutoff</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                 <FormField
                                    control={form.control}
                                    name={`sections.${index}.instructions`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Instructions (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Specific instructions for this section" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                    <FormField control={form.control} name={`sections.${index}.negativeMarking`} render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Negative Marking</FormLabel></FormItem>
                                    )}/>
                                    {form.watch(`sections.${index}.negativeMarking`) && (
                                        <FormField control={form.control} name={`sections.${index}.negativeMarkValue`} render={({ field }) => (
                                            <FormItem><FormLabel className="sr-only">Negative Mark Value</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Value" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    )}
                                     <FormField control={form.control} name={`sections.${index}.showCalculator`} render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Show Calculator</FormLabel></FormItem>
                                    )}/>
                                </div>
                            </div>
                        </Card>
                    ))}
                     <FormMessage>{form.formState.errors.sections?.message || form.formState.errors.sections?.root?.message}</FormMessage>
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className='flex items-center gap-2'><Settings /> General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="passingCriteria" render={({ field }) => (
                        <FormItem><FormLabel>Passing Criteria</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                            <SelectItem value="overall">Overall Cutoff</SelectItem>
                            <SelectItem value="sectional">Sectional Cutoff</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                        </SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="maxAttempts" render={({ field }) => (
                        <FormItem><FormLabel>Max Attempts (Optional)</FormLabel><FormControl><Input type="number" placeholder="Leave blank for unlimited" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <FormField control={form.control} name="hasOverallTimer" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Overall Timer</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="hasSectionTimer" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Section Timer</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="allowBackNavigation" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Allow Back Navigation</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="autoSubmit" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Auto Submit</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="showResults" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Show Results Immediately</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="allowReAttempt" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Allow Re-attempts</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="randomizeOptions" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Randomize Options</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="showQuestionNumbers" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Show Question Numbers</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="showCorrectAnswers" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Show Correct Answers</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="showExplanations" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Show Explanations</FormLabel></FormItem>
                    )}/>
                     <FormField control={form.control} name="allowResultDownload" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Allow Result Download</FormLabel></FormItem>
                    )}/>
                 </div>
              </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle className='flex items-center gap-2'><Calendar /> Scheduling (Optional)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                            <Input type="datetime-local" {...field} value={field.value || ''} />
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
                            <Input type="datetime-local" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className='flex items-center gap-2'><Shield /> Security (Optional)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                 <FormField control={form.control} name="requireProctoring" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-md border bg-background"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Require Proctoring</FormLabel></FormItem>
                )}/>
                 <FormField control={form.control} name="lockBrowser" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-md border bg-background"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Lock Browser</FormLabel></FormItem>
                )}/>
                 <FormField control={form.control} name="preventCopyPaste" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 p-3 rounded-md border bg-background"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Prevent Copy/Paste</FormLabel></FormItem>
                )}/>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onFinished?.()}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Exam'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
