
"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useTransition, useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getExam, type Exam } from "@/services/firestore";
import { Skeleton } from "../ui/skeleton";

const optionSchema = z.object({ text: z.string().min(1, "Option text cannot be empty.") });

const standardQuestionSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  options: z.array(optionSchema).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "You must select a correct answer."}).min(0, "You must select a correct answer."),
  marks: z.coerce.number().min(0.1, "Marks must be a positive number."),
  explanation: z.string().optional(),
});

const rcQuestionSchema = z.object({
    passage: z.string().min(50, "Passage must be at least 50 characters long."),
    childQuestions: z.array(standardQuestionSchema).min(1, "At least one child question is required for a passage."),
});

const aiParseSchema = z.object({
    rawText: z.string().min(20, "Please enter a complete question with options."),
});

const formSchema = z.object({
  questionType: z.enum(['STANDARD', 'RC_PASSAGE', 'AI_PARSE']),
  examId: z.string(),
  questionId: z.string().optional(),
  subject: z.string().min(1, "Subject is required.").optional(),
  topic: z.string().min(1, "Topic is required.").optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  standard: standardQuestionSchema.optional(),
  rc: rcQuestionSchema.optional(),
  ai: aiParseSchema.optional(),
}).refine(data => {
    if (data.questionType === 'STANDARD') return !!data.standard && data.subject && data.topic && data.difficulty;
    if (data.questionType === 'RC_PASSAGE') return !!data.rc && data.subject && data.topic && data.difficulty;
    if (data.questionType === 'AI_PARSE') return !!data.ai;
    return false;
}, {
    message: "Question data is missing or incomplete for the selected type.",
    path: ['standard']
});

type FormValues = z.infer<typeof formSchema>;
type QuestionData = Omit<FormValues, 'examId' | 'questionId'> & { id?: string; type: 'STANDARD' | 'RC_PASSAGE', passage?: string, questionText?: string, options: {text: string}[], correctOptionIndex?: number, marks?: number, explanation?: string, subject?: string, topic?: string, difficulty?: 'easy' | 'medium' | 'hard' };

interface AddQuestionFormProps {
    examId: string;
    initialData?: QuestionData;
}

export function AddQuestionForm({ examId, initialData }: AddQuestionFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isFormLoading, setIsFormLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const isEditing = !!initialData;

  useEffect(() => {
      async function fetchExamForForm() {
          const examData = await getExam(examId);
          if (examData) {
              setExam(examData);
          } else {
              toast({ variant: 'destructive', title: 'Error', description: 'Could not load exam details to populate the form.'});
          }
          setIsFormLoading(false);
      }
      fetchExamForForm();
  }, [examId, toast]);
  
    const defaultValues: Partial<FormValues> = {
        examId: examId,
        questionId: initialData?.id,
        questionType: initialData?.type || 'STANDARD',
        subject: initialData?.subject || '',
        topic: initialData?.topic || '',
        difficulty: initialData?.difficulty || 'medium',
        standard: {
            questionText: initialData?.questionText || "",
            options: initialData?.options && initialData.options.length > 0 ? initialData.options : [{ text: "" }, { text: "" }],
            correctOptionIndex: initialData?.correctOptionIndex ?? -1,
            marks: initialData?.marks || 1,
            explanation: initialData?.explanation || "",
        },
        rc: {
          passage: initialData?.passage || '',
          childQuestions: [{ questionText: '', options: [{text: ''}, {text: ''}], correctOptionIndex: 0, marks: 1, explanation: '' }],
        },
        ai: {
            rawText: '',
        }
    };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset({
        examId: examId,
        questionId: initialData.id,
        questionType: initialData.type,
        subject: initialData.subject,
        topic: initialData.topic,
        difficulty: initialData.difficulty,
        standard: initialData.type === 'STANDARD' ? {
          questionText: initialData.questionText || '',
          options: initialData.options,
          correctOptionIndex: initialData.correctOptionIndex,
          marks: initialData.marks,
          explanation: initialData.explanation,
        } : undefined,
        rc: initialData.type === 'RC_PASSAGE' ? {
          passage: initialData.passage || '',
          childQuestions: [],
        } : undefined,
      });
    }
  }, [initialData, form, examId]);

  const questionType = form.watch('questionType');

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: 'rc.childQuestions',
  });

  const handleParseAndFill = async (rawText: string) => {
    setIsParsing(true);
    toast({ title: "Parsing in progress...", description: "The AI is working its magic. Please wait." });
    try {
        const result = await parseQuestionAction(rawText);
        if (result.success && result.data) {
            const { questionText, options, correctOptionIndex, explanation, marks } = result.data;
            form.setValue('questionType', 'STANDARD');
            form.setValue('standard.questionText', questionText);
            form.setValue('standard.options', options.map(opt => ({ text: opt })));
            form.setValue('standard.correctOptionIndex', correctOptionIndex);
            form.setValue('standard.marks', marks || 1);
            form.setValue('standard.explanation', explanation || '');
            toast({ title: "Success!", description: "The form has been pre-filled with the parsed data." });
        } else {
            toast({ variant: 'destructive', title: 'Parsing Failed', description: result.error || "Couldn't parse the question. Please check the format." });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during parsing." });
    } finally {
        setIsParsing(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (data.questionType === 'AI_PARSE') {
        if (data.ai?.rawText) {
            handleParseAndFill(data.ai.rawText);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter the text to be parsed.'});
        }
        return;
    }
      
    startTransition(async () => {
      const result = await addQuestionAction(data);
      if (!result.success) {
        if (result.errors) {
            for (const [key, value] of Object.entries(result.errors)) {
                if (value) {
                    form.setError(key as any, { message: value.join(', ') });
                }
            }
        }
        toast({ variant: 'destructive', title: 'Error', description: result.message || 'Please correct the errors in the form.' });
      } else {
        toast({ title: 'Success', description: result.message });
        if (!isEditing) {
           form.reset(defaultValues);
        }
      }
    });
  };

  if (isFormLoading) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-10 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="questionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a question type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard Question</SelectItem>
                  <SelectItem value="RC_PASSAGE">Reading Comprehension</SelectItem>
                  <SelectItem value="AI_PARSE">Parse with AI</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {questionType !== 'AI_PARSE' && (
            <>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Subject (Section)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select the relevant section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(exam?.sections || []).map(section => (
                                <SelectItem key={section.name} value={section.name}>{section.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., Algebra" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="difficulty" render={({ field }) => ( <FormItem><FormLabel>Difficulty</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <Separator />
            </>
        )}
        
        {questionType === 'STANDARD' && <StandardQuestionForm form={form} />}
        {questionType === 'RC_PASSAGE' && <RCQuestionForm form={form} fields={childFields} append={appendChild} remove={removeChild} isEditing={isEditing} />}
        {questionType === 'AI_PARSE' && <AIParseForm form={form} onParse={handleParseAndFill} isParsing={isParsing} />}

        <Button type="submit" disabled={isPending || isParsing}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isParsing && <Sparkles className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : (questionType === 'AI_PARSE' ? "Parse & Pre-fill Form" : "Add Question")}
        </Button>
      </form>
    </Form>
  );
}


function StandardQuestionForm({ form }: { form: any }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "standard.options",
    });

    return (
        <div className="space-y-8">
            <FormField
              control={form.control}
              name="standard.questionText"
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
            
            <FormField
              control={form.control}
              name="standard.marks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marks</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g., 1 or 2.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <div className="mb-4">
                <FormLabel>Options and Correct Answer</FormLabel>
                <FormDescription>Enter the options below and select the correct one.</FormDescription>
              </div>
              <FormField
                control={form.control}
                name="standard.correctOptionIndex"
                render={({ field }) => (
                  <FormControl>
                    <RadioGroup onValueChange={(value) => field.onChange(parseInt(value, 10))} className="space-y-4" value={field.value !== undefined && field.value !== -1 ? String(field.value) : undefined}>
                      {fields.map((item, index) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name={`standard.options.${index}.text`}
                          render={({ field: optionField }) => (
                            <FormItem className="flex items-center gap-4">
                              <FormControl>
                                <RadioGroupItem value={index.toString()} id={`option-radio-${index}`} />
                              </FormControl>
                              <Label htmlFor={`option-radio-${index}`} className="flex-1">
                                <Input placeholder={`Option ${index + 1}`} {...optionField} />
                              </Label>
                              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
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
              <FormMessage className="mt-4">{form.formState.errors.standard?.correctOptionIndex?.message}</FormMessage>
              <FormMessage className="mt-4">{form.formState.errors.standard?.options?.root?.message}</FormMessage>
            </FormItem>

            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ text: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Option
            </Button>
            
            <FormField
              control={form.control}
              name="standard.explanation"
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
        </div>
    )
}

function RCQuestionForm({ form, fields, append, remove, isEditing }: { form: any, fields: any[], append: any, remove: any, isEditing: boolean }) {
    return (
        <div className="space-y-8">
            <FormField
              control={form.control}
              name="rc.passage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Passage</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the reading comprehension passage here..." {...field} className="min-h-64" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!isEditing && (
              <>
              <h3 className="text-lg font-semibold">Child Questions</h3>
              {fields.map((field, index) => (
                <Card key={field.id} className="relative p-4 border-dashed">
                  <CardHeader className="p-2">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-4">
                      <FormField control={form.control} name={`rc.childQuestions.${index}.questionText`} render={({ field }) => (<FormItem><FormLabel>Question Text</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name={`rc.childQuestions.${index}.marks`} render={({ field }) => (<FormItem><FormLabel>Marks</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      
                      <Controller
                          control={form.control}
                          name={`rc.childQuestions.${index}.options`}
                          render={({ field: parentField }) => {
                              const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
                                  control: form.control,
                                  name: `rc.childQuestions.${index}.options`
                              });
                              return (
                                  <FormItem>
                                      <Label>Options & Correct Answer</Label>
                                      <FormField
                                        control={form.control}
                                        name={`rc.childQuestions.${index}.correctOptionIndex`}
                                        render={({ field }) => (
                                          <FormControl>
                                            <RadioGroup onValueChange={(value) => field.onChange(parseInt(value))} value={field.value !== undefined ? String(field.value) : undefined} className="space-y-2">
                                              {optionFields.map((item, optionIndex) => (
                                                  <FormField key={item.id} control={form.control} name={`rc.childQuestions.${index}.options.${optionIndex}.text`} render={({ field: optionField }) => (
                                                      <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value={optionIndex.toString()} /></FormControl><Label className="flex-1"><Input {...optionField} /></Label><Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optionIndex)} disabled={optionFields.length <= 2}><Trash2 className="h-4 w-4" /></Button></FormItem>
                                                  )} />
                                              ))}\
                                            </RadioGroup>
                                          </FormControl>
                                        )}
                                      />
                                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendOption({ text: "" })}>Add Option</Button>
                                  </FormItem>
                              )
                          }}
                      />

                      <FormField control={form.control} name={`rc.childQuestions.${index}.explanation`} render={({ field }) => (<FormItem><FormLabel>Explanation</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </CardContent>
                  <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ questionText: '', options: [{ text: '' }, { text: '' }], correctOptionIndex: 0, marks: 1, explanation: '' })}>\
                <PlusCircle className="mr-2 h-4 w-4" /> Add Child Question
              </Button>
              </>
            )}
            {isEditing && (
              <p className="text-sm text-muted-foreground">Editing child questions for an existing passage is not yet supported in this interface. To modify child questions, please delete the RC set and create a new one.</p>
            )}
        </div>
    )
}

function AIParseForm({ form, onParse, isParsing }: { form: any, onParse: (rawText: string) => Promise<void>, isParsing: boolean }) {
    const handleParseClick = () => {
        const rawText = form.getValues("ai.rawText");
        if (rawText) {
            onParse(rawText);
        } else {
            form.setError("ai.rawText", { message: "Please paste the question text here." });
        }
    };

    return (
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="ai.rawText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Parse Question from Text</FormLabel>
                  <FormDescription>
                    Paste the entire question, including options and the correct answer, into the text area below. The AI will parse it and pre-fill the form.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., What is the capital of France?\nA) London\nB) Berlin\nC) Paris\nD) Madrid\nAnswer: C"
                      className="min-h-48"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
    );
}
