'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, Eye, Calendar, Building2, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DUMMY_PURCHASE_ORDERS, DUMMY_SUPPLIERS, PurchaseOrder } from '@/lib/data/dummy-procurement';

export default function GoodsReceivedPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const getSupplierName = (supplierId: string) => {
        return DUMMY_SUPPLIERS.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
    };

    // Only show Shipped or Delivered POs for receiving
    const receivableOrders = DUMMY_PURCHASE_ORDERS.filter(po =>
        po.status === 'Shipped' || po.status === 'Delivered'
    );

    const filteredOrders = receivableOrders.filter(order =>
        order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSupplierName(order.supplierId).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Goods Received (GRN)</h2>
                    <p className="text-muted-foreground mt-2">
                        Record and verify incoming shipments against purchase orders.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Awaiting Receipt</p>
                                <h3 className="text-2xl font-bold mt-1 truncate text-amber-600 dark:text-amber-500">
                                    {receivableOrders.filter(po => po.status === 'Shipped').length}
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
                                <p className="text-sm font-medium text-muted-foreground">Received Today</p>
                                <h3 className="text-2xl font-bold mt-1 truncate text-emerald-600 dark:text-emerald-500">
                                    2 {/* Dummy static value */}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 ml-2 shrink-0">
                                <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
                                <h3 className="text-2xl font-bold mt-1 truncate text-destructive">
                                    1 {/* Dummy static value */}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-destructive/10 ml-2 shrink-0">
                                <AlertCircle className="w-5 h-5 text-destructive" />
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
                        <div className="flex gap-2">
                            <Badge variant="outline" className="px-3 py-1 bg-background">
                                All Deliveries
                            </Badge>
                            <Badge variant="secondary" className="px-3 py-1 cursor-pointer">
                                Pending Receipt
                            </Badge>
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
                                    <TableHead>Expected Delivery</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No deliveries found matching your selection.
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
                                                    {format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{order.items.length} items to receive</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={
                                                    order.status === 'Delivered' ? 'default' : 'secondary'
                                                }>
                                                    {order.status === 'Shipped' ? 'In Transit' : 'Received'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {order.status === 'Shipped' ? (
                                                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                                        Receive Goods
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Note
                                                    </Button>
                                                )}
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
