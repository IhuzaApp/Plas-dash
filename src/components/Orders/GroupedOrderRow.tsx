import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, AlertCircle, ShoppingBag, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

interface GroupedOrderRowProps {
  item: any;
  getOrderWarnings: (order: any) => any[];
  getStatusColor: (order: any) => string;
  generateShortId: (id: string) => string;
  formatCurrency: (amount: string) => string;
  getDeliveryCountdown: (time: string | null | undefined) => {
    text: string;
    exact: string | null;
    isOverdue: boolean;
  };
  handleCallShopper: (phone: string) => void;
  handleViewDetails: (order: any) => void;
  visibleColumns: Record<string, boolean>;
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
  visibleColumns,
}) => {
  const [copiedCombined, setCopiedCombined] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, isCombined: boolean = false) => {
    navigator.clipboard.writeText(id);
    if (isCombined) {
      setCopiedCombined(true);
      setTimeout(() => setCopiedCombined(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const activeColumnsCount = Object.values(visibleColumns).filter(Boolean).length + 1; // +1 for Actions

  return (
    <React.Fragment>
      <TableRow className="bg-muted/40 border-t-2 border-t-primary/30 active:bg-muted/40 hover:bg-muted/40">
        <TableCell colSpan={activeColumnsCount} className="py-3 px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 group">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">
                    Combined Group
                  </span>
                  <span className="font-mono font-bold text-sm text-primary leading-none">
                    #{item.combinedId?.split('-')[0]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(item.combinedId, true)}
                >
                  {copiedCombined ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-primary" />
                  )}
                </Button>
              </div>
              <div className="h-8 w-px bg-border mx-2 hidden sm:block" />
              {item.shopper ? (
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-full hidden sm:block">
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
                  <span className="text-xs sm:text-sm text-muted-foreground italic">
                    No shopper assigned
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
              <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  Group Total
                </span>
                <span className="font-bold text-sm">
                  {formatCurrency(
                    item.orders
                      .reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0)
                      .toString()
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
          <TableRow
            key={order.id}
            className="border-l-4 border-l-primary/40 bg-primary/[0.02] hover:bg-primary/[0.04]"
          >
            {visibleColumns.id && (
              <TableCell className="font-medium pl-6">
                <div className="flex items-center gap-2 group">
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(order.OrderID || order.id)}
                  >
                    {copiedId === (order.OrderID || order.id) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>

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
                </div>
              </TableCell>
            )}

            {visibleColumns.customer && (
              <TableCell>
                <div className="flex flex-col max-w-[100px] sm:max-w-none">
                  <span className="font-medium leading-tight truncate">
                    {order.User?.name ?? order.orderedBy?.name ?? 'Guest'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {order.User?.email ?? order.orderedBy?.email ?? order.user_id}
                  </span>
                </div>
              </TableCell>
            )}

            {visibleColumns.status && (
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(
                    order
                  )}`}
                >
                  {order.status}
                </span>
              </TableCell>
            )}

            {visibleColumns.items && (
              <TableCell className="text-xs">
                {order.type === 'reel'
                  ? order.Reel?.title || 'Reel Order'
                  : order.type === 'business'
                    ? `${order.allProducts?.length || 0} items`
                    : order.type === 'restaurant'
                      ? `${order.restaurant_order_items?.length || 0} dishes`
                      : `${order.itemsCount ?? order.Order_Items?.length ?? 0} items`}
              </TableCell>
            )}

            {visibleColumns.total && (
              <TableCell className="text-sm font-medium">{formatCurrency(order.total)}</TableCell>
            )}

            {visibleColumns.combined_id && (
              <TableCell className="text-xs text-muted-foreground">—</TableCell>
            )}

            {visibleColumns.delivery_fee && (
              <TableCell className="text-xs">{formatCurrency(order.delivery_fee ?? '0')}</TableCell>
            )}

            {visibleColumns.service_fee && (
              <TableCell className="text-xs">{formatCurrency(order.service_fee ?? '0')}</TableCell>
            )}

            {visibleColumns.expected_delivery && (
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
            )}

            {visibleColumns.created && (
              <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                {format(new Date(order.created_at), 'HH:mm')}
              </TableCell>
            )}

            {visibleColumns.updated && (
              <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                {format(new Date(order.updated_at), 'HH:mm')}
              </TableCell>
            )}

            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => handleViewDetails(order)}
              >
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
