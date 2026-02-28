'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    FileText,
    ClipboardList,
    Truck,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {
    DUMMY_SUPPLIERS,
    DUMMY_QUOTATIONS,
    DUMMY_PURCHASE_ORDERS
} from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export default function ProcurementDashboard() {
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || '$';

    // Aggregate KPIs
    const activeSuppliers = DUMMY_SUPPLIERS.filter(s => s.status === 'Active').length;

    const pendingPOs = DUMMY_PURCHASE_ORDERS.filter(po =>
        po.status === 'Pending' || po.status === 'Approved'
    ).length;

    const recentQuotations = DUMMY_QUOTATIONS.filter(q =>
        q.status === 'Received' || q.status === 'Draft'
    ).length;

    const expectedDeliveries = DUMMY_PURCHASE_ORDERS.filter(po =>
        po.status === 'Shipped' || po.status === 'Approved'
    ).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Procurement Dashboard</h2>
                <p className="text-muted-foreground mt-2">
                    Overview of suppliers, purchase orders, and inventory receiving.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Active Suppliers</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {activeSuppliers}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Out of {DUMMY_SUPPLIERS.length} total registered
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-2 shrink-0">
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Pending POs</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {pendingPOs}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Requiring action or fulfillment
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ml-2 shrink-0">
                                <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Active Quotations</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {recentQuotations}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Drafts and recently received
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 ml-2 shrink-0">
                                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Expected Deliveries</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {expectedDeliveries}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Arriving in the next 7 days
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 ml-2 shrink-0">
                                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Purchase Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Recent Purchase Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {DUMMY_PURCHASE_ORDERS.slice(0, 5).map((po) => {
                                const supplier = DUMMY_SUPPLIERS.find(s => s.id === po.supplierId);
                                return (
                                    <div key={po.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{po.poNumber}</p>
                                            <p className="text-sm text-muted-foreground">{supplier?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{currency}{po.totalAmount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{po.expectedDeliveryDate}</p>
                                            </div>
                                            <Badge variant={
                                                po.status === 'Delivered' ? 'default' :
                                                    po.status === 'Shipped' ? 'secondary' :
                                                        po.status === 'Approved' ? 'outline' :
                                                            po.status === 'Cancelled' ? 'destructive' :
                                                                'secondary'
                                            }>
                                                {po.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Suppliers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Top Rated Suppliers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {DUMMY_SUPPLIERS
                                .filter(s => s.status === 'Active')
                                .sort((a, b) => b.rating - a.rating)
                                .slice(0, 5)
                                .map((supplier) => (
                                    <div key={supplier.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">{supplier.name}</p>
                                            <p className="text-sm text-muted-foreground">{supplier.category}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center text-amber-500">
                                                <span className="text-sm font-medium mr-1">{supplier.rating.toFixed(1)}</span>
                                                <span>★</span>
                                            </div>
                                            <Badge variant="outline" className="ml-2">
                                                {supplier.leadTimeDays}d lead
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
