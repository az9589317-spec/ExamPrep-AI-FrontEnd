
"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useTransition, useState, useEffect } from "react";
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
import { PlusCircle, Trash2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addQuestionAction, parseQuestionAction } from "@/app/admin/actions";
import { Separator } from "../ui/separator";
import type { Exam, Question } from "@/lib/data-structures";
import { Skeleton } from "../ui/skeleton";

const addQuestionSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "You must select a correct answer."}).min(0, "You must select a correct answer."),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  questionType: z.enum(['Standard', 'Reading Comprehension', 'Cloze Test', 'Match the Following', 'Diagram-Based']),
  examId: z.string(),
  questionId: z.string().optional(),
});

type FormValues = z.infer<typeof addQuestionSchema>;

interface AddQuestionFormProps {
    exam: Exam | null;
    initialData?: Question;
    onFinished: () => void;
}

const questionTypes: FormValues['questionType'][] = [
    'Standard',
    'Reading Comprehension',
    'Cloze Test',
    'Match the Following',
    'Diagram-Based'
];

export function AddQuestionForm({ exam, initialData, onFinished }: AddQuestionFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(addQuestionSchema),
    defaultValues: {
        questionText: "",
        options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        correctOptionIndex: undefined,
        subject: "",
        topic: "",
        difficulty: "medium",
        explanation: "",
        questionType: "Standard",
        examId: exam?.id,
        questionId: undefined,
    }
  });
  
  useEffect(() => {
    form.reset({
      questionText: initialData?.questionText || "",
      options: initialData?.options?.map(o => ({text: o.text || ''})) || [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      correctOptionIndex: initialData?.correctOptionIndex,
      subject: initialData?.subject || exam?.sections?.[0]?.name || "",
      topic: initialData?.topic || "",
      difficulty: initialData?.difficulty || "medium",
      explanation: initialData?.explanation || "",
      questionType: initialData?.questionType || "Standard",
      examId: exam?.id,
      questionId: initialData?.id || undefined,
    });
  }, [initialData, exam, form]);


  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  const questionType = useWatch({
      control: form.control,
      name: 'questionType'
  });

  const handleParseWithAI = async () => {
    if (!aiInput) {
        toast({ variant: "destructive", title: "Input Required", description: "Please paste the question text into the AI parser box."});
        return;
    }
    setIsParsing(true);
    try {
        const result = await parseQuestionAction(aiInput);
        if (result.success && result.data) {
            const { questionText, options, correctOptionIndex, subject, topic, difficulty, explanation } = result.data;
            form.setValue('questionText', questionText || '');
            replace(options.map(opt => ({ text: opt.text || '' })));
            form.setValue('correctOptionIndex', correctOptionIndex);
            if (subject) form.setValue('subject', subject);
            if (topic) form.setValue('topic', topic);
            if (difficulty) form.setValue('difficulty', difficulty);
            form.setValue('explanation', explanation || '');
            toast({ title: "Success", description: "AI has filled the form fields." });
        } else {
            toast({ variant: "destructive", title: "AI Parsing Failed", description: result.error || "Could not parse the provided text." });
        }
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
        setIsParsing(false);
    }
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await addQuestionAction(data);
      if (result?.errors && Object.keys(result.errors).length > 0) {
        Object.entries(result.errors).forEach(([key, value]) => {
          if (value && key !== '_form' && key in form.getValues()) {
            form.setError(key as keyof FormValues, { message: value[0] });
          }
        });
        if (result.errors._form) {
          toast({ variant: 'destructive', title: 'Error', description: result.errors._form[0] });
        }
      } else if (result?.message) {
        toast({ title: 'Success', description: result.message });
        onFinished();
      }
    });
  };

  if (!exam) {
    return (
        <div className="space-y-8 p-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-end">
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
  }

  const showOptions = questionType === 'Standard' || questionType === 'Cloze Test' || questionType === 'Match the Following';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <FormLabel className='text-base'>Parse Question with AI</FormLabel>
            <Textarea 
                placeholder="Paste the full question, options, correct answer, and explanation here. The AI will parse it and fill the fields below."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="h-32"
            />
            <Button type="button" onClick={handleParseWithAI} disabled={isParsing}>
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Parse with AI
            </Button>
        </div>
        <Separator />

        <FormField
            control={form.control}
            name="questionType"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Question Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a question type" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {questionTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="questionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{questionType === 'Reading Comprehension' ? 'Passage' : 'Question Text'}</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the full question or passage here..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showOptions && (
            <>
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
                                <Input placeholder={`Option ${index + 1}`} {...optionField} value={optionField.value || ''} />
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
              <FormMessage className="mt-4">{form.formState.errors.correctOptionIndex?.message}</FormMessage>
              <FormMessage className="mt-4">{form.formState.errors.options?.root?.message}</FormMessage>
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
            </>
        )}


        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section (Subject)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {exam.sections.map(section => (
                            <SelectItem key={section.id || section.name} value={section.name}>{section.name}</SelectItem>
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
                <FormLabel>Topic</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Time and Work" {...field} value={field.value || ''} />
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
                <Select onValueChange={field.onChange} value={field.value || 'medium'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </Trigger>
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
                <Textarea placeholder="Provide a detailed solution or explanation." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Question"}
        </Button>
      </form>
    </Form>
  );
}
