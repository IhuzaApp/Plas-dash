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
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  GripVertical,
  Save,
  RotateCcw,
  CheckCircle2,
  Circle,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  X,
} from 'lucide-react';
import { Plan } from '../plans/page';
import { ModuleData } from '../modules/page';

interface PlanModule {
  id: string;
  plan_id: string;
  module_id: string;
}

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

function groupColor(g: string) {
  return GROUP_COLORS[g] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
}

// ── Draggable module card ────────────────────────────────────────────────────
function ModuleCard({ mod, overlay = false }: { mod: ModuleData; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-sm
        hover:shadow-md transition-all select-none
        ${overlay ? 'rotate-1 scale-105 shadow-xl cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
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
        className={`text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${groupColor(mod.group_name || '')}`}
      >
        {mod.group_name || '—'}
      </span>
    </div>
  );
}

// ── Group header (Assign All / Remove All) ───────────────────────────────────
function GroupHeader({
  group,
  count,
  collapsed,
  onToggle,
  onBulkAction,
  bulkLabel,
}: {
  group: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onBulkAction: () => void;
  bulkLabel: string;
}) {
  const isAdd = bulkLabel.startsWith('+');
  return (
    <div
      className={`flex items-center gap-1.5 w-full mt-2 py-1.5 px-2 rounded-md ${groupColor(group)}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 flex-1 text-left min-w-0"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="text-[0.72rem] font-bold truncate">{group}</span>
        <span className="text-[0.72rem] font-semibold ml-1 shrink-0 opacity-70">({count})</span>
      </button>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onBulkAction();
        }}
        className="flex items-center gap-0.5 text-[0.65rem] font-semibold px-1.5 py-0.5
          rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 whitespace-nowrap"
        title={bulkLabel}
      >
        {isAdd ? <ChevronsRight className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {bulkLabel}
      </button>
    </div>
  );
}

// ── Available column ─────────────────────────────────────────────────────────
function AvailableColumn({
  modules,
  isOver,
  setNodeRef,
  onAssignGroup,
}: {
  modules: ModuleData[];
  isOver: boolean;
  setNodeRef: (el: HTMLElement | null) => void;
  onAssignGroup: (group: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        (m.group_name ?? '').toLowerCase().includes(q)
    );
  }, [modules, search]);

  const grouped = useMemo(() => {
    const map: Record<string, ModuleData[]> = {};
    for (const m of filtered) {
      const g = m.group_name || 'Ungrouped';
      if (!map[g]) map[g] = [];
      map[g].push(m);
    }
    return map;
  }, [filtered]);

  const toggle = (g: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  return (
    <div
      className={`flex flex-col rounded-xl border-2 border-muted bg-card min-h-[420px] overflow-hidden transition-colors
      ${isOver ? 'bg-blue-50/40 dark:bg-blue-900/20 border-blue-300' : ''}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Available Modules</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {modules.length}
        </Badge>
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, slug, or group…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        {search && (
          <p className="text-[0.72rem] text-muted-foreground mt-1 pl-1">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* The ref makes the entire scrollable area a droppable target for id='available' */}
      <div ref={setNodeRef} className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto max-h-[580px]">
        <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground border-2 border-dashed rounded-md">
              {search ? 'No modules match your search.' : 'All modules are assigned ✓'}
            </div>
          ) : (
            Object.entries(grouped).map(([group, mods]) => {
              const isCollapsed = collapsed.has(group);
              return (
                <div key={group}>
                  <GroupHeader
                    group={group}
                    count={mods.length}
                    collapsed={isCollapsed}
                    onToggle={() => toggle(group)}
                    onBulkAction={() => onAssignGroup(group)}
                    bulkLabel="+ Assign All"
                  />
                  {!isCollapsed && (
                    <div className="space-y-1.5 pl-2 pt-1.5">
                      {mods.map(mod => (
                        <ModuleCard key={mod.id} mod={mod} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ── Assigned column ──────────────────────────────────────────────────────────
function AssignedColumn({
  modules,
  isOver,
  setNodeRef,
  onRemoveGroup,
}: {
  modules: ModuleData[];
  isOver: boolean;
  setNodeRef: (el: HTMLElement | null) => void;
  onRemoveGroup: (group: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<string, ModuleData[]> = {};
    for (const m of modules) {
      const g = m.group_name || 'Ungrouped';
      if (!map[g]) map[g] = [];
      map[g].push(m);
    }
    return map;
  }, [modules]);

  const toggle = (g: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  return (
    <div
      className={`flex flex-col rounded-xl border-2 border-emerald-400 dark:border-emerald-700 bg-card min-h-[420px] overflow-hidden transition-colors
      ${isOver ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Assigned to Plan</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {modules.length}
        </Badge>
      </div>

      {/* The ref makes the entire scrollable area a droppable target for id='assigned' */}
      <div ref={setNodeRef} className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[600px]">
        <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {modules.length === 0 ? (
            <div
              className={`flex items-center justify-center h-32 text-xs text-muted-foreground border-2 border-dashed rounded-md transition-colors
              ${isOver ? 'border-emerald-400 bg-emerald-50/40' : ''}`}
            >
              Drag modules here to assign them →
            </div>
          ) : (
            Object.entries(grouped).map(([group, mods]) => {
              const isCollapsed = collapsed.has(group);
              return (
                <div key={group}>
                  <GroupHeader
                    group={group}
                    count={mods.length}
                    collapsed={isCollapsed}
                    onToggle={() => toggle(group)}
                    onBulkAction={() => onRemoveGroup(group)}
                    bulkLabel="− Remove All"
                  />
                  {!isCollapsed && (
                    <div className="space-y-1.5 pl-2 pt-1.5">
                      {mods.map(mod => (
                        <ModuleCard key={mod.id} mod={mod} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PlanModulesPage() {
  const { session } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [localAssigned, setLocalAssigned] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleData | null>(null);

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
    queryFn: () => apiGet<{ plans: Plan[] }>('/api/queries/plans'),
  });

  const { data: modulesData, isLoading: isLoadingModules } = useQuery<{ modules: ModuleData[] }>({
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
      apiGet<{ plan_modules: PlanModule[] }>(`/api/queries/plan-modules?plan_id=${selectedPlanId}`),
    enabled: !!selectedPlanId,
  });

  useEffect(() => {
    if (planModulesData) {
      setLocalAssigned(planModulesData.plan_modules.map(pm => pm.module_id));
      setIsDirty(false);
    }
  }, [planModulesData]);

  const handlePlanChange = useCallback((pid: string) => {
    setSelectedPlanId(pid);
    setLocalAssigned([]);
    setIsDirty(false);
  }, []);

  const allModules = useMemo(() => modulesData?.modules ?? [], [modulesData]);
  const assignedModules = useMemo(
    () =>
      localAssigned.map(id => allModules.find(m => m.id === id)).filter(Boolean) as ModuleData[],
    [allModules, localAssigned]
  );
  const availableModules = useMemo(
    () => allModules.filter(m => !localAssigned.includes(m.id)),
    [allModules, localAssigned]
  );

  // ── Group bulk actions ─────────────────────────────────────────────────────
  const handleAssignGroup = useCallback(
    (group: string) => {
      const ids = availableModules
        .filter(m => (m.group_name || 'Ungrouped') === group)
        .map(m => m.id);
      setLocalAssigned(prev => {
        const adding = ids.filter(id => !prev.includes(id));
        return [...prev, ...adding];
      });
      setIsDirty(true);
    },
    [availableModules]
  );

  const handleRemoveGroup = useCallback(
    (group: string) => {
      const ids = assignedModules
        .filter(m => (m.group_name || 'Ungrouped') === group)
        .map(m => m.id);
      setLocalAssigned(prev => prev.filter(id => !ids.includes(id)));
      setIsDirty(true);
    },
    [assignedModules]
  );

  // ── DnD ────────────────────────────────────────────────────────────────────
  // Using pointerWithin: fires based on where the pointer physically is,
  // which is reliable for column-to-column transfers.
  // All state changes happen ONLY in handleDragEnd to avoid race conditions.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart({ active }: DragStartEvent) {
    setActiveModule(allModules.find(m => m.id === active.id) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveModule(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // The pointer was over `over.id`, which is either:
    //   - 'available' or 'assigned' (the useDroppable container id)
    //   - a module id (a sortable item inside a container)
    const droppedOnAssigned =
      overId === 'assigned' || (overId !== 'available' && localAssigned.includes(overId));

    const wasAssigned = localAssigned.includes(activeId);

    if (!wasAssigned && droppedOnAssigned) {
      // available → assigned
      setLocalAssigned(prev => (prev.includes(activeId) ? prev : [...prev, activeId]));
      setIsDirty(true);
    } else if (wasAssigned && !droppedOnAssigned) {
      // assigned → available
      setLocalAssigned(prev => prev.filter(id => id !== activeId));
      setIsDirty(true);
    }
  }

  // Make each column scrollable div a droppable zone for its own id
  const { setNodeRef: setAvailableRef, isOver: isOverAvailable } = useDroppable({
    id: 'available',
  });
  const { setNodeRef: setAssignedRef, isOver: isOverAssigned } = useDroppable({ id: 'assigned' });

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
      setLocalAssigned(planModulesData.plan_modules.map(pm => pm.module_id));
      setIsDirty(false);
    }
  };

  const isLoading = isLoadingModules || isLoadingPlanModules;
  const selectedPlanName = plansData?.plans?.find(p => p.id === selectedPlanId)?.name;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Module Assignments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag individual modules or use <strong>+ Assign All</strong> on a group to bulk-assign.
            Then save.
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

      <div className="max-w-sm">
        <Label className="mb-2 block">Subscription Plan</Label>
        <Select disabled={isLoadingPlans} value={selectedPlanId} onValueChange={handlePlanChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a plan to manage…" />
          </SelectTrigger>
          <SelectContent>
            {plansData?.plans?.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedPlanId && (
        <div className="rounded-xl border-2 border-dashed p-16 text-center text-muted-foreground">
          Select a plan above to start assigning modules.
        </div>
      )}

      {selectedPlanId && isLoading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      )}

      {selectedPlanId && !isLoading && (
        <>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <strong className="text-foreground">{assignedModules.length}</strong>&nbsp;assigned
              to&nbsp;<em>{selectedPlanName}</em>
            </span>
            <span className="flex items-center gap-1.5">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <strong className="text-foreground">{availableModules.length}</strong>&nbsp;available
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AvailableColumn
                modules={availableModules}
                isOver={isOverAvailable}
                setNodeRef={setAvailableRef}
                onAssignGroup={handleAssignGroup}
              />
              <AssignedColumn
                modules={assignedModules}
                isOver={isOverAssigned}
                setNodeRef={setAssignedRef}
                onRemoveGroup={handleRemoveGroup}
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
