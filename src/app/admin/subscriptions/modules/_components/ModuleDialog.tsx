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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ModuleData } from '../page';

const moduleSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9_]+$/, 'Slug can only contain lowercase letters, numbers, and underscores'),
    group_name: z.string().optional().nullable(),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

interface ModuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData: Partial<ModuleData> | null;
}

export function ModuleDialog({ open, onOpenChange, onSuccess, initialData }: ModuleDialogProps) {
    const { toast } = useToast();
    const isEditing = !!initialData?.id;

    const form = useForm<ModuleFormValues>({
        resolver: zodResolver(moduleSchema),
        defaultValues: {
            name: '',
            slug: '',
            group_name: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name || '',
                    slug: initialData.slug || '',
                    group_name: initialData.group_name || '',
                });
            } else {
                form.reset({
                    name: '',
                    slug: '',
                    group_name: '',
                });
            }
        }
    }, [open, initialData, form]);

    // Auto-generate slug from name if empty
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        form.setValue('name', newName, { shouldValidate: true });

        if (!isEditing && !form.getValues('slug')) {
            const slug = newName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            form.setValue('slug', slug, { shouldValidate: true });
        }
    }

    const mutation = useMutation({
        mutationFn: async (values: ModuleFormValues) => {
            const payload = { ...values, ...(initialData?.id ? { id: initialData.id } : {}) };

            const res = await fetch('/api/mutations/modules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Failed to act on module');
            }

            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: `Module ${isEditing ? 'updated' : 'created'} successfully`,
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

    const onSubmit = (values: ModuleFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Module' : 'Create New Module'}</DialogTitle>
                    <DialogDescription>
                        Register a new system feature that can be assigned to plans.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Module Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Advanced Analytics" {...field} onChange={(e) => {
                                            field.onChange(e);
                                            handleNameChange(e);
                                        }} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Module Slug</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. advanced_analytics"
                                            {...field}
                                            disabled={isEditing} // Typically slugs shouldn't change as they are used in code
                                        />
                                    </FormControl>
                                    <p className="text-[0.8rem] text-muted-foreground mt-1">This exact string is used in code to check access.</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="group_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. CRM, Analytics, Inventory" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Module' : 'Create Module'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
