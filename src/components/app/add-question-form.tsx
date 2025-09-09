
"use client";

import { useForm, useFieldArray, useWatch, useFormContext } from "react-hook-form";
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
import { PlusCircle, Trash2, Loader2, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addQuestionAction, parseQuestionAction } from "@/app/admin/actions";
import { Separator } from "../ui/separator";
import type { Exam, Question } from "@/lib/data-structures";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

const subQuestionSchema = z.object({
    id: z.string().default(() => uuidv4()),
    questionText: z.string().min(1, "Question text cannot be empty."),
    options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "Must have at least 2 options."),
    correctOptionIndex: z.coerce.number().min(0, "You must select a correct answer."),
});

const addQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text cannot be empty.").optional(), // Optional for RC
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2).optional(),
  correctOptionIndex: z.coerce.number().min(0, "You must select a correct answer.").optional(),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  questionType: z.enum(['Standard', 'Reading Comprehension']),
  examId: z.string(),
  questionId: z.string().optional(),
  passage: z.string().optional(),
  subQuestions: z.array(subQuestionSchema).optional(),
}).refine(data => {
    if (data.questionType === 'Standard' && (!data.options || data.options.length < 2 || data.correctOptionIndex === undefined || !data.questionText)) {
        return false;
    }
    return true;
}, {
    message: "Standard questions require text, at least 2 options, and a correct answer.",
    path: ["questionText"],
}).refine(data => {
    if (data.questionType === 'Reading Comprehension' && (!data.passage || data.passage.length < 10)) {
        return false;
    }
    return true;
}, {
    message: "Reading Comprehension requires a passage of at least 10 characters.",
    path: ["passage"],
}).refine(data => {
    if (data.questionType === 'Reading Comprehension' && (!data.subQuestions || data.subQuestions.length < 1)) {
        return false;
    }
    return true;
}, {
    message: "Reading Comprehension requires at least one sub-question.",
    path: ["subQuestions"],
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
        passage: "",
        subQuestions: [],
    }
  });

  useEffect(() => {
    if (exam) {
        form.reset(
            initialData ? 
            {
                ...initialData,
                examId: exam.id,
                questionId: initialData.id,
                subject: initialData.subject || exam.sections?.[0]?.name || "",
                topic: initialData.topic || "",
                explanation: initialData.explanation || "",
                options: initialData.options?.map(o => ({text: o.text || ''})) || [{ text: "" }, { text: "" }],
                questionType: initialData.questionType || 'Standard',
                subQuestions: initialData.subQuestions?.map(sq => ({
                    id: sq.id || uuidv4(),
                    questionText: sq.questionText || '',
                    options: sq.options?.map(opt => ({ text: opt.text || '' })) || [{ text: '' }, { text: '' }],
                    correctOptionIndex: sq.correctOptionIndex
                })) || [],
            } : 
            {
                questionText: "",
                options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
                correctOptionIndex: undefined,
                subject: exam.sections?.[0]?.name || "",
                topic: "",
                difficulty: "medium",
                explanation: "",
                questionType: "Standard",
                examId: exam.id,
                questionId: undefined,
                passage: "",
                subQuestions: [{ id: uuidv4(), questionText: '', options: [{ text: '' }, { text: '' }], correctOptionIndex: undefined as any }],
            }
        );
    }
  }, [initialData, exam, form]);


  const { fields: optionFields, append: appendOption, remove: removeOption, replace: replaceOptions } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  const { fields: subQuestionFields, append: appendSubQuestion, remove: removeSubQuestion } = useFieldArray({
      control: form.control,
      name: "subQuestions"
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
            replaceOptions(options.map(opt => ({ text: opt.text || '' })));
            form.setValue('correctOptionIndex', correctOptionIndex);
            if (subject) form.setValue('subject', subject);
            if (topic) form.setValue('topic', topic);
            if (difficulty) form.setValue('difficulty', difficulty);
            form.setValue('explanation', explanation || '');
            form.setValue('questionType', 'Standard');
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <FormLabel className='text-base'>Parse Question with AI</FormLabel>
            <Textarea 
                placeholder="Paste a standard multiple choice question here. The AI will parse it and fill the fields below."
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
        
        {questionType === 'Reading Comprehension' && (
            <Card>
                <CardHeader>
                    <CardTitle>Reading Comprehension Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="passage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Passage</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter the full passage here..." {...field} value={field.value || ''} rows={10} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    <Separator />

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Sub-Questions</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendSubQuestion({ id: uuidv4(), questionText: "", options: [{ text: "" }, { text: "" }], correctOptionIndex: undefined as any })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Sub-Question
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {subQuestionFields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-background/50 relative">
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:bg-destructive/10"
                                        onClick={() => removeSubQuestion(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <FormField
                                        control={form.control}
                                        name={`subQuestions.${index}.questionText`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sub-Question {index + 1}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={`Question for passage...`} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <SubQuestionOptions parentIndex={index} control={form.control} />
                                </Card>
                            ))}
                        </div>
                        <FormField
                            control={form.control}
                            name="subQuestions"
                            render={() => <FormMessage />}
                        />
                    </div>
                </CardContent>
            </Card>
        )}
        
        {questionType === 'Standard' && (
            <Card>
                <CardHeader>
                    <CardTitle>Standard Question Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Enter the question..." {...field} value={field.value || ''} />
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
                            value={field.value !== undefined ? String(field.value) : undefined}
                            >
                            {optionFields.map((item, index) => (
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
                                        onClick={() => removeOption(index)}
                                        disabled={optionFields.length <= 2}
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
                    <FormMessage className="mt-4">{form.formState.errors.correctOptionIndex?.message || form.formState.errors.options?.message}</FormMessage>
                    <FormMessage className="mt-4">{form.formState.errors.options?.root?.message}</FormMessage>
                    </FormItem>

                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => appendOption({ text: "" })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Option
                    </Button>
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle>Categorization & Details</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
                <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                        <FormItem className="md:col-span-3">
                        <FormLabel>Explanation (Optional)</FormLabel>
                        <FormDescription>A detailed solution or explanation for the entire question (including all sub-questions if applicable).</FormDescription>
                        <FormControl>
                            <Textarea placeholder="Provide a detailed solution or explanation." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Question"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

function SubQuestionOptions({ parentIndex, control }: { parentIndex: number, control: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `subQuestions.${parentIndex}.options`,
    });

    const form = useFormContext();

    return (
        <div className="mt-4 pl-4 border-l-2">
            <Label>Options & Correct Answer</Label>
            <FormField
                control={control}
                name={`subQuestions.${parentIndex}.correctOptionIndex`}
                render={({ field }) => (
                    <FormControl>
                        <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            className="space-y-2 mt-2"
                            value={field.value !== undefined ? String(field.value) : undefined}
                        >
                            {fields.map((item, index) => (
                                <FormField
                                    key={item.id}
                                    control={control}
                                    name={`subQuestions.${parentIndex}.options.${index}.text`}
                                    render={({ field: optionField }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <RadioGroupItem value={index.toString()} id={`sub-option-radio-${parentIndex}-${index}`} />
                                            </FormControl>
                                            <Label htmlFor={`sub-option-radio-${parentIndex}-${index}`} className="flex-1">
                                                <Input placeholder={`Option ${index + 1}`} {...optionField} />
                                            </Label>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                )}
            />
            <FormMessage>{form.formState.errors.subQuestions?.[parentIndex]?.correctOptionIndex?.message}</FormMessage>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ text: "" })}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
        </div>
    );
}

    