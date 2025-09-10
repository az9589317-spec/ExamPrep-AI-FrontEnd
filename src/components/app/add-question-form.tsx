

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
import { PlusCircle, Trash2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addQuestionAction, parseQuestionAction } from "@/app/admin/actions";
import { Separator } from "../ui/separator";
import type { Exam, Question } from "@/lib/data-structures";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { v4 as uuidv4 } from "uuid";


const subQuestionSchema = z.object({
    id: z.string().default(() => uuidv4()),
    questionText: z.string().min(1, "Sub-question text is required."),
    options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
    correctOptionIndex: z.coerce.number({required_error: "You must select a correct answer."}).min(0),
    explanation: z.string().optional(),
});

const addQuestionSchema = z.object({
  questionType: z.enum(['Standard', 'Reading Comprehension']),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  examId: z.string(),
  questionId: z.string().optional(),
  marks: z.coerce.number().min(0.25, "Marks must be at least 0.25."),
  
  // Fields that depend on questionType
  questionText: z.string().optional(),
  options: z.array(z.object({ text: z.string() })).optional(),
  correctOptionIndex: z.coerce.number().optional(),
  passage: z.string().optional(),
  subQuestions: z.array(subQuestionSchema).optional(),
}).superRefine((data, ctx) => {
    if (data.questionType === 'Standard') {
        if (!data.questionText || data.questionText.length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Question text is required and must be at least 10 characters.",
                path: ['questionText'],
            });
        }
        if (!data.options || data.options.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least two options are required.",
                path: ['options'],
            });
        }
        if (data.options?.some(opt => !opt.text || opt.text.trim() === '')) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "All option fields must be filled out.",
                path: ['options'],
            });
        }
        if (data.correctOptionIndex === undefined || data.correctOptionIndex < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "You must select a correct answer.",
                path: ['correctOptionIndex'],
            });
        }
    }
    if (data.questionType === 'Reading Comprehension') {
        if (!data.passage || data.passage.length < 20) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Passage is required and must be at least 20 characters.",
                path: ['passage'],
            });
        }
        if (!data.subQuestions || data.subQuestions.length < 1) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one sub-question is required for a passage.",
                path: ['subQuestions'],
            });
        }
    }
});


type FormValues = z.infer<typeof addQuestionSchema>;

interface AddQuestionFormProps {
    exam: Exam | null;
    initialData?: Question;
    onFinished: () => void;
}

export function AddQuestionForm({ exam, initialData, onFinished }: AddQuestionFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [aiInput, setAiInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(addQuestionSchema),
    defaultValues: {
        questionType: 'Standard',
        options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
        difficulty: "medium",
        marks: 1,
    }
  });

  useEffect(() => {
    if (!exam) return;

    let defaultValues: FormValues;

    if (initialData) {
        // We are editing an existing question
        defaultValues = {
            ...initialData,
            examId: exam.id,
            questionId: initialData.id,
            subject: initialData.subject || exam.sections?.[0]?.name || "",
            marks: initialData.marks || 1,
        };

        // Handle specific question types
        if (initialData.questionType === 'Standard') {
            defaultValues.options = initialData.options?.map(o => ({ text: o.text || '' })) || [{ text: "" }, { text: "" }];
        } else if (initialData.questionType === 'Reading Comprehension') {
            defaultValues.subQuestions = initialData.subQuestions?.map(sq => ({
                ...sq,
                options: sq.options?.map(opt => ({ text: opt.text || '' })) || [{ text: "" }, { text: "" }],
            })) || [];
        }
    } else {
        // We are creating a new question
        defaultValues = {
            questionType: "Standard",
            questionText: "",
            options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
            correctOptionIndex: undefined,
            passage: "",
            subQuestions: [],
            subject: exam.sections?.[0]?.name || "",
            topic: "",
            difficulty: "medium",
            explanation: "",
            marks: 1,
            examId: exam.id,
            questionId: undefined,
        };
    }
    form.reset(defaultValues);

  }, [initialData, exam, form]);
  
  const questionType = useWatch({ control: form.control, name: 'questionType' });

  const { fields: optionFields, append: appendOption, remove: removeOption, replace: replaceOptions } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const { fields: subQuestionFields, append: appendSubQuestion, remove: removeSubQuestion } = useFieldArray({
    control: form.control,
    name: "subQuestions",
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
            form.setValue('questionType', 'Standard');
            form.setValue('questionText', questionText || '');
            replaceOptions(options.map(opt => ({ text: opt.text || '' })));
            form.setValue('correctOptionIndex', correctOptionIndex);
            if (subject) form.setValue('subject', subject);
            if (topic) form.setValue('topic', topic);
            if (difficulty) form.setValue('difficulty', difficulty);
            form.setValue('explanation', explanation || '');
            toast({ title: "Success", description: "AI has filled the form fields." });
        } else {
             toast({ variant: 'destructive', title: 'Parsing Failed', description: result.error || "Couldn't parse the question." });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred." });
    } finally {
        setIsParsing(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await addQuestionAction(data);
      if (result?.errors && Object.keys(result.errors).length > 0) {
         Object.entries(result.errors).forEach(([key, value]) => {
            if (value) {
                form.setError(key as keyof FormValues, { message: value[0] });
            }
         });
         toast({ variant: 'destructive', title: 'Error', description: 'Please correct the errors in the form.' });
      } else if(result?.message) {
        toast({ title: 'Success!', description: result.message });
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Standard">Standard (MCQ)</SelectItem>
                            <SelectItem value="Reading Comprehension">Reading Comprehension</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />

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
                    
                    <div className="space-y-4">
                        <Label>Sub-Questions</Label>
                        {subQuestionFields.map((field, index) => (
                            <Card key={field.id} className="p-4 bg-muted/50">
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="text-base">Sub-Question {index + 1}</Label>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSubQuestion(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name={`subQuestions.${index}.questionText`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Question Text</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter the sub-question..." {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <SubQuestionOptions subQuestionIndex={index} />
                                </div>
                            </Card>
                        ))}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => appendSubQuestion({ id: uuidv4(), questionText: "", options: [{text: ""}, {text: ""}, {text: ""}, {text: ""}], correctOptionIndex: 0, explanation: "" })}
                            >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Sub-Question
                        </Button>
                        <FormMessage>{form.formState.errors.subQuestions?.message}</FormMessage>
                    </div>
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle>Categorization & Details</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                    <FormItem className="md:col-span-2">
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
                    <FormItem className="md:col-span-2">
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
                    <FormItem className="md:col-span-2">
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
                    name="marks"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Marks</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.25" placeholder="e.g., 1 or 2" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                        <FormItem className="md:col-span-4">
                        <FormLabel>Overall Explanation (Optional)</FormLabel>
                        <FormDescription>A detailed solution or explanation for the entire question (e.g., passage summary or context).</FormDescription>
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

// Helper component to avoid re-rendering the entire form when sub-question options change.
function SubQuestionOptions({ subQuestionIndex }: { subQuestionIndex: number }) {
    const { control, formState: { errors } } = useFormContext<FormValues>();
    
    const { fields: subQuestionOptionFields, append, remove } = useFieldArray({
        control: control,
        name: `subQuestions.${subQuestionIndex}.options`
    });
    
    const subQuestionErrors = errors.subQuestions?.[subQuestionIndex];

    return (
        <div className="mt-4 pl-4 border-l-2">
            <Label>Options</Label>
            <FormField
                control={control}
                name={`subQuestions.${subQuestionIndex}.correctOptionIndex`}
                render={({ field }) => (
                    <FormControl>
                        <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            className="space-y-4 mt-2"
                            value={field.value !== undefined ? String(field.value) : undefined}
                        >
                            {subQuestionOptionFields.map((item, optionIndex) => (
                                <FormField
                                    key={item.id}
                                    control={control}
                                    name={`subQuestions.${subQuestionIndex}.options.${optionIndex}.text`}
                                    render={({ field: optionField }) => (
                                        <FormItem className="flex items-center gap-4">
                                            <FormControl>
                                                <RadioGroupItem value={optionIndex.toString()} id={`sub-option-radio-${subQuestionIndex}-${optionIndex}`} />
                                            </FormControl>
                                            <Label htmlFor={`sub-option-radio-${subQuestionIndex}-${optionIndex}`} className="flex-1">
                                                <Input placeholder={`Option ${optionIndex + 1}`} {...optionField} value={optionField.value || ''} />
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => remove(optionIndex)}
                                                disabled={subQuestionOptionFields.length <= 2}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </FormItem>
                                    )}
                                />
                            ))}
                             {subQuestionErrors?.options && <FormMessage>{subQuestionErrors.options.message}</FormMessage>}
                             {subQuestionErrors?.correctOptionIndex && <FormMessage>{subQuestionErrors.correctOptionIndex.message}</FormMessage>}
                        </RadioGroup>
                    </FormControl>
                )}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ text: "" })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Option
            </Button>
        </div>
    );
}

    