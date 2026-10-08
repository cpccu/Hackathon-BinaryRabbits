import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const formSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  category: z.string().min(1, 'Type is required'),
  title: z.string().min(5, 'Title is too short'),
  description: z.string().optional(),
  // PYQ specific
  examType: z.string().optional(),
  sessionYear: z.string().optional(),
  sessionName: z.string().optional(),
});

export function ResourceUploadPage() {
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: initialCourseId,
      category: '',
      title: '',
      description: '',
      examType: '',
      sessionYear: new Date().getFullYear().toString(),
      sessionName: '',
    },
  });

  const resourceType = form.watch('category');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // If PYQ, check for duplicates
      if (values.category === 'pyq') {
        const q = query(
          collection(db, 'pyqMetadata'),
          where('courseId', '==', values.courseId),
          where('sessionYear', '==', parseInt(values.sessionYear || '0')),
          where('sessionName', '==', values.sessionName),
          where('examType', '==', values.examType)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          toast.error('A verified question paper for this exam already exists.');
          setIsSubmitting(false);
          return;
        }
      }

      // Mock file upload delay
      await new Promise(r => setTimeout(r, 1500));

      const newResource = {
        courseId: values.courseId,
        category: values.category,
        title: values.title,
        description: values.description || '',
        uploaderId: 'user-123',
        departmentId: 'dept-1', // Should be fetched based on course
        fileUrl: 'https://example.com/mock-file.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        upvoteCount: 0,
        upvotedBy: [],
        createdAt: new Date().toISOString(),
        isVerified: false,
      };

      const docRef = await addDoc(collection(db, 'resources'), newResource);

      if (values.category === 'pyq') {
        await addDoc(collection(db, 'pyqMetadata'), {
          resourceId: docRef.id,
          courseId: values.courseId,
          examType: values.examType,
          sessionYear: parseInt(values.sessionYear || '0'),
          sessionName: values.sessionName,
        });
      }

      toast.success('Resource uploaded successfully!');
      navigate(`/resources/course/${values.courseId}`);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <Input placeholder="Course Code (e.g. CSE101)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pyq">Previous Year Question</SelectItem>
                        <SelectItem value="slide">Lecture Slide</SelectItem>
                        <SelectItem value="note">Student Note</SelectItem>
                        <SelectItem value="lab">Lab Material</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {resourceType === 'pyq' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                  <FormField
                    control={form.control}
                    name="examType"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Exam Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="midterm">Midterm</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sessionName"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Session</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="spring">Spring</SelectItem>
                            <SelectItem value="summer">Summer</SelectItem>
                            <SelectItem value="fall">Fall</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sessionYear"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chapter 1-3 Summary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional context..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                <p className="text-sm text-muted-foreground">Drag and drop file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Accepts PDF, images (Max 10MB)</p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Resource'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
