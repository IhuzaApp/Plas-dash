'use client';

/**
 * ProductionSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Integrated Production management with:
 *  - Live dashboard summary cards (today's stats)
 *  - Production Orders table
 *  - Create Order modal with ingredient stock checks and dynamic cost preview
 *  - "Simulate Production" — deducts stock, adds finished goods, updates UI
 *
 * All state is local (useState). No backend calls.
 * Replace mock state initialisers with API data when ready.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    AlertCircle, CheckCircle2, Clock, Plus, TriangleAlert, FlaskConical, Trash2,
    DollarSign, TrendingUp, Package, Activity, Eye, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    DUMMY_RECIPES,
    DUMMY_PRODUCTION_ORDERS,
    DUMMY_INVENTORY_SNAPSHOT,
    Recipe,
    ProductionOrder,
    ProductionStatus,
    computeFullCost,
} from '@/lib/data/dummy-production';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Tracks available stock keyed by ingredient name (lowercased). */
type MockStock = Record<string, number>;

/** Tracks total finished units produced, keyed by recipeId. */
type FinishedGoods = Record<string, number>;

interface StockCheckLine {
    name: string;
    required: number;
    available: number;
    unit: string;
    isSufficient: boolean;
    willBeLow: boolean;
    threshold: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const TODAY = '2026-02-28'; // Fixed "today" — replace with new Date().toISOString().slice(0,10)

function isToday(iso: string) {
    return iso.startsWith(TODAY);
}

const STATUS_CFG: Record<ProductionStatus, { badge: string; icon: React.ReactNode; label: string }> = {
    Completed: { badge: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Completed' },
    'In Progress': { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="h-3.5 w-3.5" />, label: 'In Progress' },
    Draft: { badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Activity className="h-3.5 w-3.5" />, label: 'Planned' },
    Cancelled: { badge: 'bg-red-100  text-red-700   border-red-200', icon: <AlertCircle className="h-3.5 w-3.5" />, label: 'Cancelled' },
};

function buildInitialStock(): MockStock {
    const stock: MockStock = {};
    for (const item of DUMMY_INVENTORY_SNAPSHOT) {
        stock[item.name.toLowerCase()] = item.currentStock;
    }
    return stock;
}

function checkStock(recipe: Recipe, qty: number, stock: MockStock): StockCheckLine[] {
    return recipe.ingredients.map(ing => {
        const key = ing.name.toLowerCase();
        const available = stock[key] ?? 999;
        const required = ing.quantity * qty;
        const snap = DUMMY_INVENTORY_SNAPSHOT.find(s => s.name.toLowerCase() === key);
        const threshold = snap?.lowStockThreshold ?? 0;
        return {
            name: ing.name,
            unit: ing.unit,
            available,
            required,
            threshold,
            isSufficient: available >= required,
            willBeLow: available >= required && (available - required) < threshold,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({
    label, value, sub, icon: Icon, color, bg,
}: {
    label: string; value: string; sub?: string;
    icon: React.ComponentType<{ className?: string }>; color: string; bg: string;
}) {
    return (
        <Card className="py-5">
            <CardContent className="py-0 px-5 flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                    <p className={`text-2xl font-bold tracking-tight mt-0.5 ${color}`}>{value}</p>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductionSection() {
    // ── Core state ─────────────────────────────────────────────────────────────
    const [orders, setOrders] = useState<ProductionOrder[]>(DUMMY_PRODUCTION_ORDERS);
    const [stock, setStock] = useState<MockStock>(buildInitialStock);
    const [finishedGoods, setFinishedGoods] = useState<FinishedGoods>({});

    // ── Modal state ─────────────────────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState<ProductionOrder | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // ── Form state ──────────────────────────────────────────────────────────────
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>(DUMMY_RECIPES[0].id);
    const [batchQty, setBatchQty] = useState(1);
    const [simulating, setSimulating] = useState(false);

    // ─── Derived: today's stats ─────────────────────────────────────────────────
    const todayStats = useMemo(() => {
        const todayCompleted = orders.filter(o => o.status === 'Completed' && isToday(o.scheduledDate));
        const todayAll = orders.filter(o => isToday(o.scheduledDate));
        const totalUnitsToday = todayCompleted.reduce((s, o) => {
            const r = DUMMY_RECIPES.find(r => r.id === o.recipeId);
            return s + (r ? r.yieldQty * o.batchQty : 0);
        }, 0);
        const totalCostToday = todayCompleted.reduce((s, o) => {
            const r = DUMMY_RECIPES.find(r => r.id === o.recipeId);
            if (!r) return s;
            return s + computeFullCost(r, o.batchQty).totalCost;
        }, 0);
        const estRevenue = todayCompleted.reduce((s, o) => {
            const r = DUMMY_RECIPES.find(r => r.id === o.recipeId);
            return s + (r ? r.sellingPrice * r.yieldQty * o.batchQty : 0);
        }, 0);
        return {
            ordersToday: todayAll.length,
            totalUnitsToday,
            totalCostToday,
            estRevenue,
            estProfit: estRevenue - totalCostToday,
        };
    }, [orders]);

    // ─── Low stock items ────────────────────────────────────────────────────────
    const lowStockItems = useMemo(() => {
        return DUMMY_INVENTORY_SNAPSHOT.filter(s => {
            const current = stock[s.name.toLowerCase()] ?? s.currentStock;
            return current < s.lowStockThreshold;
        });
    }, [stock]);

    // ─── Recipe in the modal ────────────────────────────────────────────────────
    const selectedRecipe = DUMMY_RECIPES.find(r => r.id === selectedRecipeId) ?? DUMMY_RECIPES[0];
    const stockCheck = useMemo(() => checkStock(selectedRecipe, batchQty, stock), [selectedRecipe, batchQty, stock]);
    const hasInsufficientStock = stockCheck.some(l => !l.isSufficient);
    const recipeCost = useMemo(() => computeFullCost(selectedRecipe, batchQty), [selectedRecipe, batchQty]);
    const estRevenue = selectedRecipe.sellingPrice * selectedRecipe.yieldQty * batchQty;
    const estProfit = estRevenue - recipeCost.totalCost;

    // ─── Simulate Production ────────────────────────────────────────────────────
    const handleSimulate = useCallback(() => {
        if (hasInsufficientStock) { toast.error('Insufficient stock to simulate production'); return; }
        setSimulating(true);

        setTimeout(() => {
            // Deduct stock
            setStock(prev => {
                const next = { ...prev };
                selectedRecipe.ingredients.forEach(ing => {
                    const key = ing.name.toLowerCase();
                    next[key] = (next[key] ?? 0) - ing.quantity * batchQty;
                });
                return next;
            });

            // Add finished goods
            setFinishedGoods(prev => ({
                ...prev,
                [selectedRecipeId]: (prev[selectedRecipeId] ?? 0) + selectedRecipe.yieldQty * batchQty,
            }));

            // Create completed order
            const now = new Date().toISOString();
            const newOrder: ProductionOrder = {
                id: `po-sim-${Date.now()}`,
                recipeId: selectedRecipeId,
                recipeName: selectedRecipe.name,
                batchQty,
                status: 'Completed',
                assignedStaff: 'Simulation',
                scheduledDate: now,
                completedDate: now,
                totalIngredientCost: recipeCost.ingredientCost,
                createdAt: now,
                notes: 'Simulated production run',
            };

            setOrders(prev => [newOrder, ...prev]);
            setCreateOpen(false);
            setSimulating(false);
            setSelectedRecipeId(DUMMY_RECIPES[0].id);
            setBatchQty(1);

            toast.success(
                `Production simulated! ${selectedRecipe.yieldQty * batchQty} ${selectedRecipe.yieldUnit} of "${selectedRecipe.name}" added to finished goods.`
            );
        }, 800);
    }, [hasInsufficientStock, selectedRecipe, batchQty, selectedRecipeId, recipeCost]);

    // ─── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = () => {
        setOrders(prev => prev.filter(o => o.id !== deleteId));
        setDeleteId(null);
        toast.success('Order removed');
    };

    // ─── Reset form on close ────────────────────────────────────────────────────
    const handleCloseCreate = () => {
        setCreateOpen(false);
        setSelectedRecipeId(DUMMY_RECIPES[0].id);
        setBatchQty(1);
    };

    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="space-y-8">

                {/* ── Header ─────────────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Production</h2>
                        <p className="text-muted-foreground mt-1">
                            Track production orders, simulate runs, and monitor stock in real time.
                        </p>
                    </div>
                    <Button size="lg" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Production Order
                    </Button>
                </div>

                {/* ── Dashboard Summary Cards ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <SummaryCard
                        label="Orders Today"
                        value={String(todayStats.ordersToday)}
                        sub={`${orders.filter(o => o.status === 'In Progress').length} in progress`}
                        icon={Activity}
                        color="text-violet-600"
                        bg="bg-violet-100 dark:bg-violet-900/30"
                    />
                    <SummaryCard
                        label="Units Produced Today"
                        value={String(todayStats.totalUnitsToday)}
                        icon={Package}
                        color="text-blue-600"
                        bg="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <SummaryCard
                        label="Total Cost Today"
                        value={fmt(todayStats.totalCostToday)}
                        icon={DollarSign}
                        color="text-rose-600"
                        bg="bg-rose-100 dark:bg-rose-900/30"
                    />
                    <SummaryCard
                        label="Est. Revenue Today"
                        value={fmt(todayStats.estRevenue)}
                        icon={TrendingUp}
                        color="text-green-600"
                        bg="bg-green-100 dark:bg-green-900/30"
                    />
                    <SummaryCard
                        label="Est. Profit Today"
                        value={fmt(todayStats.estProfit)}
                        sub={todayStats.estRevenue > 0 ? `${((todayStats.estProfit / todayStats.estRevenue) * 100).toFixed(1)}% margin` : undefined}
                        icon={TrendingUp}
                        color={todayStats.estProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
                        bg="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                </div>

                {/* ── Low Materials Alert ─────────────────────────────────────────────── */}
                {lowStockItems.length > 0 && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
                        <TriangleAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                Low Raw Material Stock Alert ({lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''})
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {lowStockItems.map(item => {
                                    const current = stock[item.name.toLowerCase()] ?? item.currentStock;
                                    return (
                                        <span key={item.id}
                                            className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                            {item.name}: {current.toFixed(1)} {item.unit}
                                            <span className="opacity-60 ml-1">(min {item.lowStockThreshold})</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Finished Goods Summary (only after simulation) ───────────────────── */}
                {Object.keys(finishedGoods).length > 0 && (
                    <Card className="border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-300">
                                <CheckCircle2 className="h-4 w-4" />
                                Finished Goods (this session)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(finishedGoods).map(([id, qty]) => {
                                    const r = DUMMY_RECIPES.find(r => r.id === id);
                                    if (!r) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                            <Package className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                {r.name}: <strong>{qty} {r.yieldUnit}</strong>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Production Orders Table ─────────────────────────────────────────── */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-3">
                        <CardTitle>Production Orders ({orders.length})</CardTitle>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                            {(['Draft', 'In Progress', 'Completed', 'Cancelled'] as ProductionStatus[]).map(s => (
                                <span key={s} className="flex items-center gap-1">
                                    <span className={`inline-block w-2 h-2 rounded-full ${s === 'Completed' ? 'bg-green-500' : s === 'In Progress' ? 'bg-amber-500' : s === 'Cancelled' ? 'bg-red-500' : 'bg-slate-400'
                                        }`} />
                                    {orders.filter(o => o.status === s).length} {s}
                                </span>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="border-t overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Recipe Name</TableHead>
                                        <TableHead className="text-right">Qty Produced</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length > 0 ? orders.map(order => {
                                        const recipe = DUMMY_RECIPES.find(r => r.id === order.recipeId);
                                        const units = recipe ? recipe.yieldQty * order.batchQty : order.batchQty;
                                        const costTotal = recipe ? computeFullCost(recipe, order.batchQty).totalCost : order.totalIngredientCost;
                                        const cfg = STATUS_CFG[order.status];
                                        return (
                                            <TableRow key={order.id} className="group">
                                                <TableCell>
                                                    <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                                                    {order.notes === 'Simulated production run' && (
                                                        <Badge variant="outline" className="ml-2 text-xs bg-violet-50 text-violet-700 border-violet-200">
                                                            <FlaskConical className="h-3 w-3 mr-1" />Simulated
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{order.recipeName}</TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {units} {recipe?.yieldUnit ?? 'units'}
                                                    <span className="text-xs text-muted-foreground ml-1">({order.batchQty} batch{order.batchQty !== 1 ? 'es' : ''})</span>
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-semibold">{fmt(costTotal)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.badge}`}>
                                                        {cfg.icon}{cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(order.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => setViewOrder(order)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {order.status !== 'Completed' && (
                                                            <Button variant="ghost" size="icon" className="text-destructive"
                                                                onClick={() => setDeleteId(order.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No production orders yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ════════════════════════════════════════════════════════════════════════
          Create Production Order Modal
      ════════════════════════════════════════════════════════════════════════ */}
            <Dialog open={createOpen} onOpenChange={open => !open && handleCloseCreate()}>
                <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-violet-600" />
                            New Production Order
                        </DialogTitle>
                        <DialogDescription>
                            Select a recipe and quantity. Ingredient availability and cost are calculated in real time.
                            Click <strong>Simulate Production</strong> to commit the run and update mock stock.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* ── Recipe + Qty ─────────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Select Recipe <span className="text-destructive">*</span></Label>
                                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DUMMY_RECIPES.filter(r => r.isActive).map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Batches to Produce</Label>
                                <Input type="number" min={1} max={50} value={batchQty}
                                    onChange={e => setBatchQty(Math.max(1, Number(e.target.value)))} />
                            </div>
                        </div>

                        {/* ── Recipe quick info ─────────────────────────────────────────── */}
                        <div className="rounded-lg bg-muted/30 border p-3 text-sm flex flex-wrap gap-4">
                            <span><strong>Category:</strong> {selectedRecipe.category}</span>
                            <span><strong>Yield:</strong> {selectedRecipe.yieldQty * batchQty} {selectedRecipe.yieldUnit}</span>
                            <span><strong>Waste:</strong> {selectedRecipe.wastePct}%</span>
                        </div>

                        {/* ── Ingredient Stock Check ────────────────────────────────────── */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Required Ingredients vs Available Stock
                            </p>

                            {hasInsufficientStock && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-300 text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <strong>Insufficient stock</strong> — some ingredients cannot meet requirements for {batchQty} batch{batchQty !== 1 ? 'es' : ''}.
                                </div>
                            )}

                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ingredient</TableHead>
                                            <TableHead className="text-right">Required</TableHead>
                                            <TableHead className="text-right">Available</TableHead>
                                            <TableHead className="text-right">After Run</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stockCheck.map((line, i) => (
                                            <TableRow key={i}
                                                className={!line.isSufficient ? 'bg-red-50/50 dark:bg-red-950/10' : line.willBeLow ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                                                <TableCell className="text-sm font-medium py-2">{line.name}</TableCell>
                                                <TableCell className="text-right text-sm py-2 font-semibold">
                                                    {line.required.toFixed(2)} {line.unit}
                                                </TableCell>
                                                <TableCell className="text-right text-sm py-2">
                                                    {line.available.toFixed(2)} {line.unit}
                                                </TableCell>
                                                <TableCell className={`text-right text-sm py-2 font-bold ${!line.isSufficient ? 'text-red-600' : line.willBeLow ? 'text-amber-600' : 'text-green-600'
                                                    }`}>
                                                    {line.isSufficient
                                                        ? `${(line.available - line.required).toFixed(2)} ${line.unit}`
                                                        : `−${(line.required - line.available).toFixed(2)} ${line.unit}`}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    {!line.isSufficient ? (
                                                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                                                            <AlertCircle className="h-3 w-3" />Insufficient
                                                        </Badge>
                                                    ) : line.willBeLow ? (
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                                                            <TriangleAlert className="h-3 w-3" />Will Run Low
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />OK
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* ── Cost / Revenue / Profit Preview ────────────────────────────── */}
                        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Financial Preview
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Ingredient Cost', value: fmt(recipeCost.ingredientCost), color: '' },
                                    { label: 'Total Prod. Cost', value: fmt(recipeCost.totalCost), color: 'text-rose-600 font-bold' },
                                    { label: 'Expected Revenue', value: fmt(estRevenue), color: 'text-green-600 font-bold' },
                                    {
                                        label: 'Expected Profit', value: fmt(estProfit),
                                        color: estProfit >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'
                                    },
                                ].map(card => (
                                    <div key={card.label} className="bg-background rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">{card.label}</p>
                                        <p className={`text-base mt-0.5 ${card.color}`}>{card.value}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Based on {batchQty} batch{batchQty !== 1 ? 'es' : ''} →
                                <strong> {selectedRecipe.yieldQty * batchQty} {selectedRecipe.yieldUnit}</strong>
                                &nbsp;at ${selectedRecipe.sellingPrice}/unit
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 flex-wrap">
                        <Button variant="outline" onClick={handleCloseCreate}>Cancel</Button>
                        <Button
                            onClick={handleSimulate}
                            disabled={hasInsufficientStock || simulating}
                            className={hasInsufficientStock ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {simulating ? (
                                <>
                                    <div className="h-4 w-4 mr-2 border-2 border-background border-t-transparent rounded-full animate-spin" />
                                    Simulating…
                                </>
                            ) : (
                                <>
                                    <FlaskConical className="h-4 w-4 mr-2" />
                                    Simulate Production
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── View Order Detail Modal ───────────────────────────────────────────── */}
            <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                {viewOrder && (() => {
                    const recipe = DUMMY_RECIPES.find(r => r.id === viewOrder.recipeId);
                    const units = recipe ? recipe.yieldQty * viewOrder.batchQty : viewOrder.batchQty;
                    const cost = recipe ? computeFullCost(recipe, viewOrder.batchQty).totalCost : viewOrder.totalIngredientCost;
                    const revenue = recipe ? recipe.sellingPrice * recipe.yieldQty * viewOrder.batchQty : 0;
                    const cfg = STATUS_CFG[viewOrder.status];
                    return (
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                                <DialogDescription>{viewOrder.id}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-2 text-sm">
                                {[
                                    ['Recipe', viewOrder.recipeName],
                                    ['Batches', viewOrder.batchQty],
                                    ['Units Produced', `${units} ${recipe?.yieldUnit ?? 'units'}`],
                                    ['Assigned Staff', viewOrder.assignedStaff],
                                    ['Scheduled', new Date(viewOrder.scheduledDate).toLocaleString()],
                                    ['Status', <Badge key="s" variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.badge}`}>{cfg.icon}{cfg.label}</Badge>],
                                    ['Total Cost', <span key="c" className="font-bold text-rose-600">{fmt(cost)}</span>],
                                    ['Est. Revenue', <span key="r" className="font-bold text-green-600">{fmt(revenue)}</span>],
                                    ['Est. Profit', <span key="p" className={`font-bold ${revenue - cost >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(revenue - cost)}</span>],
                                    ...(viewOrder.notes ? [['Notes', viewOrder.notes]] : []),
                                ].map(([k, v]) => (
                                    <div key={String(k)} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-medium text-right">{v}</span>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    );
                })()}
            </Dialog>

            {/* ── Delete ───────────────────────────────────────────────────────────── */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove production order?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <Trash2 className="h-4 w-4 mr-2" />Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
