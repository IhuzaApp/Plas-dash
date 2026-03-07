'use client';

import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ShopSubscription } from '../page';
import type { SubscriptionInvoice } from './SubscriptionInvoices';

import { BillingTrendChart } from './BillingTrendChart';

interface UpcomingRenewalsProps {
    subscriptions: ShopSubscription[];
    invoices: SubscriptionInvoice[];
    isLoading: boolean;
}

export function UpcomingRenewals({ subscriptions, invoices, isLoading }: UpcomingRenewalsProps) {
    // Sort by end_date (next billing)
    const sortedSub = [...subscriptions]
        .filter(s => s.status === 'active' && s.end_date)
        .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime());

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <BillingTrendChart subscriptions={subscriptions} invoices={invoices} />

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Target Entity</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Billing Cycle</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Next Billing Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedSub.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No upcoming renewals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedSub.map((sub) => {
                                const amount = sub.billing_cycle === 'yearly' ? sub.plan?.price_yearly : sub.plan?.price_monthly;
                                return (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {sub.Shop?.name || sub.Restaurant?.name || sub.business_account?.business_name || 'Organization'}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {sub.shop_id || sub.restaurant_id || sub.business_id}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{sub.plan?.name || 'Unknown'}</TableCell>
                                        <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                                        <TableCell className="font-bold text-primary">
                                            {amount ? formatCurrency(amount) : 'Free'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {format(new Date(sub.end_date!), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-primary/5">
                                                Active
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
