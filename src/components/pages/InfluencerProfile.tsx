import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    TrendingUp,
    Tag,
    History,
    Settings,
    ArrowLeft,
    Loader2,
    DollarSign,
    Briefcase,
    Plus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAddCommissionRule, useUpdateCommissionRule } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Switch } from '@/components/ui/switch';

interface InfluencerProfileProps {
    id: string;
}

const commissionRuleSchema = z.object({
    commission_type: z.enum(['fixed_per_order', 'percentage_of_order', 'milestone_bonus']),
    amount: z.string().or(z.number()).transform(v => v.toString()),
    order_threshold: z.number().nullable().optional(),
    high_value_influencer_bonus: z.string().optional(),
    high_value_order_threshold: z.string().optional(),
    free_delivery_enabled: z.boolean().default(false),
});

type CommissionRuleFormValues = z.infer<typeof commissionRuleSchema>;

const DEFAULT_RULE_VALUES: CommissionRuleFormValues = {
    commission_type: 'fixed_per_order',
    amount: '0',
    order_threshold: null,
    high_value_influencer_bonus: '0',
    high_value_order_threshold: '0',
    free_delivery_enabled: false,
};

const InfluencerProfile = ({ id }: InfluencerProfileProps) => {
    const [isRuleDrawerOpen, setIsRuleDrawerOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<any>(null);

    const queryClient = useQueryClient();
    const { hasAction } = usePrivilege();
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || 'Ksh';

    const addRuleMutation = useAddCommissionRule();
    const updateRuleMutation = useUpdateCommissionRule();

    const { data: influencer, isLoading } = useQuery({
        queryKey: ['influencer', id],
        queryFn: () => apiGet<{ influencer: any }>(`/api/queries/influencers?id=${id}`).then(r => r.influencer),
    });

    const ruleForm = useForm<CommissionRuleFormValues>({
        resolver: zodResolver(commissionRuleSchema),
        defaultValues: DEFAULT_RULE_VALUES,
    });

    const onRuleSubmit = async (values: CommissionRuleFormValues) => {
        try {
            if (selectedRule) {
                await updateRuleMutation.mutateAsync({
                    id: selectedRule.id,
                    ...values,
                });
                toast.success('Commission rule updated');
            } else {
                await addRuleMutation.mutateAsync({
                    influencer_id: id,
                    ...values,
                });
                toast.success('Commission rule added');
            }
            queryClient.invalidateQueries({ queryKey: ['influencer', id] });
            setIsRuleDrawerOpen(false);
            ruleForm.reset(DEFAULT_RULE_VALUES);
            setSelectedRule(null);
        } catch (error) {
            toast.error('Failed to save commission rule');
        }
    };

    const handleEditRule = (rule: any) => {
        setSelectedRule(rule);
        ruleForm.reset({
            commission_type: rule.commission_type,
            amount: rule.amount.toString(),
            order_threshold: rule.order_threshold,
            high_value_influencer_bonus: rule.high_value_influencer_bonus?.toString() || '0',
            high_value_order_threshold: rule.high_value_order_threshold?.toString() || '0',
            free_delivery_enabled: !!rule.free_delivery_enabled,
        });
        setIsRuleDrawerOpen(true);
    };

    const handleAddRule = () => {
        setSelectedRule(null);
        ruleForm.reset(DEFAULT_RULE_VALUES);
        setIsRuleDrawerOpen(true);
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    if (!influencer) {
        return (
            <AdminLayout>
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground">Influencer not found</p>
                    <Link href="/influencers">
                        <Button variant="outline">Back to Influencers</Button>
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const totalEarnings = influencer.influencer_earnings?.reduce((sum: number, e: any) => sum + parseFloat(e.earning_amount || 0), 0) || 0;

    return (
        <AdminLayout>
            <div className="mb-6">
                <Link href="/influencers" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2 w-fit">
                    <ArrowLeft className="h-4 w-4" /> Back to Influencers
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{influencer.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {influencer.membershipId || 'No ID'}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${influencer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {influencer.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="h-4 w-4" /> Edit Profile
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Total Earnings
                        </CardDescription>
                        <CardTitle className="text-2xl">{currency} {totalEarnings.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Total Orders
                        </CardDescription>
                        <CardTitle className="text-2xl">{influencer.influencer_earnings?.length || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Active Promotions
                        </CardDescription>
                        <CardTitle className="text-2xl">
                            {influencer.promotions?.filter((p: any) => p.status === 'active').length || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Profile & Payment</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="commissions">Commission Rules</TabsTrigger>
                    <TabsTrigger value="earnings">Earnings History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Joined Date</span>
                                    <span className="font-medium">{influencer.created_at ? format(new Date(influencer.created_at), 'MMM d, yyyy') : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Payment Terms</span>
                                    <span className="font-medium capitalize">{influencer.payment_terms || 'Standard'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Contract Period</span>
                                    <span className="font-medium">
                                        {influencer.contract_start_date ? format(new Date(influencer.contract_start_date), 'MMM yyyy') : ''}
                                        {influencer.contract_end_date ? ` - ${format(new Date(influencer.contract_end_date), 'MMM yyyy')}` : 'Open'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Email</p>
                                        <p className="font-medium">{influencer.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs uppercase font-semibold">Phone</p>
                                        <p className="font-medium">{influencer.phone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Payment Details</CardTitle>
                                <CardDescription>How the influencer gets paid.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="font-medium capitalize">{influencer.payment_method?.replace('_', ' ') || 'N/A'}</p>
                                </div>

                                {influencer.payment_method === 'momo' && (
                                    <div className="space-y-1 pt-2 border-t">
                                        <p className="text-sm text-muted-foreground">M-Pesa / MoMo Number</p>
                                        <p className="font-medium">{influencer.momo_number || 'N/A'}</p>
                                    </div>
                                )}

                                {influencer.payment_method === 'bank' && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Bank Name</p>
                                            <p className="font-medium">{influencer.bank_name || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Account Number</p>
                                            <p className="font-medium">{influencer.bank_account_number || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <p className="text-sm text-muted-foreground">Account Holder Name</p>
                                            <p className="font-medium">{influencer.bank_account_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Additional Information</CardTitle>
                                <CardDescription>Bio and internal notes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {influencer.description || 'No description provided.'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="promotions">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Assigned Promotions</CardTitle>
                                <CardDescription>Discounts linked to this influencer.</CardDescription>
                            </div>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" /> Link Promotion
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Promotion</TableHead>
                                        <TableHead>Promo Code</TableHead>
                                        <TableHead>Benefit</TableHead>
                                        <TableHead>Earning/Order</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {influencer.promotions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No promotions assigned</TableCell>
                                        </TableRow>
                                    ) : (
                                        influencer.promotions?.map((promo: any) => (
                                            <TableRow key={promo.id}>
                                                <TableCell className="font-medium">{promo.name}</TableCell>
                                                <TableCell>
                                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                                        {promo.influencer_code || promo.code || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {promo.promotion_type === 'percentage' ? `${promo.discount_value}% Off` : `${currency} ${promo.discount_value} Off`}
                                                </TableCell>
                                                <TableCell>{currency} {promo.earning_per_order || 0}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${promo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {promo.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="commissions">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Commission Rules</CardTitle>
                                <CardDescription>Rules defining how earnings are calculated based on performance.</CardDescription>
                            </div>
                            <Button size="sm" className="gap-2" onClick={handleAddRule}>
                                <Plus className="h-4 w-4" /> Add Rule
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Benefit</TableHead>
                                        <TableHead>Thresholds</TableHead>
                                        <TableHead>Free Delivery</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {influencer.influencer_commissions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No commission rules defined</TableCell>
                                        </TableRow>
                                    ) : (
                                        influencer.influencer_commissions?.map((rule: any) => (
                                            <TableRow key={rule.id}>
                                                <TableCell className="capitalize">{rule.commission_type.replace('_', ' ')}</TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{currency} {rule.amount}</div>
                                                    {rule.high_value_influencer_bonus && rule.high_value_influencer_bonus !== '0' && (
                                                        <div className="text-[10px] text-green-600 font-medium">
                                                            +{currency} {rule.high_value_influencer_bonus} (High Value)
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {rule.order_threshold ? `${rule.order_threshold} orders` : 'All orders'}
                                                    </div>
                                                    {rule.high_value_order_threshold && rule.high_value_order_threshold !== '0' && (
                                                        <div className="text-[10px] text-muted-foreground italic">
                                                            High value from {currency} {rule.high_value_order_threshold}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {rule.free_delivery_enabled ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                                                            Enabled
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(rule.created_at), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="earnings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Earnings History</CardTitle>
                            <CardDescription>History of all commissions earned from orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reference Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {influencer.influencer_earnings?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No earnings recorded yet</TableCell>
                                        </TableRow>
                                    ) : (
                                        influencer.influencer_earnings?.map((earning: any) => (
                                            <TableRow key={earning.id}>
                                                <TableCell className="text-sm">
                                                    {format(new Date(earning.created_at), 'MMM d, yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell className="font-bold text-green-600">{currency} {earning.earning_amount}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${earning.status === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {earning.status?.toUpperCase() || 'PENDING'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">
                                                    {earning.shop_order_id || earning.restaurant_order_id || earning.reel_order_id || 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Sheet open={isRuleDrawerOpen} onOpenChange={setIsRuleDrawerOpen}>
                <SheetContent className="sm:max-w-md h-full flex flex-col p-0">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle>{selectedRule ? 'Edit Commission Rule' : 'Add Commission Rule'}</SheetTitle>
                        <SheetDescription>
                            Define how this influencer earns from their performance.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <Form {...ruleForm}>
                            <form id="rule-form" onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-6">
                                <FormField
                                    control={ruleForm.control}
                                    name="commission_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rule Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="fixed_per_order">Fixed Amount per Order</SelectItem>
                                                    <SelectItem value="percentage_of_order">Percentage of Order Value</SelectItem>
                                                    <SelectItem value="milestone_bonus">One-time Milestone Bonus</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={ruleForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount ({currency} or %)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={ruleForm.control}
                                    name="order_threshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Order Count Threshold (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Required orders to trigger rule"
                                                    {...field}
                                                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Quantity of orders needed to trigger this commission rule.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <FormField
                                        control={ruleForm.control}
                                        name="high_value_order_threshold"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>High Value Threshold ({currency})</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="e.g. 5000" {...field} />
                                                </FormControl>
                                                <FormDescription>Order amount to qualify as "High Value"</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={ruleForm.control}
                                        name="high_value_influencer_bonus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>High Value Bonus ({currency})</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="e.g. 500" {...field} />
                                                </FormControl>
                                                <FormDescription>Extra bonus for high-value orders</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={ruleForm.control}
                                    name="free_delivery_enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Enable Free Delivery</FormLabel>
                                                <FormDescription>
                                                    Orders under this rule will have no delivery charges.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                    </div>

                    <div className="p-6 border-t bg-background flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsRuleDrawerOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="rule-form"
                            className="flex-1"
                            disabled={addRuleMutation.isPending || updateRuleMutation.isPending}
                        >
                            {(addRuleMutation.isPending || updateRuleMutation.isPending) && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            {selectedRule ? 'Update Rule' : 'Save Rule'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </AdminLayout>
    );
};

export default InfluencerProfile;
