'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';
import { apiGet } from '@/lib/api';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AssignSubscriptionDialog } from './_components/AssignSubscriptionDialog';

export interface ShopSubscription {
    id: string;
    shop_id: string;
    plan_id: string;
    status: string;
    billing_cycle: string;
    start_date: string;
    end_date: string | null;
    restaurant_id: string | null;
    business_id: string | null;
    created_at: string;
    plan?: {
        name: string;
    };
    Shop?: {
        name: string;
    };
    Restaurant?: {
        name: string;
    };
    business_account?: {
        business_name: string;
    };
}

export default function ShopSubscriptionsPage() {
    const { session } = useAuth();
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Security Check: any user with the 'subscriptions.access' privilege can view this page.
    if (session && !hasPrivilege(session.privileges, 'subscriptions', 'access', session.role)) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
            </div>
        );
    }

    const { data, isLoading } = useQuery<{ shop_subscriptions: ShopSubscription[] }>({
        queryKey: ['shop-subscriptions'],
        queryFn: () => apiGet<{ shop_subscriptions: ShopSubscription[] }>('/api/queries/shop-subscriptions'),
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shop Subscriptions</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View and manage active subscription plans for registered shops.
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2 w-fit">
                    <Plus className="h-4 w-4" />
                    Assign Subscription
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Target Entity</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Billing</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Next Billing</TableHead>
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
                        ) : !data?.shop_subscriptions?.length ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No active shop subscriptions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.shop_subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {sub.Shop?.name || sub.Restaurant?.name || sub.business_account?.business_name || 'Organization Subscription'}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {sub.shop_id || sub.restaurant_id || sub.business_id}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{sub.plan?.name || 'Unknown Plan'}</TableCell>
                                    <TableCell>
                                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(sub.start_date), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {sub.end_date ? (
                                            format(new Date(sub.end_date), 'MMM d, yyyy')
                                        ) : (
                                            <span className="text-muted-foreground italic">Manual Renewal</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AssignSubscriptionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    );
}
