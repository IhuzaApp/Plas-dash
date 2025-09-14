import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOrders } from '@/hooks/useHasuraApi';
import { Loader2, Maximize2, X } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Set to true to use dummy data for development
const DUMMY_MODE = true;

const DUMMY_ORDERS = [
  {
    id: '1',
    OrderID: '1001',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    shopper_id: null,
    status: 'pending',
    address: '123 Main St',
    shop: 'SuperMart',
  },
  {
    id: '2',
    OrderID: '1002',
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    shopper_id: null,
    status: 'pending',
    address: '456 Oak Ave',
    shop: 'FreshFoods',
  },
  {
    id: '3',
    OrderID: '1003',
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    shopper_id: null,
    status: 'pending',
    address: '789 Pine Rd',
    shop: 'MegaMarket',
  },
  {
    id: '4',
    OrderID: '1004',
    created_at: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    shopper_id: null,
    status: 'pending',
    address: '321 Maple St',
    shop: 'QuickShop',
  },
  {
    id: '5',
    OrderID: '1005',
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    shopper_id: null,
    status: 'pending',
    address: '654 Elm St',
    shop: 'SuperMart',
  },
  {
    id: '6',
    OrderID: '1006',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    shopper_id: null,
    status: 'pending',
    address: '987 Cedar Ave',
    shop: 'FreshFoods',
  },
];

function isDummyOrder(order: any): order is { address: string; shop: string } {
  return DUMMY_MODE;
}

const OrdersOverdueCard: React.FC = () => {
  const { data, isLoading } = useOrders();
  const now = Date.now();
  const [open, setOpen] = useState(false);

  const overdueOrders = DUMMY_MODE
    ? DUMMY_ORDERS
    : (data?.Orders || []).filter(order => {
        if (order.shopper_id) return false;
        const created = new Date(order.created_at).getTime();
        return now - created > FIFTEEN_MINUTES;
      });
  const loading = DUMMY_MODE ? false : isLoading;

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
          {loading ? (
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
                  <li
                    key={order.id}
                    className="flex justify-between text-sm border-b pb-1 last:border-b-0"
                  >
                    <span>#{order.OrderID}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                    </span>
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
            <div className="flex-1 overflow-y-auto border rounded bg-muted/50 p-2 max-h-[55vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/12">Order ID</TableHead>
                    <TableHead className="w-2/12">Status</TableHead>
                    <TableHead className="w-2/12">Age</TableHead>
                    <TableHead className="w-3/12">Address</TableHead>
                    <TableHead className="w-2/12">Supermarket/Restaurant</TableHead>
                    <TableHead className="w-2/12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueOrders.map((order, idx) => (
                    <TableRow key={order.id} className={idx % 2 === 0 ? 'bg-white/70' : 'bg-muted'}>
                      <TableCell className="font-mono font-semibold">#{order.OrderID}</TableCell>
                      <TableCell>
                        {DUMMY_MODE ? (
                          <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            {order.status}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            {order.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {isDummyOrder(order) ? order.address : order.Address?.street || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {isDummyOrder(order) ? order.shop : (order as any).Shop?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" disabled>
                          Assign
                        </Button>
                        <Button size="sm" variant="default" disabled>
                          Combine
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6">
              <div className="font-semibold mb-2 text-lg">Settings (coming soon):</div>
              <div className="text-muted-foreground text-base">
                Here you can add actions or settings for overdue orders.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersOverdueCard;
