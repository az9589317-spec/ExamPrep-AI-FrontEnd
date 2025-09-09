
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
import { PlusCircle, Trash2, Loader2, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addQuestionAction, parseQuestionAction } from "@/app/admin/actions";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";

const optionSchema = z.object({ text: z.string().min(1, "Option text cannot be empty.") });

const standardQuestionSchema = z.object({
  questionText: z.string().min(10, "Question text must be at least 10 characters long."),
  marks: z.coerce.number().min(0, "Marks cannot be negative."),
  options: z.array(optionSchema).min(2, "At least two options are required."),
  correctOptionIndex: z.coerce.number({invalid_type_error: "You must select a correct answer."}).min(0, "You must select a correct answer."),
  explanation: z.string().optional(),
});

const rcQuestionSchema = z.object({
    passage: z.string().min(50, "Passage must be at least 50 characters long."),
    childQuestions: z.array(standardQuestionSchema).min(1, "At least one child question is required for a passage."),
});

const formSchema = z.object({
  questionType: z.enum(['STANDARD', 'RC_PASSAGE', 'AI_PARSE']),
  examId: z.string(),
  questionId: z.string().optional(),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  standard: standardQuestionSchema.optional(),
  rc: rcQuestionSchema.optional(),
  ai: z.object({ rawText: z.string().min(20, "Please provide text to parse.") }).optional(),
}).refine(data => {
    if (data.questionType === 'STANDARD') return !!data.standard;
    if (data.questionType === 'RC_PASSAGE') return !!data.rc;
    if (data.questionType === 'AI_PARSE') return !!data.ai;
    return false;
}, {
    message: "Question data is missing for the selected type.",
    path: ['standard']
});

type FormValues = z.infer<typeof formSchema>;
type QuestionData = Omit<FormValues, 'examId' | 'questionId' | 'questionType'> & { id?: string, type?: 'STANDARD' | 'RC_PASSAGE' };

interface AddQuestionFormProps {
    examId: string;
    initialData?: QuestionData;
}

export function AddQuestionForm({ examId, initialData }: AddQuestionFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examId: examId,
      questionId: initialData?.id,
      questionType: initialData?.type || 'STANDARD',
      subject: initialData?.subject || '',
      topic: initialData?.topic || '',
      difficulty: initialData?.difficulty || 'medium',
      standard: {
          questionText: initialData?.standard?.questionText || "",
          marks: initialData?.standard?.marks || 1,
          options: initialData?.standard?.options || [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
          correctOptionIndex: initialData?.standard?.correctOptionIndex,
          explanation: initialData?.standard?.explanation || "",
      },
      rc: {
        passage: initialData?.rc?.passage || '',
        childQuestions: initialData?.rc?.childQuestions || [{ questionText: '', marks: 1, options: [{text: ''}, {text: ''}], correctOptionIndex: -1, explanation: '' }],
      },
      ai: {
        rawText: '',
      }
    },
  });

  const questionType = form.watch('questionType');

  useEffect(() => {
    if (initialData) {
      form.reset({
        examId: examId,
        questionId: initialData.id,
        questionType: initialData.type || 'STANDARD',
        subject: initialData.subject,
        topic: initialData.topic,
        difficulty: initialData.difficulty,
        standard: {
          questionText: initialData.standard?.questionText || "",
          marks: initialData.standard?.marks || 1,
          options: initialData.standard?.options || [{ text: "" }, { text: "" }],
          correctOptionIndex: initialData.standard?.correctOptionIndex,
          explanation: initialData.standard?.explanation || ""
        },
        rc: {
            passage: initialData.rc?.passage || '',
            childQuestions: initialData.rc?.childQuestions || []
        },
        ai: { rawText: '' }
      });
    }
  }, [initialData, form, examId]);

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: 'rc.childQuestions',
  });

  const handleParseAndFill = async () => {
      const rawText = form.getValues('ai.rawText');
      if (!rawText) {
          form.setError('ai.rawText', { message: 'Please provide text to parse.' });
          return;
      }
      setIsParsing(true);
      const result = await parseQuestionAction(rawText);
      setIsParsing(false);

      if (result.success && result.data) {
          const { questionText, options, correctOptionIndex, subject, topic, difficulty, explanation, marks } = result.data;
          form.setValue('questionType', 'STANDARD');
          form.setValue('standard.questionText', questionText);
          form.setValue('standard.options', options);
          form.setValue('standard.correctOptionIndex', correctOptionIndex);
          form.setValue('standard.explanation', explanation);
          form.setValue('standard.marks', marks || 1);
          if (subject) form.setValue('subject', subject);
          if (topic) form.setValue('topic', topic);
          if (difficulty) form.setValue('difficulty', difficulty);
          toast({ title: "Success", description: "Form has been pre-filled with the parsed data." });
      } else {
          toast({ variant: 'destructive', title: "Parsing Failed", description: result.error });
      }
  };

  const onSubmit = (data: FormValues) => {
    if (data.questionType === 'AI_PARSE') {
        handleParseAndFill();
        return;
    }
    
    // Ensure correctOptionIndex is not -1 for standard questions
    if (data.questionType === 'STANDARD' && (data.standard?.correctOptionIndex ?? -1) < 0) {
        form.setError('standard.correctOptionIndex', { message: 'You must select a correct answer.' });
        return;
    }

    startTransition(async () => {
      const result = await addQuestionAction(data);
      if (result?.errors && Object.keys(result.errors).length > 0) {
        Object.entries(result.errors).forEach(([key, value]) => {
          if (value && key in form.getValues()) {
            form.setError(key as any, { message: value[0] });
          }
        });
        if (result.errors._form) {
          toast({ variant: 'destructive', title: 'Error', description: result.errors._form[0] });
        }
      } else if (result?.message) {
        toast({ title: 'Success', description: result.message });
        if (!isEditing) {
          form.reset();
        }
      }
    });
  };

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
                    <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., English Language" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., Reading Comprehension" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="difficulty" render={({ field }) => ( <FormItem><FormLabel>Difficulty</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <Separator />
            </>
        )}
        
        {questionType === 'STANDARD' && <StandardQuestionForm form={form} />}
        {questionType === 'RC_PASSAGE' && <RCQuestionForm form={form} fields={childFields} append={appendChild} remove={removeChild} isEditing={isEditing} />}
        {questionType === 'AI_PARSE' && <AIParseForm form={form} onParse={handleParseAndFill} isParsing={isParsing} />}


        {questionType !== 'AI_PARSE' && (
             <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Question"}
             </Button>
        )}
      </form>
    </Form>
  );
}

function AIParseForm({ form, onParse, isParsing }: { form: any, onParse: () => void, isParsing: boolean }) {
    return (
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="ai.rawText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raw Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the unstructured question text here, including question, options, answer, and explanation."
                      className="min-h-64"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The AI will attempt to extract all fields and pre-fill the standard question form.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={onParse} disabled={isParsing}>
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Parse and Pre-fill Form
            </Button>
        </div>
    )
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
                    <Input type="number" placeholder="e.g., 1" {...field} />
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
                    <RadioGroup onValueChange={(value) => field.onChange(parseInt(value, 10))} className="space-y-4" value={field.value !== undefined ? String(field.value) : undefined}>
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
                      <FormField control={form.control} name={`rc.childQuestions.${index}.marks`} render={({ field }) => (<FormItem><FormLabel>Marks</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      
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
                                              ))}
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
              <Button type="button" variant="outline" onClick={() => append({ questionText: '', marks: 1, options: [{ text: '' }, { text: '' }], correctOptionIndex: -1, explanation: '' })}>
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
