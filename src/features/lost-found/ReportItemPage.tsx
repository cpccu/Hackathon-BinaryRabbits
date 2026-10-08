import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const formSchema = z.object({
  itemType: z.enum(['lost', 'found']),
  title: z.string().min(3, 'Item name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Please provide a brief description'),
  privateDetails: z.string().optional(),
  locationTag: z.string().min(3, 'Location is required'),
  incidentDate: z.string().min(1, 'Date is required'),
});

export function ReportItemPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemType: 'lost',
      title: '',
      categoryId: '',
      description: '',
      privateDetails: '',
      locationTag: '',
      incidentDate: new Date().toISOString().split('T')[0],
    },
  });

  const itemType = form.watch('itemType');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const newItem = {
        ...values,
        userId: 'user-123',
        userName: 'John Doe', // Mock user
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'lostFoundItems'), newItem);
      toast.success(`Successfully reported ${values.itemType} item!`);
      navigate('/lost-found');
    } catch (error) {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Report an Item</CardTitle>
          <CardDescription>Fill out the details below to report a lost or found item on campus.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="itemType"
                render={({ field }: any) => (
                  <FormItem className="space-y-3">
                    <FormLabel>What are you reporting?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0 border p-4 rounded-md flex-1 cursor-pointer hover:bg-muted">
                          <FormControl><RadioGroupItem value="lost" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer">I lost something</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0 border p-4 rounded-md flex-1 cursor-pointer hover:bg-muted">
                          <FormControl><RadioGroupItem value="found" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer">I found something</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Blue Water Bottle" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="documents">IDs & Documents</SelectItem>
                          <SelectItem value="accessories">Accessories/Clothing</SelectItem>
                          <SelectItem value="keys">Keys</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="locationTag"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder={itemType === 'lost' ? 'Where do you think you lost it?' : 'Where did you find it?'} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="incidentDate"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Color, brand, distinguishing features..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privateDetails"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Private Identifying Details (Optional)</FormLabel>
                    <FormDescription>
                      Add details only the true owner would know. These will NOT be shown publicly.
                    </FormDescription>
                    <FormControl><Textarea placeholder="e.g. The screen has a scratch on the bottom left." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <p className="text-sm font-medium">Upload Photo (Optional)</p>
                <p className="text-xs text-muted-foreground mt-1">Help others identify the item quicker.</p>
                <Button type="button" variant="outline" className="mt-4">Choose File</Button>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
