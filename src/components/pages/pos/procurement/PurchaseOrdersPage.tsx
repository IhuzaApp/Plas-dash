'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Search, Plus, Eye, MoreHorizontal, Calendar, Building2, Truck, CheckCircle2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { DUMMY_PURCHASE_ORDERS, DUMMY_SUPPLIERS } from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { CreatePoDialog } from './CreatePoDialog';
import Link from 'next/link';

export default function PurchaseOrdersPage() {
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || '$';

    const [searchQuery, setSearchQuery] = useState('');

    const getSupplierName = (supplierId: string) => {
        return DUMMY_SUPPLIERS.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
    };

    const filteredOrders = DUMMY_PURCHASE_ORDERS.filter(order =>
        order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSupplierName(order.supplierId).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
                    <p className="text-muted-foreground mt-2">
                        Manage your outgoing purchase orders and track deliveries.
                    </p>
                </div>
                <CreatePoDialog>
                    <Button className="sm:w-auto text-white bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Create PO
                    </Button>
                </CreatePoDialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Total POs</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {DUMMY_PURCHASE_ORDERS.length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-2 shrink-0">
                                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Pending Delivery</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {DUMMY_PURCHASE_ORDERS.filter(po => po.deliveryStatus === 'Pending' || po.deliveryStatus === 'Partial').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ml-2 shrink-0">
                                <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                <h3 className="text-2xl font-bold mt-1 truncate text-emerald-600 dark:text-emerald-500">
                                    {DUMMY_PURCHASE_ORDERS.filter(po => po.deliveryStatus === 'Received').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 ml-2 shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Overdue Deliveries</p>
                                <h3 className="text-2xl font-bold mt-1 truncate text-rose-600 dark:text-rose-500">
                                    {DUMMY_PURCHASE_ORDERS.filter(po =>
                                        new Date(po.expectedDeliveryDate) < new Date('2026-02-28') &&
                                        po.deliveryStatus !== 'Received' &&
                                        po.status !== 'Cancelled'
                                    ).length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 ml-2 shrink-0">
                                <Calendar className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="bg-muted/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search PO number or supplier..."
                                className="pl-9 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">PO Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Expected Delivery</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-center">Payment</TableHead>
                                    <TableHead className="text-center">Delivery</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                            No purchase orders found matching your selection.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-primary">
                                                {order.poNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">{getSupplierName(order.supplierId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground text-sm">
                                                    <Calendar className="mr-2 h-3.5 w-3.5" />
                                                    {format(new Date(order.dateCreated), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                                    <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {currency}{order.totalAmount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={
                                                    order.paymentStatus === 'Paid' ? 'default' :
                                                        order.paymentStatus === 'Partial' ? 'secondary' :
                                                            'outline'
                                                } className={order.paymentStatus === 'Unpaid' ? 'text-rose-600 border-rose-200 bg-rose-50' : ''}>
                                                    {order.paymentStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={
                                                    order.deliveryStatus === 'Received' ? 'default' :
                                                        order.deliveryStatus === 'Partial' ? 'secondary' :
                                                            'outline'
                                                } className={order.deliveryStatus === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200' : ''}>
                                                    {order.deliveryStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/pos/procurement/purchase-orders/${order.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                    {order.deliveryStatus !== 'Received' && order.status !== 'Cancelled' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                        >
                                                            Receive
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
