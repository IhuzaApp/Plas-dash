import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Truck, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { PurchaseOrder } from '@/lib/data/dummy-procurement';

interface OrderDetailsSummaryProps {
    order: PurchaseOrder;
    deliveryProgress: { value: number; label: string };
}

export function OrderDetailsSummary({ order, deliveryProgress }: OrderDetailsSummaryProps) {
    return (
        <Card>
            <CardHeader className="bg-muted/50 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                        <CardTitle className="text-2xl mt-1">{order.poNumber}</CardTitle>
                    </div>
                    <Badge variant={
                        order.status === 'Delivered' ? 'default' :
                            order.status === 'Shipped' ? 'secondary' :
                                order.status === 'Approved' ? 'outline' :
                                    order.status === 'Cancelled' ? 'destructive' :
                                        'secondary'
                    } className={order.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200' : 'text-sm px-3 py-1'}>
                        {order.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="grid grid-cols-2 flex-1">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span className="font-medium">{format(new Date(order.dateCreated), 'PPP')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <div className="grid grid-cols-2 flex-1">
                        <span className="text-muted-foreground">Expected:</span>
                        <span className="font-medium">{format(new Date(order.expectedDeliveryDate), 'PPP')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="grid grid-cols-2 flex-1">
                        <span className="text-muted-foreground">Delivery Status:</span>
                        <Badge variant={
                            order.deliveryStatus === 'Received' ? 'default' :
                                order.deliveryStatus === 'Partial' ? 'secondary' :
                                    'outline'
                        } className={order.deliveryStatus === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 w-fit' : 'w-fit'}>
                            {order.deliveryStatus}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${order.deliveryStatus === 'Received' ? 'bg-emerald-500' : 'bg-primary'}`}
                            style={{ width: `${deliveryProgress.value}%` }}
                        />
                    </div>
                    <span className="text-xs text-right text-muted-foreground mt-1">
                        {deliveryProgress.label}
                    </span>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div className="grid grid-cols-2 flex-1">
                        <span className="text-muted-foreground">Payment:</span>
                        <Badge variant={
                            order.paymentStatus === 'Paid' ? 'default' :
                                order.paymentStatus === 'Partial' ? 'secondary' :
                                    'outline'
                        } className={order.paymentStatus === 'Unpaid' ? 'text-rose-600 border-rose-200 bg-rose-50 w-fit' : 'w-fit'}>
                            {order.paymentStatus}
                        </Badge>
                    </div>
                </div>
                {order.paymentTerms && (
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-4" /> {/* Spacer */}
                        <div className="grid grid-cols-2 flex-1">
                            <span className="text-muted-foreground">Terms:</span>
                            <span className="font-medium">{order.paymentTerms}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
