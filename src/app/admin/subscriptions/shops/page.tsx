'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';

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

export interface ShopSubscription {
    id: string;
    shop_id: string;
    plan_id: string;
    status: string;
    billing_cycle: string;
    start_date: string;
    end_date: string | null;
    created_at: string;
    plan?: {
        name: string;
    };
}

export default function ShopSubscriptionsPage() {
    const { session } = useAuth();
    const router = useRouter();

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
        queryFn: async () => {
            const res = await fetch('/api/queries/shop-subscriptions');
            if (!res.ok) throw new Error('Failed to fetch shop subscriptions');
            return res.json();
        },
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Shop Subscriptions</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    View and manage active subscription plans for registered shops.
                </p>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Shop ID</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Billing</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
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
                                    <TableCell className="font-mono text-sm">{sub.shop_id}</TableCell>
                                    <TableCell className="font-medium">{sub.plan?.name || sub.plan_id}</TableCell>
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
                                            <span className="text-muted-foreground italic">None</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
