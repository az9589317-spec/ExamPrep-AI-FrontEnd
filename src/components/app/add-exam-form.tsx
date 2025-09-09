
'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().int().min(1, 'Duration must be a positive number'),
  isAllTime: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  visibility: z.enum(['published', 'draft']),
}).refine(data => data.isAllTime || (data.startTime && data.endTime), {
    message: "Start and end times are required unless the exam is available at all times.",
    path: ['startTime'],
});

type FormValues = z.infer<typeof formSchema>;

interface AddExamFormProps {
  defaultCategory?: string;
}

export function AddExamForm({ defaultCategory }: AddExamFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const defaultStartTime = new Date().toISOString().slice(0, 16);
  const defaultEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: defaultCategory || 'Banking',
      durationMin: 60,
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </ScrollArea>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Exam
        </Button>
      </form>
    </Form>
  );
}
