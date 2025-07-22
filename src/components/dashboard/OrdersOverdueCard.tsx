import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOrders } from '@/hooks/useHasuraApi';
import { Loader2, Maximize2, X } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const OrdersOverdueCard: React.FC = () => {
  const { data, isLoading } = useOrders();
  const now = Date.now();
  const [open, setOpen] = useState(false);

  const overdueOrders = (data?.Orders || []).filter(order => {
    if (order.shopper_id) return false;
    const created = new Date(order.created_at).getTime();
    return now - created > FIFTEEN_MINUTES;
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle>Orders Over 15min (Unassigned)</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Expand">
            <Maximize2 className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : overdueOrders.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No overdue unassigned orders
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-bold text-lg mb-2">{overdueOrders.length} order(s)</div>
              <ul className="space-y-1">
                {overdueOrders.slice(0, 5).map(order => (
                  <li key={order.id} className="flex justify-between text-sm border-b pb-1 last:border-b-0">
                    <span>#{order.OrderID}</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}</span>
                  </li>
                ))}
              </ul>
              {overdueOrders.length > 5 && (
                <Button variant="link" size="sm" onClick={() => setOpen(true)} className="px-0">
                  View all
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-8">
          <DialogHeader className="flex flex-row items-center justify-between mb-4">
            <DialogTitle className="text-2xl">All Overdue Unassigned Orders</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Close">
              <X className="w-6 h-6" />
            </Button>
          </DialogHeader>
          <div className="space-y-4 h-full flex flex-col">
            <div className="font-bold text-xl mb-2">{overdueOrders.length} order(s)</div>
            <ul className="space-y-2 flex-1 overflow-y-auto pr-2 border rounded bg-muted/50 p-4 max-h-[55vh]">
              {overdueOrders.map(order => (
                <li key={order.id} className="flex justify-between text-base border-b pb-2 last:border-b-0">
                  <span className="font-mono">#{order.OrderID}</span>
                  <span className="text-muted-foreground">{formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <div className="font-semibold mb-2 text-lg">Settings (coming soon):</div>
              <div className="text-muted-foreground text-base">Here you can add actions or settings for overdue orders.</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersOverdueCard; 