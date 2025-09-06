"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number().min(0, "You must select a correct answer."),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddQuestionForm({ examId }: { examId: string }) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      questionText: "",
      options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      subject: "",
      topic: "",
      difficulty: "medium",
      explanation: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  function onSubmit(data: FormValues) {
    // In a real app, you would save this to Firestore.
    console.log({ examId, ...data });
    toast({
      title: "Question Added!",
      description: "The new question has been saved successfully.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="questionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the full question here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Options and Correct Answer</FormLabel>
          <FormDescription>
            Enter the options below and select the correct one.
          </FormDescription>
          <FormField
            control={form.control}
            name="correctOptionIndex"
            render={({ field }) => (
              <RadioGroup
                onValueChange={(value) => field.onChange(parseInt(value))}
                className="mt-4 space-y-4"
                name={field.name}
              >
                {fields.map((item, index) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field: optionField }) => (
                      <FormItem className="flex items-center gap-4">
                        <FormControl>
                            <RadioGroupItem value={index.toString()} />
                        </FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...optionField} />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </FormItem>
                    )}
                  />
                ))}
              </RadioGroup>
            )}
          />
           <FormMessage>{form.formState.errors.correctOptionIndex?.message}</FormMessage>
        </FormItem>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append({ text: "" })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Option
        </Button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Quantitative Aptitude" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Time and Work" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide a detailed solution or explanation." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Add Question</Button>
      </form>
    </Form>
  );
}
