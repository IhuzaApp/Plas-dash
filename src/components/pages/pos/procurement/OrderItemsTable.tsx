import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { PurchaseOrder } from '@/lib/data/dummy-procurement';

interface OrderItemsTableProps {
    order: PurchaseOrder;
    currency: string;
    getProductName: (productId: string) => string;
}

export function OrderItemsTable({ order, currency, getProductName }: OrderItemsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Products Ordered</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium">
                                    {getProductName(item.productId)}
                                </TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{currency}{item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {currency}{(item.quantity * item.unitPrice).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="p-6 bg-muted/10 border-t flex justify-end">
                    <div className="w-full sm:w-1/2 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>
                                {currency}
                                {order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                            </span>
                        </div>
                        {order.discount !== undefined && order.discount > 0 && (
                            <div className="flex justify-between text-sm text-rose-600">
                                <span>Discount</span>
                                <span>-{currency}{order.discount.toFixed(2)}</span>
                            </div>
                        )}
                        {order.taxPercentage !== undefined && order.taxPercentage > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({order.taxPercentage}%)</span>
                                <span>
                                    {currency}
                                    {(
                                        (order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) - (order.discount || 0)) *
                                        (order.taxPercentage / 100)
                                    ).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-primary">{currency}{order.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
