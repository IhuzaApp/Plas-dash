'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';
import { apiGet, apiPatch } from '@/lib/api';

import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { GripVertical, Save, RotateCcw, CheckCircle2, Circle } from 'lucide-react';
import { Plan } from '../plans/page';
import { ModuleData } from '../modules/page';

interface PlanModule {
    id: string;
    plan_id: string;
    module_id: string;
}

// ── Group badge colours ─────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, string> = {
    Operations: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Finance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'Inventory & Catalog': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'Staff & Access': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Engagement & CRM': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    Dashboards: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    'Logistics & Suppliers': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    System: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

const CONTAINER_IDS = ['available', 'assigned'] as const;
type ContainerId = (typeof CONTAINER_IDS)[number];

function groupColor(group: string) {
    return GROUP_COLORS[group] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
}

// ── Draggable module card ───────────────────────────────────────────────────
function ModuleCard({ mod, overlay = false }: { mod: ModuleData; overlay?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: mod.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-sm
        hover:shadow-md transition-all select-none
        ${overlay ? 'rotate-2 scale-105 shadow-xl cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
        ${isDragging && !overlay ? 'opacity-30' : 'opacity-100'}`}
            {...attributes}
            {...listeners}
        >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">{mod.name}</p>
                <p className="text-[0.72rem] text-muted-foreground font-mono mt-0.5 truncate">{mod.slug}</p>
            </div>
            <span
                className={`text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${groupColor(
                    mod.group_name || ''
                )}`}
            >
                {mod.group_name || '—'}
            </span>
        </div>
    );
}

// ── Droppable column ────────────────────────────────────────────────────────
function DropColumn({
    id,
    title,
    icon,
    modules,
    emptyLabel,
    accent,
}: {
    id: ContainerId;
    title: string;
    icon: React.ReactNode;
    modules: ModuleData[];
    emptyLabel: string;
    accent: string;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            className={`flex flex-col rounded-xl border-2 ${accent} bg-card min-h-[420px] overflow-hidden
        transition-colors ${isOver ? 'bg-accent/40' : ''}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {modules.length}
                </Badge>
            </div>

            {/* List */}
            <div ref={setNodeRef} className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[600px]">
                <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    {modules.length === 0 ? (
                        <div
                            className={`flex items-center justify-center h-32 text-xs text-muted-foreground
                border-2 border-dashed rounded-md transition-colors ${isOver ? 'border-primary/60 bg-primary/5' : ''}`}
                        >
                            {emptyLabel}
                        </div>
                    ) : (
                        modules.map((mod) => <ModuleCard key={mod.id} mod={mod} />)
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

// The column-level droppable is on the inner div (setNodeRef). Its id is 'available'/'assigned'.
// When we drag a module, over.id can be: a module id, or the column id itself.
// We resolve to a container by checking which list the over.id belongs to.

// ── Main Page ───────────────────────────────────────────────────────────────
export default function PlanModulesPage() {
    const { session } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    // Local copy of which module ids are assigned
    const [localAssigned, setLocalAssigned] = useState<string[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [activeModule, setActiveModule] = useState<ModuleData | null>(null);

    // ── Auth ──────────────────────────────────────────────────────────────────
    if (session && !hasPrivilege(session.privileges, 'subscriptions', 'access', session.role)) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
            </div>
        );
    }

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: plansData, isLoading: isLoadingPlans } = useQuery<{ plans: Plan[] }>({
        queryKey: ['plans'],
        queryFn: () => apiGet<{ plans: Plan[] }>('/api/queries/plans'),
    });

    const { data: modulesData, isLoading: isLoadingModules } = useQuery<{
        modules: ModuleData[];
    }>({
        queryKey: ['modules'],
        queryFn: () => apiGet<{ modules: ModuleData[] }>('/api/queries/modules'),
    });

    const {
        data: planModulesData,
        isLoading: isLoadingPlanModules,
        refetch: refetchPlanModules,
    } = useQuery<{ plan_modules: PlanModule[] }>({
        queryKey: ['plan-modules', selectedPlanId],
        queryFn: () =>
            apiGet<{ plan_modules: PlanModule[] }>(
                `/api/queries/plan-modules?plan_id=${selectedPlanId}`
            ),
        enabled: !!selectedPlanId,
    });

    // Sync remote data into local list
    useEffect(() => {
        if (planModulesData) {
            setLocalAssigned(planModulesData.plan_modules.map((pm) => pm.module_id));
            setIsDirty(false);
        }
    }, [planModulesData]);

    const handlePlanChange = useCallback((pid: string) => {
        setSelectedPlanId(pid);
        setLocalAssigned([]);
        setIsDirty(false);
    }, []);

    // ── Derived lists ─────────────────────────────────────────────────────────
    const allModules = useMemo(() => modulesData?.modules ?? [], [modulesData]);

    const assignedModules = useMemo(
        () =>
            localAssigned
                .map((id) => allModules.find((m) => m.id === id))
                .filter(Boolean) as ModuleData[],
        [allModules, localAssigned]
    );

    const availableModules = useMemo(
        () => allModules.filter((m) => !localAssigned.includes(m.id)),
        [allModules, localAssigned]
    );

    // Resolve: given any id (module or column), return 'available' | 'assigned' | null
    const resolveContainer = useCallback(
        (id: string): ContainerId | null => {
            if (id === 'available' || id === 'assigned') return id as ContainerId;
            if (localAssigned.includes(id)) return 'assigned';
            if (allModules.some((m) => m.id === id)) return 'available';
            return null;
        },
        [localAssigned, allModules]
    );

    // ── DnD sensors ───────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function handleDragStart({ active }: DragStartEvent) {
        setActiveModule(allModules.find((m) => m.id === active.id) ?? null);
    }

    function handleDragOver({ active, over }: DragOverEvent) {
        if (!over) return;
        const activeContainer = resolveContainer(active.id as string);
        const overContainer = resolveContainer(over.id as string);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setLocalAssigned((prev) => {
            if (overContainer === 'assigned') {
                return prev.includes(active.id as string) ? prev : [...prev, active.id as string];
            } else {
                return prev.filter((id) => id !== (active.id as string));
            }
        });
        setIsDirty(true);
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
        setActiveModule(null);
        if (!over) return;
        const activeContainer = resolveContainer(active.id as string);
        const overContainer = resolveContainer(over.id as string);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setLocalAssigned((prev) => {
            if (overContainer === 'assigned') {
                return prev.includes(active.id as string) ? prev : [...prev, active.id as string];
            } else {
                return prev.filter((id) => id !== (active.id as string));
            }
        });
        setIsDirty(true);
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: () =>
            apiPatch('/api/mutations/plan-modules', {
                plan_id: selectedPlanId,
                module_ids: localAssigned,
            }),
        onSuccess: () => {
            toast({ title: 'Saved!', description: 'Module assignments updated successfully.' });
            refetchPlanModules();
            setIsDirty(false);
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        },
    });

    const handleReset = () => {
        if (planModulesData) {
            setLocalAssigned(planModulesData.plan_modules.map((pm) => pm.module_id));
            setIsDirty(false);
        }
    };

    const isLoading = isLoadingModules || isLoadingPlanModules;
    const selectedPlanName = plansData?.plans?.find((p) => p.id === selectedPlanId)?.name;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Plan Module Assignments</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Drag modules between columns then click{' '}
                        <strong>Save Changes</strong>.
                    </p>
                </div>

                {selectedPlanId && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            disabled={!isDirty || saveMutation.isPending}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => saveMutation.mutate()}
                            disabled={!isDirty || saveMutation.isPending}
                            className="min-w-[130px]"
                        >
                            {saveMutation.isPending ? (
                                <span className="flex items-center gap-1.5">
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving…
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                    {isDirty && (
                                        <span className="bg-primary-foreground text-primary rounded-full w-4 h-4 text-[0.6rem] font-bold flex items-center justify-center">
                                            !
                                        </span>
                                    )}
                                </span>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Plan Selector */}
            <div className="max-w-sm">
                <Label className="mb-2 block">Subscription Plan</Label>
                <Select disabled={isLoadingPlans} value={selectedPlanId} onValueChange={handlePlanChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a plan to manage…" />
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

            {/* Empty state */}
            {!selectedPlanId && (
                <div className="rounded-xl border-2 border-dashed p-16 text-center text-muted-foreground">
                    Select a plan above to start assigning modules.
                </div>
            )}

            {/* Loading */}
            {selectedPlanId && isLoading && (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
                </div>
            )}

            {/* DnD board */}
            {selectedPlanId && !isLoading && (
                <>
                    {/* Stats bar */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <strong className="text-foreground">{assignedModules.length}</strong>
                            &nbsp;assigned to&nbsp;<em>{selectedPlanName}</em>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <strong className="text-foreground">{availableModules.length}</strong>
                            &nbsp;available
                        </span>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <DropColumn
                                id="available"
                                title="Available Modules"
                                icon={<Circle className="h-4 w-4 text-muted-foreground" />}
                                modules={availableModules}
                                emptyLabel="All modules are assigned ✓"
                                accent="border-muted"
                            />
                            <DropColumn
                                id="assigned"
                                title="Assigned to Plan"
                                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                modules={assignedModules}
                                emptyLabel="Drag modules here to assign them →"
                                accent="border-emerald-400 dark:border-emerald-700"
                            />
                        </div>

                        <DragOverlay dropAnimation={null}>
                            {activeModule ? <ModuleCard mod={activeModule} overlay /> : null}
                        </DragOverlay>
                    </DndContext>
                </>
            )}
        </div>
    );
}
