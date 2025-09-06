'use client';

import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addExamAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  durationMin: z.coerce.number().int().min(1, 'Duration must be a positive number'),
  negativeMarkPerWrong: z.coerce.number().min(0, 'Negative marking cannot be negative'),
  startTime: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endTime: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  visibility: z.enum(['public', 'private']),
});

type FormValues = z.infer<typeof formSchema>;

const initialState = {
  message: '',
  errors: {},
};

export function AddExamForm() {
  const { toast } = useToast();
  const [state, formAction] = useFormState(addExamAction, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: 'Bank PO',
      durationMin: 60,
      negativeMarkPerWrong: 0.25,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      visibility: 'public',
    },
  });

  useEffect(() => {
    if (state?.message) {
      toast({ title: 'Success', description: state.message });
      form.reset();
    }
    if (state?.errors) {
        Object.entries(state.errors).forEach(([key, value]) => {
            if(value) {
                form.setError(key as keyof FormValues, { message: value[0] });
            }
        });
    }
  }, [state, toast, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
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
                        <SelectItem value="Bank PO">Bank PO</SelectItem>
                        <SelectItem value="Bank Clerk">Bank Clerk</SelectItem>
                        <SelectItem value="RBI">RBI</SelectItem>
                        <SelectItem value="SSC">SSC</SelectItem>
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
                    <FormLabel>Negative Marking (per wrong answer)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
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
                  <Input type="datetime-local" {...field} />
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
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />

        <Button type="submit">Create Exam</Button>
      </form>
    </Form>
  );
}
