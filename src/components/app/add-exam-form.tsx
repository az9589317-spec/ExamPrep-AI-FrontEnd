
'use client';

import { useActionState, useEffect, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import { categoryNames } from '@/lib/categories.tsx';

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
}).refine(data => data.isAllTime || (data.startTime && data.endTime), {
    message: "Start and end times are required unless the exam is available at all times.",
    path: ['startTime'], // You can also point to a different field if more appropriate
});

type FormValues = z.infer<typeof formSchema>;

const initialState = {
  message: '',
  errors: null as any,
};

interface AddExamFormProps {
  defaultCategory?: string;
}

export function AddExamForm({ defaultCategory }: AddExamFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(addExamAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  
  const defaultStartTime = new Date().toISOString().slice(0, 16);
  const defaultEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: defaultCategory || 'Banking',
      durationMin: 60,
      negativeMarkPerWrong: 0.25,
      cutoff: 40,
      isAllTime: false,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      visibility: 'published',
    },
  });

  const isAllTime = form.watch('isAllTime');

  useEffect(() => {
    if (isAllTime) {
      form.setValue('startTime', undefined);
      form.setValue('endTime', undefined);
    } else {
      form.setValue('startTime', form.getValues('startTime') || defaultStartTime);
      form.setValue('endTime', form.getValues('endTime') || defaultEndTime);
    }
  }, [isAllTime, form, defaultStartTime, defaultEndTime]);


  useEffect(() => {
    if (state?.message && !state.errors) {
      toast({ title: 'Success', description: state.message });
      form.reset();
      // Consider closing the dialog here as well.
    } else if (state?.errors) {
        Object.entries(state.errors).forEach(([key, value]) => {
            if(value && key !== '_form' && key in form.getValues()) {
                form.setError(key as keyof FormValues, { message: (value as any)[0] });
            }
        });
        if (state.errors._form) {
             toast({ variant: 'destructive', title: 'Error', description: state.errors._form[0] });
        }
    }
  }, [state, toast, form]);

  return (
    <ScrollArea className="h-[70vh] pr-6">
      <Form {...form}>
        <form 
          ref={formRef}
          action={formAction}
          onSubmit={form.handleSubmit(() => formRef.current?.submit())}
          className="space-y-6"
        >
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
                          {categoryNames.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
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

    