import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Loader2, Phone, AlertCircle, Video, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useOrders, useReelOrders, useBusinessOrders, useRestaurantOrders, useSystemConfig } from '@/hooks/useHasuraApi';
import { format, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import OrderDetailsDrawer from '@/components/drawers/OrderDetailsDrawer';
import { usePrivilege } from '@/hooks/usePrivilege';
import { Badge } from '@/components/ui/badge';

// Function to generate a short ID from a UUID or longer ID
const generateShortId = (id: string) => {
  // If it's a UUID, take the first 8 characters
  if (id.includes('-')) {
    return id.split('-')[0];
  }
  // If it's a number, ensure it's at least 4 digits with leading zeros
  const numId = parseInt(id);
  if (!isNaN(numId)) {
    return numId.toString().padStart(4, '0');
  }
  // For any other format, take first 8 characters
  return id.slice(0, 8);
};

// Unified order interface for regular, reel, business, and restaurant orders
interface UnifiedOrder {
  id: string;
  OrderID: string;
  type: 'regular' | 'reel' | 'business' | 'restaurant';
  status: string;
  total: string;
  created_at: string;
  updated_at: string;
  delivery_fee?: string;
  service_fee?: string;
  discount?: string;
  voucher_code?: string | null;
  shopper_id: string | null;
  user_id?: string;
  delivery_address_id?: string;
  delivery_photo_url?: string;
  delivery_time?: string | null;
  combined_order_id?: string | null;
  shop_id?: string;
  // Regular order
  delivery_notes?: string;
  Order_Items?: any[];
  User?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  Address?: {
    street: string;
    city: string;
    postal_code: string;
  };
  shopper?: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  };
  // Reel
  quantity?: number;
  reel_id?: string;
  delivery_note?: string;
  found?: boolean;
  Reel?: {
    Price: string;
    Product: string;
    category: string;
    title: string;
    description: string;
    video_url: string;
  };
  Shoppers?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  // Business order
  orderedBy?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profile_picture?: string | null;
    created_at?: string;
  };
  allProducts?: any[];
  units?: string;
  business_store?: {
    id: string;
    name: string;
    address?: string;
    image?: string | null;
    description?: string | null;
    [key: string]: any;
  } | null;
  businessTransactions?: Array<{
    id: string;
    action?: string | null;
    created_at: string;
    description?: string | null;
    related_order?: string | null;
    status: string;
    type: string;
    wallet_id: string;
  }>;
  // Regular order shop
  Shop?: { id: string; name: string; address?: string; image?: string | null } | null;
  // Restaurant order
  Restaurant?: {
    id: string;
    name: string;
    logo?: string | null;
    phone?: string | null;
    email?: string | null;
    location?: string | null;
    lat?: number | null;
    long?: number | null;
    is_active?: boolean | null;
    verified?: boolean | null;
    [key: string]: any;
  } | null;
  restaurant_order_items?: Array<{
    id: string;
    quantity: number;
    price: string;
    dish_id: string;
    created_at?: string;
    order_id?: string;
    restaurant_dishes?: {
      dishes?: { name?: string; image?: string; category?: string } | null;
      price?: string;
      [key: string]: any;
    } | null;
    [key: string]: any;
  }>;
  itemsCount?: number;
  unitsCount?: number;
  pin?: string | null;
  assigned_at?: string | null;
  Wallet_Transactions?: Array<{
    id: string;
    amount: string;
    created_at: string;
    description?: string | null;
    status: string;
    type: string;
    wallet_id: string;
    related_order_id?: string | null;
    related_reel_orderId?: string | null;
    related_restaurant_order_id?: string | null;
    relate_business_order_id?: string | null;
  }>;
}

const Orders = () => {
  const { data, isLoading, isError, error } = useOrders();
  const { data: reelOrders } = useReelOrders();
  const { data: businessOrdersData } = useBusinessOrders();
  const { data: restaurantOrdersData } = useRestaurantOrders();
  const { data: systemConfig } = useSystemConfig();
  const orders = data?.Orders || [];
  const reelOrderItems: any[] = reelOrders?.reel_orders || [];
  const businessOrderItems: any[] = businessOrdersData?.orders || [];
  const restaurantOrderItems: any[] = restaurantOrdersData?.orders || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delayed' | 'delivered' | 'pending' | 'shopping' | 'on_the_way'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const { hasAction } = usePrivilege();

  // Refresh countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Combine regular, reel, business, and restaurant orders into a unified array
  const allOrders: UnifiedOrder[] = useMemo(() => {
    const regularOrders: UnifiedOrder[] = orders.map(order => ({
      ...order,
      type: 'regular' as const,
      OrderID: order.OrderID || order.id,
    }));

    const reelOrdersMapped: UnifiedOrder[] = reelOrderItems.map((reelOrder: any) => ({
      id: reelOrder.id,
      OrderID: reelOrder.OrderID,
      type: 'reel' as const,
      status: reelOrder.status,
      total: reelOrder.total,
      created_at: reelOrder.created_at,
      updated_at: reelOrder.updated_at,
      delivery_fee: reelOrder.delivery_fee,
      service_fee: reelOrder.service_fee,
      discount: reelOrder.discount,
      voucher_code: reelOrder.voucher_code,
      shopper_id: reelOrder.shopper_id,
      user_id: reelOrder.user_id,
      delivery_address_id: reelOrder.delivery_address_id,
      delivery_photo_url: reelOrder.delivery_photo_url,
      delivery_time: reelOrder.delivery_time,
      combined_order_id: reelOrder.combined_order_id,
      shop_id: reelOrder.Reel?.shop_id || '',
      quantity: reelOrder.quantity,
      reel_id: reelOrder.reel_id,
      delivery_note: reelOrder.delivery_note,
      found: reelOrder.found,
      Reel: reelOrder.Reel,
      Shoppers: reelOrder.Shoppers,
      Address: reelOrder.Address,
      User: reelOrder.User,
      Shop: reelOrder.Shop,
    }));

    const businessOrdersMapped: UnifiedOrder[] = businessOrderItems.map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'business' as const,
      status: o.status ?? 'PENDING',
      total: o.total,
      created_at: o.created_at,
      updated_at: o.updated_at ?? o.created_at,
      shopper_id: o.shopper_id ?? null,
      user_id: o.ordered_by ?? '',
      orderedBy: o.orderedBy,
      allProducts: o.allProducts,
      units: o.units,
      business_store: o.business_store,
      businessTransactions: o.businessTransactions,
      shopper: o.shopper,
      delivery_time: o.delivery_time ?? o.delivered_time ?? null,
    }));

    const restaurantOrdersMapped: UnifiedOrder[] = restaurantOrderItems.map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'restaurant' as const,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
      updated_at: o.updated_at,
      shopper_id: o.shopper_id ?? null,
      user_id: o.user_id ?? '',
      delivery_fee: o.delivery_fee,
      delivery_time: o.delivery_time,
      delivery_notes: o.delivery_notes,
      discount: o.discount,
      voucher_code: o.voucher_code,
      orderedBy: o.orderedBy,
      Address: o.Address,
      Restaurant: o.Restaurant,
      restaurant_order_items: o.restaurant_order_items,
      itemsCount: o.itemsCount,
      unitsCount: o.unitsCount,
      shopper: o.shopper,
      pin: o.pin,
      found: o.found,
      delivery_address_id: o.delivery_address_id,
      combined_order_id: o.combined_order_id,
      assigned_at: o.assigned_at,
      delivery_photo_url: o.delivery_photo_url,
      Wallet_Transactions: o.Wallet_Transactions,
    }));

    return [...regularOrders, ...reelOrdersMapped, ...businessOrdersMapped, ...restaurantOrdersMapped].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, reelOrderItems, businessOrderItems, restaurantOrderItems]);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const handleCallShopper = (phone: string | undefined) => {
    if (!phone) {
      toast.error('Shopper phone number not available');
      return;
    }
    toast.info(`Calling shopper at ${phone}...`);
  };

  const getOrderWarnings = (order: UnifiedOrder) => {
    const warnings = [];
    const timeSinceUpdate = differenceInMinutes(new Date(), new Date(order.updated_at));
    const statusLower = order.status.toLowerCase();

    // Check for unassigned orders (10+ minutes)
    if (!order.shopper_id && timeSinceUpdate > 10) {
      warnings.push({
        type: 'unassigned',
        message: 'Order unassigned for over 10 minutes',
        severity: 'high',
      });
    }

    // Check for long shopping time (60+ minutes)
    if (statusLower === 'shopping' && timeSinceUpdate > 60) {
      warnings.push({
        type: 'shopping',
        message: 'Shopping taking over 60 minutes',
        severity: 'medium',
      });
    }

    // Check for long delivery time (50+ minutes)
    if (statusLower === 'on_the_way' && timeSinceUpdate > 50) {
      warnings.push({
        type: 'delivery',
        message: 'Delivery taking over 50 minutes',
        severity: 'high',
      });
    }

    return warnings;
  };

  const getStatusColor = (order: UnifiedOrder) => {
    const statusLower = order.status.toLowerCase();
    const warnings = getOrderWarnings(order);

    // If there are any high severity warnings, show red
    if (warnings.some(w => w.severity === 'high')) {
      return 'bg-red-100 text-red-800';
    }

    // If there are any medium severity warnings, show orange
    if (warnings.some(w => w.severity === 'medium')) {
      return 'bg-orange-100 text-orange-800';
    }

    // Default status colors
    switch (statusLower) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
      case 'accepted':
      case 'picked_up':
      case 'on_the_way':
      case 'shopping':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (dateString == null || dateString === '') return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'MMM d, yyyy HH:mm');
  };

  // Countdown to expected delivery (updates with tick every minute)
  const getDeliveryCountdown = (deliveryTime: string | null | undefined) => {
    if (deliveryTime == null || deliveryTime === '') return { text: '—', exact: null, isOverdue: false };
    const date = new Date(deliveryTime);
    if (Number.isNaN(date.getTime())) return { text: '—', exact: null, isOverdue: false };
    void tick; // use tick so this re-runs when countdown refreshes
    const now = new Date();
    if (date < now) {
      return {
        text: `${formatDistanceToNow(date, { addSuffix: true })}`,
        exact: format(date, 'MMM d, HH:mm'),
        isOverdue: true,
      };
    }
    return {
      text: `in ${formatDistanceToNow(date, { addSuffix: false })}`,
      exact: format(date, 'MMM d, HH:mm'),
      isOverdue: false,
    };
  };

  const pendingOrders = allOrders.filter(order => order.status.toUpperCase() === 'PENDING');
  const deliveredOrders = allOrders.filter(order => order.status.toLowerCase() === 'delivered');
  const inProgressOrders = allOrders.filter(order => {
    const statusLower = order.status.toLowerCase();
    return order.status.toUpperCase() !== 'PENDING' && statusLower !== 'delivered';
  });

  // Delayed = orders with warnings (unassigned 10+ min, shopping 60+ min, on_the_way 50+ min)
  const delayedOrders = allOrders.filter(order => getOrderWarnings(order).length > 0);
  const shoppingOrders = allOrders.filter(order => order.status.toLowerCase() === 'shopping');
  const onTheWayOrders = allOrders.filter(order => order.status.toLowerCase() === 'on_the_way');

  const totalRevenue = allOrders.reduce(
    (acc, order) => acc + (parseFloat(String(order.total)) || 0),
    0
  );

  // Apply status filter first, then search
  const statusFilteredOrders = allOrders.filter(order => {
    const statusLower = order.status.toLowerCase();
    switch (statusFilter) {
      case 'delayed':
        return getOrderWarnings(order).length > 0;
      case 'delivered':
        return statusLower === 'delivered';
      case 'pending':
        return order.status.toUpperCase() === 'PENDING';
      case 'shopping':
        return statusLower === 'shopping';
      case 'on_the_way':
        return statusLower === 'on_the_way';
      default:
        return true;
    }
  });

  // Filter by search term
  const filteredOrders = statusFilteredOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return true;

    // Direct ID match (case-insensitive)
    if (order.id?.toLowerCase() === searchLower) return true;
    if (order.OrderID?.toString().toLowerCase() === searchLower) return true;
    // Partial ID match
    if (order.id?.toLowerCase().includes(searchLower)) return true;
    if (order.OrderID?.toString().toLowerCase().includes(searchLower)) return true;

    // Customer name/email/phone
    const customerName = order.User?.name ?? order.orderedBy?.name ?? '';
    const customerEmail = order.User?.email ?? order.orderedBy?.email ?? '';
    const customerPhone = order.User?.phone ?? order.orderedBy?.phone ?? '';
    if (
      customerName?.toLowerCase().includes(searchLower) ||
      customerEmail?.toLowerCase().includes(searchLower) ||
      customerPhone?.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Reel title/description match
    if (order.Reel?.title?.toLowerCase().includes(searchLower) ||
        order.Reel?.description?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Store/restaurant name
    if (order.business_store?.name?.toLowerCase().includes(searchLower) ||
        order.Restaurant?.name?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Status match
    if (order.status.toLowerCase().includes(searchLower)) return true;

    return false;
  });

  // Calculate pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handleViewDetails = (order: UnifiedOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Error loading orders.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Orders"
        description="View and manage customer orders."
        actions={
          <div className="flex gap-2">
            {hasAction('orders', 'export_orders') && <Button variant="outline">Export</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{allOrders.length}</div>
            <p className="text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-muted-foreground">Pending Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inProgressOrders.length}</div>
            <p className="text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{delayedOrders.length}</div>
            <p className="text-muted-foreground">Delayed Orders</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{deliveredOrders.length}</div>
            <p className="text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</div>
            <p className="text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, UUID, customer name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">Filter:</span>
            {[
              { value: 'all' as const, label: 'All', count: undefined as number | undefined },
              { value: 'delayed' as const, label: 'Delayed', count: delayedOrders.length },
              { value: 'delivered' as const, label: 'Delivered', count: deliveredOrders.length },
              { value: 'pending' as const, label: 'Pending', count: pendingOrders.length },
              { value: 'shopping' as const, label: 'Shopping', count: shoppingOrders.length },
              { value: 'on_the_way' as const, label: 'On the way', count: onTheWayOrders.length },
            ].map(({ value, label, count }) => (
              <Button
                key={value}
                variant={statusFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                {label}
                {count != null && count > 0 && (
                  <Badge
                    variant={statusFilter === value ? 'secondary' : 'outline'}
                    className="ml-1.5 px-1.5 py-0 text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Expected delivery</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                currentOrders.map(order => {
                  const warnings = getOrderWarnings(order);
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
                                    {warnings.map((warning, idx) => (
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
                        <div className="font-medium">
                          {order.type === 'regular' || order.type === 'reel'
                            ? (order.User?.name ?? '—')
                            : (order.orderedBy?.name ?? '—')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.type === 'regular' || order.type === 'reel'
                            ? (order.User?.email ?? '—')
                            : (order.orderedBy?.email ?? '—')}
                        </div>
                        {(order.type === 'regular' ? order.User?.phone : order.orderedBy?.phone) && (
                          <div className="text-xs text-muted-foreground">
                            {order.type === 'regular' || order.type === 'reel'
                              ? order.User?.phone
                              : order.orderedBy?.phone}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {order.type === 'reel' && (
                            <Badge variant="outline" className="gap-0.5">
                              <Video className="h-3 w-3" />
                              Reel
                            </Badge>
                          )}
                          {order.type === 'business' && (
                            <Badge variant="outline" className="gap-0.5">
                              <ShoppingBag className="h-3 w-3" />
                              Business
                            </Badge>
                          )}
                          {order.type === 'restaurant' && (
                            <Badge variant="outline" className="gap-0.5">
                              <UtensilsCrossed className="h-3 w-3" />
                              Restaurant
                            </Badge>
                          )}
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
                        {order.type === 'regular' &&
                          `${order.Order_Items?.length ?? 0} item(s)`}
                        {order.type === 'reel' &&
                          `${order.quantity ?? 1} item(s)`}
                        {order.type === 'business' &&
                          (order.units
                            ? `${order.units} unit(s)`
                            : `${
                                Array.isArray(order.allProducts)
                                  ? order.allProducts.length
                                  : 0
                              } item(s)`)}
                        {order.type === 'restaurant' &&
                          `${order.itemsCount ?? order.restaurant_order_items?.length ?? 0} item(s)`}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        {(() => {
                          const { text, exact, isOverdue } = getDeliveryCountdown(order.delivery_time);
                          if (exact) {
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    <span className={isOverdue ? 'text-muted-foreground' : ''}>
                                      {text}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Expected: {exact}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                          return <span className="text-muted-foreground">{text}</span>;
                        })()}
                      </TableCell>
                      <TableCell>{formatDateTime(order.created_at)}</TableCell>
                      <TableCell>{formatDateTime(order.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {order.shopper_id &&
                          warnings.some(w => w.type === 'shopping' || w.type === 'delivery') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCallShopper(
                                order.type === 'regular' || order.type === 'business' || order.type === 'restaurant'
                                  ? order.shopper?.phone
                                  : order.Shoppers?.phone
                              )}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call Shopper
                            </Button>
                          )}
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
          />
        </Card>
      </div>

      <OrderDetailsDrawer order={selectedOrder} open={isDrawerOpen} onClose={handleCloseDrawer} />
    </AdminLayout>
  );
};

export default Orders;
