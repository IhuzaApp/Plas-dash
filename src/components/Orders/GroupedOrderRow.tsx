import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, AlertCircle, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

interface GroupedOrderRowProps {
    item: any;
    getOrderWarnings: (order: any) => any[];
    getStatusColor: (order: any) => string;
    generateShortId: (id: string) => string;
    formatCurrency: (amount: string) => string;
    getDeliveryCountdown: (time: string | null | undefined) => { text: string; exact: string | null; isOverdue: boolean };
    handleCallShopper: (phone: string) => void;
    handleViewDetails: (order: any) => void;
}

const GroupedOrderRow: React.FC<GroupedOrderRowProps> = ({
    item,
    getOrderWarnings,
    getStatusColor,
    generateShortId,
    formatCurrency,
    getDeliveryCountdown,
    handleCallShopper,
    handleViewDetails,
}) => {
    return (
        <React.Fragment>
            <TableRow className="bg-muted/40 border-t-2 border-t-primary/30 active:bg-muted/40 hover:bg-muted/40">
                <TableCell colSpan={12} className="py-3 px-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">
                                    Combined Group
                                </span>
                                <span className="font-mono font-bold text-sm text-primary leading-none">
                                    #{item.combinedId?.split('-')[0]}
                                </span>
                            </div>
                            <div className="h-8 w-px bg-border mx-2" />
                            {item.shopper ? (
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-1.5 rounded-full">
                                        <ShoppingBag className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground leading-none mb-1 uppercase font-bold tracking-tight">
                                            Assigned Shopper
                                        </span>
                                        <span className="font-semibold text-sm leading-none">{item.shopper.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{item.shopper.phone}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-full ml-1"
                                        onClick={() => handleCallShopper(item.shopper.phone)}
                                    >
                                        <Phone className="h-3 w-3 text-primary" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm text-muted-foreground italic">No shopper assigned to group</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Group Total</span>
                                <span className="font-bold text-sm">
                                    {formatCurrency(
                                        item.orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0).toString()
                                    )}
                                </span>
                            </div>
                            <Badge variant="secondary" className="font-bold">
                                {item.orders.length} Orders
                            </Badge>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
            {item.orders.map((order: any) => {
                const warnings = getOrderWarnings(order);
                return (
                    <TableRow key={order.id} className="border-l-4 border-l-primary/40 bg-primary/[0.02] hover:bg-primary/[0.04]">
                        <TableCell className="font-medium pl-6">
                            <div className="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="text-primary hover:underline">
                                            #{generateShortId(order.OrderID?.toString() || order.id)}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Full ID: {order.OrderID || order.id}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {warnings.length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <ul className="list-disc pl-4">
                                                    {warnings.map((warning: any, idx: number) => (
                                                        <li key={idx}>{warning.message}</li>
                                                    ))}
                                                </ul>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                <Badge variant="outline" className="text-[10px] px-1 capitalize h-4">
                                    {order.type}
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium leading-tight">
                                    {order.User?.name ?? order.orderedBy?.name ?? 'Guest'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {order.User?.email ?? order.orderedBy?.email ?? order.user_id}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(
                                    order
                                )}`}
                            >
                                {order.status}
                            </span>
                        </TableCell>
                        <TableCell className="text-xs">
                            {order.type === 'reel'
                                ? order.Reel?.title || 'Reel Order'
                                : order.type === 'business'
                                    ? `${order.allProducts?.length || 0} product(s)`
                                    : order.type === 'restaurant'
                                        ? `${order.restaurant_order_items?.length || 0} dish(es)`
                                        : `${order.itemsCount ?? order.Order_Items?.length ?? 0} item(s)`}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">—</TableCell>
                        <TableCell className="text-xs">{formatCurrency(order.delivery_fee ?? '0')}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(order.service_fee ?? '0')}</TableCell>
                        <TableCell>
                            {(() => {
                                const { text, isOverdue } = getDeliveryCountdown(order.delivery_time);
                                return (
                                    <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                        {text}
                                    </span>
                                );
                            })()}
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(order.created_at), 'HH:mm')}
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(order.updated_at), 'HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleViewDetails(order)}>
                                Details
                            </Button>
                        </TableCell>
                    </TableRow>
                );
            })}
        </React.Fragment>
    );
};

export default GroupedOrderRow;
