'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';
import { apiGet } from '@/lib/api';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlanDialog } from './_components/PlanDialog';

export interface Plan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    ai_request_limit: number;
    reel_limit: number;
    created_at: string;
}

export default function PlansPage() {
    const { session } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Partial<Plan> | null>(null);

    // Security Check: any user with the 'subscriptions.access' privilege can view this page.
    // The sidebar already hides this section from non-project users via menuPrivileges.
    if (session && !hasPrivilege(session.privileges, 'subscriptions', 'access', session.role)) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
            </div>
        );
    }
    const { data, isLoading, refetch } = useQuery<{ plans: Plan[] }>({
        queryKey: ['plans'],
        queryFn: () => apiGet<{ plans: Plan[] }>('/api/queries/plans'),
    });

    const handleOpenDialog = (plan?: Plan) => {
        setSelectedPlan(plan || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedPlan(null);
        setIsDialogOpen(false);
        refetch();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage pricing tiers, AI limits, and reel upload limits for shops.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Plan
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan Name</TableHead>
                            <TableHead>Pricing</TableHead>
                            <TableHead>Limits</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : !data?.plans?.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No plans found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <div className="font-medium">{plan.name}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                                            {plan.description}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="font-normal">
                                                R {plan.price_monthly}/mo
                                            </Badge>
                                            <br />
                                            <Badge variant="outline" className="font-normal">
                                                R {plan.price_yearly}/yr
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm space-y-1">
                                            <div><span className="text-muted-foreground">AI:</span> {plan.ai_request_limit}</div>
                                            <div><span className="text-muted-foreground">Reels:</span> {plan.reel_limit}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(plan.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    toast({ title: 'Pending feature', description: 'Plan deletion UI to be implemented.' });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PlanDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={handleCloseDialog}
                initialData={selectedPlan}
            />
        </div>
    );
}
