import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Search, Plus, Loader2, User, Mail, Phone, ExternalLink, X, Check, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { usePrivilege } from '@/hooks/usePrivilege';
import Link from 'next/link';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAddInfluencer, useUpdateInfluencer } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface Influencer {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    membershipId?: string;
    description?: string;
    payment_method?: string;
    payment_terms?: string;
    momo_number?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    contract_start_date?: string;
    contract_end_date?: string;
}

const influencerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    status: z.enum(['active', 'inactive', 'pending']).default('active'),
    membershipId: z.string().optional(),
    description: z.string().optional(),
    payment_method: z.enum(['momo', 'bank', 'cash', 'other']).default('momo'),
    payment_terms: z.string().optional(),
    momo_number: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    bank_account_name: z.string().optional(),
    contract_start_date: z.string().optional(),
    contract_end_date: z.string().optional(),
});

type InfluencerFormValues = z.infer<typeof influencerSchema>;

const generateMembershipId = (): string => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).toUpperCase().slice(2, 6);
    return `INF-${date}-${random}`;
};

const DEFAULT_VALUES: InfluencerFormValues = {
    name: '',
    email: '',
    phone: '',
    status: 'active',
    membershipId: '',
    description: '',
    payment_method: 'momo',
    payment_terms: 'Monthly',
    momo_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    contract_start_date: '',
    contract_end_date: '',
};

const Influencers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

    const queryClient = useQueryClient();
    const { hasAction } = usePrivilege();
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || 'Ksh';

    const addInfluencerMutation = useAddInfluencer();
    const updateInfluencerMutation = useUpdateInfluencer();

    const form = useForm<InfluencerFormValues>({
        resolver: zodResolver(influencerSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const watchPaymentMethod = form.watch('payment_method');

    const { data: influencers, isLoading } = useQuery({
        queryKey: ['influencers'],
        queryFn: () => apiGet<{ influencers: Influencer[] }>('/api/queries/influencers').then(r => r.influencers),
    });

    const onSubmit = async (values: InfluencerFormValues) => {
        try {
            if (selectedInfluencer) {
                await updateInfluencerMutation.mutateAsync({
                    id: selectedInfluencer.id,
                    ...values,
                });
                toast.success('Influencer updated successfully');
            } else {
                await addInfluencerMutation.mutateAsync(values);
                toast.success('Influencer added successfully');
            }
            queryClient.invalidateQueries({ queryKey: ['influencers'] });
            setIsDrawerOpen(false);
            form.reset(DEFAULT_VALUES);
            setSelectedInfluencer(null);
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleEdit = (influencer: Influencer) => {
        setSelectedInfluencer(influencer);
        form.reset({
            name: influencer.name,
            email: influencer.email,
            phone: influencer.phone,
            status: influencer.status as any,
            membershipId: influencer.membershipId || '',
            description: influencer.description || '',
            payment_method: (influencer.payment_method as any) || 'momo',
            payment_terms: influencer.payment_terms || 'Monthly',
            momo_number: influencer.momo_number || '',
            bank_name: influencer.bank_name || '',
            bank_account_number: influencer.bank_account_number || '',
            bank_account_name: influencer.bank_account_name || '',
            contract_start_date: influencer.contract_start_date || '',
            contract_end_date: influencer.contract_end_date || '',
        });
        setIsDrawerOpen(true);
    };

    const handleAdd = () => {
        setSelectedInfluencer(null);
        form.reset({
            ...DEFAULT_VALUES,
            membershipId: generateMembershipId(),
        });
        setIsDrawerOpen(true);
    };

    const filteredInfluencers = useMemo(() => {
        if (!influencers) return [];
        if (!searchQuery.trim()) return influencers;

        const query = searchQuery.toLowerCase().trim();
        return influencers.filter(inf =>
            inf.name.toLowerCase().includes(query) ||
            inf.email.toLowerCase().includes(query) ||
            inf.phone.toLowerCase().includes(query) ||
            inf.membershipId?.toLowerCase().includes(query)
        );
    }, [influencers, searchQuery]);

    return (
        <AdminLayout>
            <PageHeader
                title="Influencers"
                description="Manage influencer partners and their commission structures."
                actions={
                    <div className="flex gap-2">
                        {hasAction('influencers', 'manage_influencers') && (
                            <Button className="gap-2" onClick={handleAdd}>
                                <Plus className="h-4 w-4" /> Add Influencer
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or membership ID..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Influencer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Membership ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredInfluencers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No influencers found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInfluencers.map(influencer => (
                                    <TableRow key={influencer.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="font-medium">{influencer.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {influencer.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    {influencer.phone}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                {influencer.membershipId || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${influencer.status === 'active' ? 'bg-green-100 text-green-800' :
                                                influencer.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {influencer.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2 text-right">
                                            {hasAction('influencers', 'manage_influencers') && (
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(influencer)}>
                                                    Edit
                                                </Button>
                                            )}
                                            <Link href={`/influencers/${influencer.id}`}>
                                                <Button variant="ghost" size="sm" className="gap-1.5">
                                                    View Profile <ExternalLink className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetContent className="sm:max-w-xl h-full flex flex-col p-0 overflow-y-auto">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle>{selectedInfluencer ? 'Edit Influencer' : 'Add New Influencer'}</SheetTitle>
                        <SheetDescription>
                            {selectedInfluencer ? 'Update influencer details and payment information.' : 'Register a new influencer in the system.'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 p-6">
                        <Form {...form}>
                            <form id="influencer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-primary">1. Basic Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John Doe" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="membershipId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        Membership ID
                                                        <span className="text-[10px] font-normal bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                                            {selectedInfluencer ? 'Assigned' : 'Auto-generated'}
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            readOnly
                                                            className="bg-muted/50 font-mono text-sm cursor-not-allowed select-all"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Address *</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="john@example.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+254..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description / Bio</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Tell us about the influencer..."
                                                        className="resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-primary">2. Payment & Terms</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="payment_method"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Payment Method</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="momo">Mobile Money</SelectItem>
                                                            <SelectItem value="bank">Bank Transfer</SelectItem>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="payment_terms"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Payment Terms</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select terms" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Per Order">Per Order</SelectItem>
                                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                                            <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                                            <SelectItem value="Custom">Custom</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {watchPaymentMethod === 'momo' && (
                                        <FormField
                                            control={form.control}
                                            name="momo_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="2547..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {watchPaymentMethod === 'bank' && (
                                        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                                            <FormField
                                                control={form.control}
                                                name="bank_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bank Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="KCB, Equity, etc." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="bank_account_number"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Account Number</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="bank_account_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Account Holder Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="contract_start_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contract Start</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="contract_end_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contract End</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    <div className="p-6 border-t bg-background flex gap-3 sticky bottom-0">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDrawerOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="influencer-form"
                            className="flex-1"
                            disabled={addInfluencerMutation.isPending || updateInfluencerMutation.isPending}
                        >
                            {(addInfluencerMutation.isPending || updateInfluencerMutation.isPending) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Influencer
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </AdminLayout>
    );
};

export default Influencers;
