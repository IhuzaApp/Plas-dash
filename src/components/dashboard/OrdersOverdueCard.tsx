import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  useOrders,
  useReelOrders,
  useBusinessOrders,
  useRestaurantOrders,
} from '@/hooks/useHasuraApi';
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
import { Badge } from '@/components/ui/badge';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const MAX_ORDERS = 12;

type UnifiedOverdueOrder = {
  id: string;
  OrderID: string;
  type: 'regular' | 'reel' | 'restaurant' | 'business';
  created_at: string;
  status: string;
  shopper_id: string | null;
  addressLabel: string;
  shopLabel: string;
};

const OrdersOverdueCard: React.FC = () => {
  const { data: ordersData, isLoading: loadingOrders } = useOrders();
  const { data: reelData, isLoading: loadingReel } = useReelOrders();
  const { data: businessData, isLoading: loadingBusiness } = useBusinessOrders();
  const { data: restaurantData, isLoading: loadingRestaurant } = useRestaurantOrders();

  const now = Date.now();
  const [open, setOpen] = useState(false);

  const overdueOrders = useMemo(() => {
    const regular = (ordersData?.Orders || []).map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID || o.id,
      type: 'regular' as const,
      created_at: o.created_at,
      status: o.status,
      shopper_id: o.shopper_id ?? null,
      addressLabel: o.Address?.street || o.Address?.city || 'N/A',
      shopLabel: o.Shop?.name || o.shop?.name || 'N/A',
    }));
    const reel = (reelData?.reel_orders || []).map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'reel' as const,
      created_at: o.created_at,
      status: o.status,
      shopper_id: o.shopper_id ?? null,
      addressLabel: o.Address?.street || o.Address?.city || 'N/A',
      shopLabel: o.Shop?.name || o.Reel?.Shops?.name || 'Reel',
    }));
    const business = (businessData?.orders || []).map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'business' as const,
      created_at: o.created_at,
      status: o.status ?? 'PENDING',
      shopper_id: o.shopper_id ?? null,
      addressLabel: o.deliveryAddress?.street || o.deliveryAddress?.city || 'N/A',
      shopLabel: o.business_store?.name || 'Business',
    }));
    const restaurant = (restaurantData?.orders || []).map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'restaurant' as const,
      created_at: o.created_at,
      status: o.status,
      shopper_id: o.shopper_id ?? null,
      addressLabel: o.Address?.street || o.Address?.city || 'N/A',
      shopLabel: o.Restaurant?.name || 'Restaurant',
    }));

    const all: UnifiedOverdueOrder[] = [...regular, ...reel, ...business, ...restaurant].filter(
      order => {
        if (order.shopper_id) return false;
        const created = new Date(order.created_at).getTime();
        return now - created > FIFTEEN_MINUTES;
      }
    );

    const sorted = all.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return sorted.slice(0, MAX_ORDERS);
  }, [ordersData, reelData, businessData, restaurantData, now]);

  const loading = loadingOrders || loadingReel || loadingBusiness || loadingRestaurant;

  const typeBadge = (type: UnifiedOverdueOrder['type']) => {
    const map = {
      regular: { label: 'Regular', class: 'bg-blue-500/10 text-blue-600' },
      reel: { label: 'Reel', class: 'bg-purple-500/10 text-purple-600' },
      restaurant: { label: 'Restaurant', class: 'bg-orange-500/10 text-orange-600' },
      business: { label: 'Business', class: 'bg-green-500/10 text-green-600' },
    };
    const c = map[type];
    return (
      <Badge variant="secondary" className={c.class}>
        {c.label}
      </Badge>
    );
  };

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
              <div className="font-bold text-lg mb-2">
                {overdueOrders.length} order(s) (max {MAX_ORDERS})
              </div>
              <ul className="space-y-1">
                {overdueOrders.slice(0, 5).map(order => (
                  <li
                    key={`${order.type}-${order.id}`}
                    className="flex justify-between items-center text-sm border-b pb-1 last:border-b-0"
                  >
                    <span className="flex items-center gap-2">
                      #{order.OrderID}
                      {typeBadge(order.type)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
              {overdueOrders.length > 5 && (
                <Button variant="link" size="sm" onClick={() => setOpen(true)} className="px-0">
                  View all ({overdueOrders.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-8">
          <DialogHeader className="flex flex-row items-center justify-between mb-4">
            <DialogTitle className="text-2xl">
              All Overdue Unassigned Orders (max {MAX_ORDERS})
            </DialogTitle>
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
                    <TableHead className="w-1/12">Type</TableHead>
                    <TableHead className="w-2/12">Status</TableHead>
                    <TableHead className="w-2/12">Age</TableHead>
                    <TableHead className="w-3/12">Address</TableHead>
                    <TableHead className="w-2/12">Shop / Restaurant</TableHead>
                    <TableHead className="w-2/12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueOrders.map((order, idx) => (
                    <TableRow
                      key={`${order.type}-${order.id}`}
                      className={idx % 2 === 0 ? 'bg-white/70' : 'bg-muted'}
                    >
                      <TableCell className="font-mono font-semibold">#{order.OrderID}</TableCell>
                      <TableCell>{typeBadge(order.type)}</TableCell>
                      <TableCell>
                        <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(parseISO(order.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{order.addressLabel}</TableCell>
                      <TableCell>{order.shopLabel}</TableCell>
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
                Actions or settings for overdue orders.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersOverdueCard;
