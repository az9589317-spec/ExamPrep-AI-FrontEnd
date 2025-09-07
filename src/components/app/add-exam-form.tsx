
'use client';

import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().int().min(1, 'Duration must be a positive number'),
  negativeMarkPerWrong: z.coerce.number().min(0, 'Negative marking cannot be negative'),
  cutoff: z.coerce.number().min(0, 'Cut-off cannot be negative'),
  isAllTime: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  visibility: z.enum(['published', 'draft']),
}).refine(data => {
    if (!data.isAllTime) {
        return !!data.startTime && !!data.endTime;
    }
    return true;
}, {
    message: "Start and end times are required unless the exam is available at all times.",
    path: ['startTime'], // You can associate the error with a specific field
});

type FormValues = z.infer<typeof formSchema>;

const initialState = {
  message: '',
  errors: {},
};

interface AddExamFormProps {
  defaultCategory?: string;
}

export function AddExamForm({ defaultCategory }: AddExamFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(addExamAction, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: defaultCategory || 'Banking',
      durationMin: 60,
      negativeMarkPerWrong: 0.25,
      cutoff: 40,
      isAllTime: false,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      visibility: 'published',
    },
  });

  const isAllTime = form.watch('isAllTime');

  useEffect(() => {
    if (state?.message && Object.keys(state.errors).length === 0) {
      toast({ title: 'Success', description: state.message });
      form.reset();
    } else if (state?.errors && Object.keys(state.errors).length > 0) {
        Object.entries(state.errors).forEach(([key, value]) => {
            if(value && key !== '_form' && key in form.getValues()) {
                form.setError(key as keyof FormValues, { message: value[0] });
            }
        });
        if (state.errors._form) {
             toast({ variant: 'destructive', title: 'Error', description: state.errors._form[0] });
        }
    }
  }, [state, toast, form]);

  const onFormSubmit = (data: FormData) => {
    const isAllTimeChecked = data.get('isAllTime') === 'on';
    if(isAllTimeChecked) {
      data.delete('startTime');
      data.delete('endTime');
    }
    formAction(data);
  }

  return (
    <ScrollArea className="h-[70vh] pr-6">
      <Form {...form}>
        <form action={onFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                      <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="Banking">Banking</SelectItem>
                          <SelectItem value="SSC">SSC</SelectItem>
                          <SelectItem value="Railway">Railway</SelectItem>
                          <SelectItem value="UPSC">UPSC</SelectItem>
                          <SelectItem value="JEE">JEE</SelectItem>
                          <SelectItem value="NEET">NEET</SelectItem>
                          <SelectItem value="CAT">CAT</SelectItem>
                          <SelectItem value="CLAT">CLAT</SelectItem>
                          <SelectItem value="Daily Quiz">Daily Quiz</SelectItem>
                          <SelectItem value="Previous Year Paper">Previous Year Paper</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                  control={form.control}
                  name="durationMin"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Duration (in minutes)</FormLabel>
                      <FormControl>
                      <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="negativeMarkPerWrong"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Negative Marking</FormLabel>
                      <FormControl>
                      <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="cutoff"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Cut-off Mark</FormLabel>
                      <FormControl>
                      <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="isAllTime"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                   <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      name={field.name}
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
          
          <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
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

          <Button type="submit">Create Exam</Button>
        </form>
      </Form>
    </ScrollArea>
  );
}
