import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, AlertCircle, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

interface SingleOrderRowProps {
  order: any;
  warnings: any[];
  getStatusColor: (order: any) => string;
  generateShortId: (id: string) => string;
  formatCurrency: (amount: string) => string;
  formatDateTime: (date: string) => string;
  getDeliveryCountdown: (time: string | null | undefined) => {
    text: string;
    exact: string | null;
    isOverdue: boolean;
  };
  handleCallShopper: (phone: string) => void;
  handleViewDetails: (order: any) => void;
  visibleColumns: Record<string, boolean>;
}

const SingleOrderRow: React.FC<SingleOrderRowProps> = ({
  order,
  warnings,
  getStatusColor,
  generateShortId,
  formatCurrency,
  formatDateTime,
  getDeliveryCountdown,
  handleCallShopper,
  handleViewDetails,
  visibleColumns,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TableRow key={order.id}>
      {visibleColumns.id && (
        <TableCell className="font-medium">
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
              {copied ? (
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
          <div className="flex flex-col max-w-[120px] sm:max-w-none">
            <span className="font-medium truncate">
              {order.User?.name ?? order.orderedBy?.name ?? 'Guest'}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {order.User?.email ?? order.orderedBy?.email ?? order.user_id}
            </span>
          </div>
        </TableCell>
      )}

      {visibleColumns.status && (
        <TableCell>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order)}`}
          >
            {order.status}
          </span>
        </TableCell>
      )}

      {visibleColumns.items && (
        <TableCell>
          <span className="text-xs">
            {order.type === 'reel'
              ? order.Reel?.title || 'Reel Order'
              : order.type === 'business'
                ? `${order.allProducts?.length || 0} items`
                : order.type === 'restaurant'
                  ? `${order.restaurant_order_items?.length || 0} dishes`
                  : `${order.itemsCount ?? order.Order_Items?.length ?? 0} items`}
          </span>
        </TableCell>
      )}

      {visibleColumns.total && (
        <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
      )}

      {visibleColumns.combined_id && (
        <TableCell>
          {order.combined_order_id ? (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {generateShortId(order.combined_order_id)}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
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
            const { text, exact, isOverdue } = getDeliveryCountdown(order.delivery_time);
            if (exact) {
              return (
                <div className="flex flex-col">
                  <span className={isOverdue ? 'text-red-600 font-medium text-xs' : 'text-blue-600 text-xs'}>
                    {text}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{exact}</span>
                </div>
              );
            }
            return <span className="text-muted-foreground text-xs">{text}</span>;
          })()}
        </TableCell>
      )}

      {visibleColumns.created && (
        <TableCell className="text-xs whitespace-nowrap">{formatDateTime(order.created_at)}</TableCell>
      )}

      {visibleColumns.updated && (
        <TableCell className="text-xs whitespace-nowrap">{formatDateTime(order.updated_at)}</TableCell>
      )}
      <TableCell className="text-right space-x-2">
        <div className="flex justify-end gap-1">
          {order.shopper_id &&
            warnings.some((w: any) => w.type === 'shopping' || w.type === 'delivery') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCallShopper(order.shopper?.phone)}
                className="text-yellow-600 hover:text-yellow-700 h-8 px-2 sm:px-3"
              >
                <Phone className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Call</span>
              </Button>
            )}
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} className="h-8 px-2 sm:px-3">
            Details
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default SingleOrderRow;
