'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Plan } from '../plans/page';
import { ModuleData } from '../modules/page';

interface PlanModule {
    id: string;
    plan_id: string;
    module_id: string;
}

export default function PlanModulesPage() {
    const { session } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [selectedPlanId, setSelectedPlanId] = useState<string>('');

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

    const { data: plansData, isLoading: isLoadingPlans } = useQuery<{ plans: Plan[] }>({
        queryKey: ['plans'],
        queryFn: async () => {
            const res = await fetch('/api/queries/plans');
            if (!res.ok) throw new Error('Failed to fetch plans');
            return res.json();
        },
    });

    const { data: modulesData, isLoading: isLoadingModules } = useQuery<{ modules: ModuleData[] }>({
        queryKey: ['modules'],
        queryFn: async () => {
            const res = await fetch('/api/queries/modules');
            if (!res.ok) throw new Error('Failed to fetch modules');
            return res.json();
        },
    });

    const { data: planModulesData, isLoading: isLoadingPlanModules, refetch: refetchPlanModules } = useQuery<{ plan_modules: PlanModule[] }>({
        queryKey: ['plan-modules', selectedPlanId],
        queryFn: async () => {
            const res = await fetch(`/api/queries/plan-modules?plan_id=${selectedPlanId}`);
            if (!res.ok) throw new Error('Failed to fetch plan modules');
            return res.json();
        },
        enabled: !!selectedPlanId,
    });

    const assignedModuleIds = new Set(planModulesData?.plan_modules?.map(pm => pm.module_id) || []);

    const toggleMutation = useMutation({
        mutationFn: async ({ moduleId, attach }: { moduleId: string; attach: boolean }) => {
            if (!selectedPlanId) throw new Error('No plan selected');

            const res = await fetch('/api/mutations/plan-modules', {
                method: attach ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: selectedPlanId, module_id: moduleId }),
            });

            if (!res.ok) throw new Error(`Failed to ${attach ? 'assign' : 'unassign'} module`);
            return res.json();
        },
        onSuccess: () => {
            refetchPlanModules();
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const groupedModules = modulesData?.modules?.reduce((acc, mod) => {
        const group = mod.group_name || 'Ungrouped';
        if (!acc[group]) acc[group] = [];
        acc[group].push(mod);
        return acc;
    }, {} as Record<string, ModuleData[]>) || {};

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Plan Module Assignments</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Select a subscription plan and toggle which features are included.
                </p>
            </div>

            <div className="max-w-md">
                <Label className="mb-2 block">Subscription Plan</Label>
                <Select disabled={isLoadingPlans} value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a plan to manage..." />
                    </SelectTrigger>
                    <SelectContent>
                        {plansData?.plans?.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!selectedPlanId ? (
                <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
                    Please select a plan from the dropdown above to view and assign modules.
                </div>
            ) : isLoadingModules || isLoadingPlanModules ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(groupedModules).map(([groupName, modules]) => (
                        <div key={groupName} className="rounded-md border bg-card p-4">
                            <h3 className="mb-4 font-semibold text-lg border-b pb-2">{groupName}</h3>
                            <div className="space-y-3">
                                {modules.map((mod) => (
                                    <div key={mod.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={mod.id}
                                            checked={assignedModuleIds.has(mod.id)}
                                            onCheckedChange={(checked) =>
                                                toggleMutation.mutate({ moduleId: mod.id, attach: checked as boolean })
                                            }
                                            disabled={toggleMutation.isPending}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={mod.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {mod.name}
                                            </label>
                                            <p className="text-[0.8rem] text-muted-foreground font-mono">{mod.slug}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
