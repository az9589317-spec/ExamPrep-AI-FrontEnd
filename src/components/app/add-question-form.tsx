
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useActionState, useEffect, useRef } from "react";
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
import { addQuestionAction } from "@/app/admin/actions";

const formSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "You must select a correct answer."}).min(0, "You must select a correct answer."),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type QuestionData = FormValues & { id?: string };


interface AddQuestionFormProps {
    examId: string;
    initialData?: QuestionData;
}

const initialState = {
  message: '',
  errors: {},
};


export function AddQuestionForm({ examId, initialData }: AddQuestionFormProps) {
  const { toast } = useToast();
  const isEditing = !!initialData;
  const [state, formAction] = useActionState(addQuestionAction, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      questionText: "",
      options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      correctOptionIndex: undefined,
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

   useEffect(() => {
    if (state?.message && Object.keys(state.errors).length === 0) {
      toast({ title: 'Success', description: state.message });
      if (!isEditing) {
        form.reset();
      }
    } else if (state?.errors && Object.keys(state.errors).length > 0) {
        Object.entries(state.errors).forEach(([key, value]) => {
            if(value && key !== '_form') {
                form.setError(key as keyof FormValues, { message: value[0] });
            }
        });
        if (state.errors._form) {
             toast({ variant: 'destructive', title: 'Error', description: state.errors._form[0] });
        }
    }
  }, [state, toast, form, isEditing]);


  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <input type="hidden" name="examId" value={examId} />
        {isEditing && initialData?.id && <input type="hidden" name="questionId" value={initialData.id} />}

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
            <div className="mb-4">
                <FormLabel>Options and Correct Answer</FormLabel>
                <FormDescription>
                    Enter the options below and select the correct one.
                </FormDescription>
            </div>
          <FormField
            control={form.control}
            name="correctOptionIndex"
            render={({ field }) => (
                <FormControl>
                    <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        className="space-y-4"
                        name={field.name}
                        value={field.value !== undefined ? String(field.value) : undefined}
                    >
                        {fields.map((item, index) => (
                        <FormField
                            key={item.id}
                            control={form.control}
                            name={`options.${index}.text`}
                            render={({ field: optionField }) => (
                            <FormItem className="flex items-center gap-4">
                                <FormControl>
                                    <RadioGroupItem value={index.toString()} id={`option-radio-${index}`} />
                                </FormControl>
                                <Label htmlFor={`option-radio-${index}`} className="flex-1">
                                    <Input placeholder={`Option ${index + 1}`} {...optionField} />
                                </Label>
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
                </FormControl>
            )}
          />
           <FormMessage className="mt-4">{form.formState.errors.correctOptionIndex?.message || (state.errors as any)?.correctOptionIndex?.[0]}</FormMessage>
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
        
        <Button type="submit">{isEditing ? "Save Changes" : "Add Question"}</Button>
      </form>
    </Form>
  );
}
