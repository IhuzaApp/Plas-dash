'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DUMMY_PURCHASE_ORDERS, DUMMY_SUPPLIERS, DUMMY_PRODUCTS } from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { OrderDetailsSummary } from './OrderDetailsSummary';
import { SupplierDetailsCard } from './SupplierDetailsCard';
import { OrderItemsTable } from './OrderItemsTable';
import { OrderAnalyticsCharts } from './OrderAnalyticsCharts';

const MOCK_MONTHLY_SPENDING = [
    { name: 'Sep', amount: 4000 },
    { name: 'Oct', amount: 3000 },
    { name: 'Nov', amount: 2000 },
    { name: 'Dec', amount: 2780 },
    { name: 'Jan', amount: 1890 },
    { name: 'Feb', amount: 2390 },
];

export default function PurchaseOrderDetailPage({ id }: { id: string }) {
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || '$';

    const order = DUMMY_PURCHASE_ORDERS.find(po => po.id === id);

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-xl font-bold">Purchase Order Not Found</h2>
                <p className="text-muted-foreground mt-2">The requested PO could not be located.</p>
                <Link href="/pos/procurement">
                    <Button className="mt-6" variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Procurement
                    </Button>
                </Link>
            </div>
        );
    }

    const supplier = DUMMY_SUPPLIERS.find(s => s.id === order.supplierId);

    const getProductName = (productId: string) => {
        return DUMMY_PRODUCTS.find(p => p.id === productId)?.name || 'Unknown Product';
    };

    const pieChartData = order.items.map(item => ({
        name: getProductName(item.productId),
        value: item.quantity * item.unitPrice
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const getDeliveryProgressInfo = () => {
        switch (order.deliveryStatus) {
            case 'Received': return { value: 100, label: 'Fully Received' };
            case 'Partial': return { value: 50, label: 'Partially Received' };
            case 'Pending': default: return { value: 0, label: 'Pending Delivery' };
        }
    };
    const deliveryProgress = getDeliveryProgressInfo();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/pos/procurement/purchase-orders">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">Purchase Order Details</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                    <Button className="bg-primary text-white hover:bg-primary/90" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Send to Supplier
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <OrderDetailsSummary order={order} deliveryProgress={deliveryProgress} />
                    <SupplierDetailsCard supplier={supplier} />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <OrderItemsTable order={order} currency={currency} getProductName={getProductName} />
                    <OrderAnalyticsCharts
                        currency={currency}
                        pieChartData={pieChartData}
                        mockMonthlySpending={MOCK_MONTHLY_SPENDING}
                    />
                </div>
            </div>
        </div>
    );
}
