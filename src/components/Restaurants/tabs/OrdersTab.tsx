'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface OrdersTabProps {
    orders: any[];
}

const OrdersTab: React.FC<OrdersTabProps> = ({ orders }) => {
    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy HH:mm');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" /> Restaurant Orders
                    </CardTitle>
                    <CardDescription>Total orders: {orders?.length || 0}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Delivered At</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders?.length > 0 ? (
                                orders.map((order: any) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.OrderID || order.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            <div className="flex -space-x-2 overflow-hidden py-1">
                                                {order.restaurant_order_items?.map((item: any) => (
                                                    <div key={item.id} className="inline-block" title={item.restaurant_dishes?.dishes?.name}>
                                                        <div className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-muted">
                                                            <img
                                                                src={item.restaurant_dishes?.dishes?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&h=100&auto=format&fit=crop'}
                                                                alt={item.restaurant_dishes?.dishes?.name || 'Dish'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {order.restaurant_order_items?.length > 0 && (
                                                    <span className="ml-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                                        {order.restaurant_order_items[0].restaurant_dishes?.dishes?.name}
                                                        {order.restaurant_order_items.length > 1 && ` +${order.restaurant_order_items.length - 1}`}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{order.total}</TableCell>
                                        <TableCell className="text-xs">{formatDateTime(order.created_at)}</TableCell>
                                        <TableCell className="text-xs">
                                            {order.status === 'delivered' ? formatDateTime(order.updated_at) : '-'}
                                        </TableCell>
                                        <TableCell className="max-w-[150px]">
                                            <div className="text-xs truncate text-muted-foreground" title={order.delivery_notes}>
                                                {order.delivery_notes || '-'}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No orders found for this restaurant.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrdersTab;
