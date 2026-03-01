'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    Plus, Search, ClipboardList, CheckCircle2, Clock, Activity, AlertCircle, Trash2, Edit, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { DUMMY_PRODUCTION_ORDERS, DUMMY_RECIPES, ProductionOrder, ProductionStatus } from '@/lib/data/dummy-production';
import { usePrivilege } from '@/hooks/usePrivilege';

const STATUS_STYLES: Record<ProductionStatus, { badge: string; icon: React.ReactNode }> = {
    Completed: { badge: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
    'In Progress': { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="h-4 w-4 text-amber-600" /> },
    Draft: { badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Activity className="h-4 w-4 text-slate-500" /> },
    Cancelled: { badge: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
};

const STAFF_LIST = ['Alice Uwimana', 'Jean-Pierre Habimana', 'Marie Mukamana', 'Eric Nshimiyimana', 'Claudine Ingabire'];

type DialogMode = 'view' | 'edit' | 'create';

interface OrderFormData {
    recipeId: string;
    batchQty: number;
    status: ProductionStatus;
    assignedStaff: string;
    scheduledDate: string;
    notes: string;
}

const defaultForm = (): OrderFormData => ({
    recipeId: '',
    batchQty: 1,
    status: 'Draft',
    assignedStaff: STAFF_LIST[0],
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
});

export default function ProductionOrders() {
    const [orders, setOrders] = useState<ProductionOrder[]>(DUMMY_PRODUCTION_ORDERS);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [dialogMode, setDialogMode] = useState<DialogMode>('create');
    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState<OrderFormData>(defaultForm());

    const { hasAction } = usePrivilege();
    const canManage = hasAction('inventory', 'manage_orders') ?? true;

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatCurrency = (n: number) => new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(n);

    const filtered = orders.filter(o => {
        const matchSearch = !search || o.recipeName.toLowerCase().includes(search.toLowerCase()) || o.assignedStaff.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const statusCounts = (['Draft', 'In Progress', 'Completed', 'Cancelled'] as ProductionStatus[]).map(s => ({
        status: s,
        count: orders.filter(o => o.status === s).length,
    }));

    const openDialog = (mode: DialogMode, order?: ProductionOrder) => {
        setDialogMode(mode);
        if (order) {
            setSelectedOrder(order);
            setFormData({
                recipeId: order.recipeId,
                batchQty: order.batchQty,
                status: order.status,
                assignedStaff: order.assignedStaff,
                scheduledDate: order.scheduledDate.slice(0, 16),
                notes: order.notes ?? '',
            });
        } else {
            setSelectedOrder(null);
            setFormData(defaultForm());
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.recipeId) { toast.error('Please select a recipe'); return; }
        if (formData.batchQty < 1) { toast.error('Batch quantity must be at least 1'); return; }

        const recipe = DUMMY_RECIPES.find(r => r.id === formData.recipeId);
        const now = new Date().toISOString();

        if (dialogMode === 'create') {
            const newOrder: ProductionOrder = {
                id: `po-${Date.now()}`,
                recipeId: formData.recipeId,
                recipeName: recipe?.name ?? 'Unknown',
                batchQty: formData.batchQty,
                status: formData.status,
                assignedStaff: formData.assignedStaff,
                scheduledDate: formData.scheduledDate,
                notes: formData.notes || undefined,
                totalIngredientCost: 0,
                createdAt: now,
            };
            setOrders(prev => [newOrder, ...prev]);
            toast.success('Production order created');
        } else {
            setOrders(prev => prev.map(o =>
                o.id === selectedOrder?.id
                    ? { ...o, ...formData, recipeName: recipe?.name ?? o.recipeName }
                    : o
            ));
            toast.success('Production order updated');
        }
        setIsDialogOpen(false);
    };

    const handleDelete = () => {
        if (!deleteId) return;
        setOrders(prev => prev.filter(o => o.id !== deleteId));
        setDeleteId(null);
        toast.success('Order deleted');
    };

    const quickStatusChange = (orderId: string, newStatus: ProductionStatus) => {
        setOrders(prev => prev.map(o => {
            if (o.id !== orderId) return o;
            return { ...o, status: newStatus, ...(newStatus === 'Completed' ? { completedDate: new Date().toISOString() } : {}) };
        }));
        toast.success(`Order marked as ${newStatus}`);
    };

    const isReadOnly = dialogMode === 'view';

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Production Orders</h2>
                        <p className="text-muted-foreground mt-1">Manage and track production runs for each recipe batch.</p>
                    </div>
                    {canManage && (
                        <Button onClick={() => openDialog('create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Order
                        </Button>
                    )}
                </div>

                {/* Status Quick-filters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {statusCounts.map(({ status, count }) => {
                        const cfg = STATUS_STYLES[status];
                        return (
                            <Card
                                key={status}
                                className={`py-3 cursor-pointer transition-all hover:shadow-md ${filterStatus === status ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => setFilterStatus(prev => prev === status ? 'all' : status)}
                            >
                                <CardContent className="py-0 px-4 flex items-center gap-3">
                                    {cfg.icon}
                                    <div>
                                        <p className="text-xs text-muted-foreground">{status}</p>
                                        <p className="text-xl font-bold">{count}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Search & Filter bar */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by recipe or staff..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {(['Draft', 'In Progress', 'Completed', 'Cancelled'] as ProductionStatus[]).map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Orders ({filtered.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="border-t">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Recipe</TableHead>
                                        <TableHead className="text-right">Batches</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned Staff</TableHead>
                                        <TableHead>Scheduled</TableHead>
                                        <TableHead className="text-right">Ingredient Cost</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length > 0 ? filtered.map(order => {
                                        const cfg = STATUS_STYLES[order.status];
                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                                                <TableCell className="font-medium">{order.recipeName}</TableCell>
                                                <TableCell className="text-right">{order.batchQty}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{order.assignedStaff}</TableCell>
                                                <TableCell className="text-sm">{formatDate(order.scheduledDate)}</TableCell>
                                                <TableCell className="text-right text-sm">{formatCurrency(order.totalIngredientCost)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openDialog('view', order)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {canManage && order.status !== 'Completed' && order.status !== 'Cancelled' && (
                                                            <>
                                                                <Button variant="ghost" size="icon" onClick={() => openDialog('edit', order)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                {order.status === 'Draft' && (
                                                                    <Button variant="ghost" size="icon" className="text-amber-600" title="Start Production"
                                                                        onClick={() => quickStatusChange(order.id, 'In Progress')}>
                                                                        <Clock className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {order.status === 'In Progress' && (
                                                                    <Button variant="ghost" size="icon" className="text-green-600" title="Mark Completed"
                                                                        onClick={() => quickStatusChange(order.id, 'Completed')}>
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="text-destructive"
                                                                    onClick={() => setDeleteId(order.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No production orders found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create / Edit / View Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'create' ? 'New Production Order' : dialogMode === 'edit' ? 'Edit Order' : 'Order Details'}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogMode === 'create' ? 'Create a new production run for a recipe.' : 'View or update production order details.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Recipe</Label>
                            <Select value={formData.recipeId} onValueChange={v => setFormData(p => ({ ...p, recipeId: v }))} disabled={isReadOnly}>
                                <SelectTrigger><SelectValue placeholder="Select a recipe" /></SelectTrigger>
                                <SelectContent>
                                    {DUMMY_RECIPES.filter(r => r.isActive).map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Batch Quantity</Label>
                                <Input type="number" min={1} value={formData.batchQty}
                                    onChange={e => setFormData(p => ({ ...p, batchQty: Number(e.target.value) }))}
                                    disabled={isReadOnly} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as ProductionStatus }))} disabled={isReadOnly}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(['Draft', 'In Progress', 'Completed', 'Cancelled'] as ProductionStatus[]).map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Assigned Staff</Label>
                            <Select value={formData.assignedStaff} onValueChange={v => setFormData(p => ({ ...p, assignedStaff: v }))} disabled={isReadOnly}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STAFF_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Scheduled Date & Time</Label>
                            <Input type="datetime-local" value={formData.scheduledDate}
                                onChange={e => setFormData(p => ({ ...p, scheduledDate: e.target.value }))}
                                disabled={isReadOnly} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Textarea value={formData.notes} rows={3}
                                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                disabled={isReadOnly} placeholder="Any special instructions or notes..." />
                        </div>

                        {/* Recipe info preview */}
                        {formData.recipeId && (() => {
                            const r = DUMMY_RECIPES.find(rec => rec.id === formData.recipeId);
                            if (!r) return null;
                            return (
                                <div className="rounded-lg bg-muted/30 border p-3 text-sm space-y-1">
                                    <p className="font-medium">{r.name}</p>
                                    <p className="text-muted-foreground">
                                        Yield: {r.yieldQty * formData.batchQty} {r.yieldUnit} ({formData.batchQty} batch{formData.batchQty !== 1 ? 'es' : ''})
                                    </p>
                                </div>
                            );
                        })()}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {isReadOnly ? 'Close' : 'Cancel'}
                        </Button>
                        {!isReadOnly && (
                            <Button onClick={handleSave}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                {dialogMode === 'create' ? 'Create Order' : 'Save Changes'}
                            </Button>
                        )}
                        {dialogMode === 'view' && canManage && (
                            <Button onClick={() => setDialogMode('edit')}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete production order?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. The order will be permanently removed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
