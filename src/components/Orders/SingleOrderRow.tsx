import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, AlertCircle } from 'lucide-react';
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
}) => {
  return (
    <TableRow key={order.id}>
      <TableCell className="font-medium">
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
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">
            {order.User?.name ?? order.orderedBy?.name ?? 'Guest'}
          </span>
          <span className="text-xs text-muted-foreground">
            {order.User?.email ?? order.orderedBy?.email ?? order.user_id}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order)}`}
        >
          {order.status}
        </span>
      </TableCell>
      <TableCell>
        {order.type === 'reel'
          ? order.Reel?.title || 'Reel Order'
          : order.type === 'business'
            ? `${order.allProducts?.length || 0} product(s)`
            : order.type === 'restaurant'
              ? `${order.restaurant_order_items?.length || 0} dish(es)`
              : `${order.itemsCount ?? order.Order_Items?.length ?? 0} item(s)`}
      </TableCell>
      <TableCell>{formatCurrency(order.total)}</TableCell>
      <TableCell>
        {order.combined_order_id ? (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {generateShortId(order.combined_order_id)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{formatCurrency(order.delivery_fee ?? '0')}</TableCell>
      <TableCell>{formatCurrency(order.service_fee ?? '0')}</TableCell>
      <TableCell>
        {(() => {
          const { text, exact, isOverdue } = getDeliveryCountdown(order.delivery_time);
          if (exact) {
            return (
              <div className="flex flex-col">
                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-blue-600'}>
                  {text}
                </span>
                <span className="text-[10px] text-muted-foreground">{exact}</span>
              </div>
            );
          }
          return <span className="text-muted-foreground">{text}</span>;
        })()}
      </TableCell>
      <TableCell>{formatDateTime(order.created_at)}</TableCell>
      <TableCell>{formatDateTime(order.updated_at)}</TableCell>
      <TableCell className="text-right space-x-2">
        {order.shopper_id &&
          warnings.some((w: any) => w.type === 'shopping' || w.type === 'delivery') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleCallShopper(
                  order.type === 'regular' ||
                    order.type === 'business' ||
                    order.type === 'restaurant'
                    ? order.shopper?.phone
                    : order.Shoppers?.phone
                )
              }
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          )}
        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
          Details
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default SingleOrderRow;
