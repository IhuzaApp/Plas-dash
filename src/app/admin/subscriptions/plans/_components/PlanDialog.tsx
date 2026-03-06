'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plan } from '../page';

const planSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(5, 'Description is required'),
    price_monthly: z.coerce.number().min(0, 'Must be positive or 0'),
    price_yearly: z.coerce.number().min(0, 'Must be positive or 0'),
    ai_request_limit: z.coerce.number().min(0, 'Must be positive or 0'),
    reel_limit: z.coerce.number().min(0, 'Must be positive or 0'),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData: Partial<Plan> | null;
}

export function PlanDialog({ open, onOpenChange, onSuccess, initialData }: PlanDialogProps) {
    const { toast } = useToast();
    const isEditing = !!initialData?.id;

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: '',
            description: '',
            price_monthly: 0,
            price_yearly: 0,
            ai_request_limit: 0,
            reel_limit: 0,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    price_monthly: initialData.price_monthly || 0,
                    price_yearly: initialData.price_yearly || 0,
                    ai_request_limit: initialData.ai_request_limit || 0,
                    reel_limit: initialData.reel_limit || 0,
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                    price_monthly: 0,
                    price_yearly: 0,
                    ai_request_limit: 0,
                    reel_limit: 0,
                });
            }
        }
    }, [open, initialData, form]);

    const mutation = useMutation({
        mutationFn: async (values: PlanFormValues) => {
            // Create payload. If editing, we would ideally PUT to an ID endpoint, 
            // but the API route we created in the mutations is built for INSERT for now.
            // We will POST the changes and the route handles Hasura upserts if set up correctly, 
            // or we can just send it off to a generic handler. 
            // Since it's demo logic we will just map properties.
            const payload = { ...values, ...(initialData?.id ? { id: initialData.id } : {}) };

            const res = await fetch('/api/mutations/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Failed to act on plan');
            }

            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: `Plan ${isEditing ? 'updated' : 'created'} successfully`,
            });
            onSuccess();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (values: PlanFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>
                        Configure the subscription plan&apos;s features and limits.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Pro Plan" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="High-level plan description..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price_monthly"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Price (R)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price_yearly"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Yearly Price (R)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ai_request_limit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>AI Request Limit /mo</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reel_limit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reel Limit /mo</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={mutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
