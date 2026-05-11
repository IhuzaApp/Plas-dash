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
import {
  Search,
  Filter,
  Loader2,
  Phone,
  AlertCircle,
  Video,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  ClipboardList,
  LayoutGrid,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useOrders,
  useReelOrders,
  useBusinessOrders,
  useRestaurantOrders,
  useSystemConfig,
  useOrderOffers,
  usePackageDeliveries,
} from '@/hooks/useHasuraApi';
import PackageOrderRow from '@/components/Orders/PackageOrderRow';
import OrderOffersTable from '@/components/Orders/OrderOffersTable';
import ManualDispatchCenter from '@/components/Orders/ManualDispatchCenter';
import OrderOffersAnalytics from '@/components/Orders/OrderOffersAnalytics';
import SingleOrderRow from '@/components/Orders/SingleOrderRow';
import GroupedOrderRow from '@/components/Orders/GroupedOrderRow';
import CombinedOrdersTable from '@/components/Orders/CombinedOrdersTable';
import TransactionsTable from '@/components/Orders/TransactionsTable';
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
  type: 'regular' | 'reel' | 'business' | 'restaurant' | 'package';
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
  // Removed redundant Shoppers field in favor of shopper field above
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
  // Package delivery
  DeliveryCode?: string | null;
  deliveryMethod?: string | null;
  dropoffLocation?: string | null;
  pickupLocation?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  comment?: string | null;
  timeAndDate?: string | null;
  package_image?: string | null;
  package_pickup_image?: string | null;
  order_transactions?: any[];
}

const Orders = () => {
  const { data, isLoading, isError, error } = useOrders();
  const { data: reelOrders } = useReelOrders();
  const { data: businessOrdersData } = useBusinessOrders();
  const { data: restaurantOrdersData } = useRestaurantOrders();
  const { data: systemConfig } = useSystemConfig();
  const { data: offersData, isLoading: isOffersLoading } = useOrderOffers();
  const { data: packageData, isLoading: isPackagesLoading } = usePackageDeliveries();
  const orders = data?.Orders || [];
  const reelOrderItems: any[] = reelOrders?.reel_orders || [];
  const businessOrderItems: any[] = businessOrdersData?.orders || [];
  const restaurantOrderItems: any[] = restaurantOrdersData?.orders || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'delayed' | 'delivered' | 'pending' | 'shopping' | 'on_the_way'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [tick, setTick] = useState(0);
  const { hasAction, session } = usePrivilege();
  const isProjectUser = session?.isProjectUser;

  // Refresh countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Combine regular, reel, business, and restaurant orders into a unified array
  const allOrders: UnifiedOrder[] = useMemo(() => {
    const regularOrders: UnifiedOrder[] = orders.map(order => ({
      ...order,
      type: 'regular' as const,
      OrderID: order.OrderID || order.id,
      Wallet_Transactions: order.Wallet_Transactions || [],
      order_transactions: order.order_transactions || [],
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
      shopper: reelOrder.shopper,
      Address: reelOrder.Address,
      User: reelOrder.User,
      Shop: reelOrder.Shop,
      Wallet_Transactions: reelOrder.Wallet_Transactions || [],
      order_transactions: reelOrder.order_transactions || [],
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
      businessTransactions: o.businessTransactions || [],
      order_transactions: o.order_transactions || [],
      shopper: o.shopper,
      delivery_time: o.delivery_time ?? o.delivered_time ?? null,
      delivery_fee: o.transportation_fee,
      service_fee: o.service_fee,
      combined_order_id: o.combined_order_id,
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
      Wallet_Transactions: o.Wallet_Transactions || [],
      order_transactions: o.order_transactions || [],
    }));

    const packageOrdersMapped: UnifiedOrder[] = (packageData?.packages || []).map((pkg: any) => ({
      ...pkg,
      OrderID: pkg.DeliveryCode || pkg.id,
      type: 'package' as const,
      total: pkg.delivery_fee || '0',
      shopper: pkg.shopper ? {
        id: pkg.shopper.id || pkg.shopper.user_id,
        name: pkg.shopper.full_name,
        phone: pkg.shopper.phone_number || pkg.shopper.phone,
        email: pkg.shopper.email
      } : undefined
    }));

    return [
      ...regularOrders,
      ...reelOrdersMapped,
      ...businessOrdersMapped,
      ...restaurantOrdersMapped,
      ...packageOrdersMapped,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, reelOrderItems, businessOrderItems, restaurantOrderItems, packageData]);

  const combinedOrdersGroups = useMemo(() => {
    const groups: Record<string, UnifiedOrder[]> = {};
    allOrders.forEach(order => {
      if (order.combined_order_id) {
        if (!groups[order.combined_order_id]) {
          groups[order.combined_order_id] = [];
        }
        groups[order.combined_order_id].push(order);
      }
    });

    // Filter out groups with only 1 order as per user request
    const filteredGroups: Record<string, UnifiedOrder[]> = {};
    Object.entries(groups).forEach(([id, groupOrders]) => {
      if (groupOrders.length > 1) {
        filteredGroups[id] = groupOrders;
      }
    });
    return filteredGroups;
  }, [allOrders]);

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
    if (deliveryTime == null || deliveryTime === '')
      return { text: '—', exact: null, isOverdue: false };
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
    if (
      order.Reel?.title?.toLowerCase().includes(searchLower) ||
      order.Reel?.description?.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Store/restaurant name
    if (
      order.business_store?.name?.toLowerCase().includes(searchLower) ||
      order.Restaurant?.name?.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Status match
    if (order.status.toLowerCase().includes(searchLower)) return true;

    return false;
  });

  // Create root display items (singles or groups)
  const rootDisplayItems = useMemo(() => {
    if (!isGroupedView) return filteredOrders.map(o => ({ type: 'single' as const, order: o }));

    const items: Array<
      | { type: 'single'; order: UnifiedOrder }
      | { type: 'group'; combinedId: string; orders: UnifiedOrder[]; shopper: any }
    > = [];
    const seenCombinedIds = new Set<string>();

    filteredOrders.forEach(o => {
      if (!o.combined_order_id) {
        items.push({ type: 'single', order: o });
      } else if (!seenCombinedIds.has(o.combined_order_id)) {
        // Find all orders in this group from ALL orders to ensure group completeness
        const group = allOrders.filter(item => item.combined_order_id === o.combined_order_id);

        if (group.length > 1) {
          items.push({
            type: 'group',
            combinedId: o.combined_order_id,
            orders: group,
            shopper: group.find(item => item.shopper)?.shopper,
          });
        } else {
          // If only 1 order has this ID, treat as single order
          items.push({ type: 'single', order: o });
        }
        seenCombinedIds.add(o.combined_order_id);
      }
    });
    return items;
  }, [filteredOrders, allOrders, isGroupedView]);

  // Calculate pagination
  const totalItems = rootDisplayItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentDisplayItems = rootDisplayItems.slice(startIndex, endIndex);

  const currentOrders = useMemo(() => {
    // This is just to satisfy existing logic that might use currentOrders
    // In grouped view, this will be a flattened list of orders in the current items
    const orders: UnifiedOrder[] = [];
    currentDisplayItems.forEach(item => {
      if (item.type === 'single') {
        orders.push(item.order);
      } else {
        item.orders.forEach(o => orders.push(o));
      }
    });
    return orders;
  }, [currentDisplayItems]);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden group transition-all hover:shadow-md border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Orders</p>
                <h3 className="text-3xl font-bold">{allOrders.length}</h3>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Across all categories
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-primary/20" />
        </Card>

        <Card className="relative overflow-hidden group transition-all hover:shadow-md border-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Pending Dispatch</p>
                <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{pendingOrders.length}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 italic">
                Awaiting shopper assignment
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-500/20" />
        </Card>

        <Card className="relative overflow-hidden group transition-all hover:shadow-md border-indigo-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">In Progress</p>
                <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{inProgressOrders.length}</h3>
              </div>
              <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 italic">
                Actively being shopped or delivered
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-500/20" />
        </Card>

        <Card className="relative overflow-hidden group transition-all hover:shadow-md border-red-500/20 bg-red-50/10 dark:bg-red-950/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1 text-red-600 dark:text-red-400">Delayed Alerts</p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">{delayedOrders.length}</h3>
              </div>
              <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-red-500/70 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Action required immediately
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-red-500/40" />
        </Card>

        <Card className="relative overflow-hidden group transition-all hover:shadow-md border-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Delivered Today</p>
                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">{deliveredOrders.length}</h3>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 italic">
                Successfully completed orders
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-green-500/20" />
        </Card>

        <Card className="relative overflow-hidden group transition-all hover:shadow-md border-emerald-500/20 bg-emerald-50/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Sales</p>
                <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue.toString())}</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-emerald-600/70 font-semibold uppercase tracking-widest">
              Live Revenue
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/40" />
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            All Orders
          </TabsTrigger>
          {isProjectUser && (
            <>
              <TabsTrigger value="offers" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Order Offers & Analytics
              </TabsTrigger>
              <TabsTrigger value="combined" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Combined Orders
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Packages
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Transactions
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTable orders={allOrders} formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
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
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <span className="text-sm font-medium text-muted-foreground shrink-0">Filter:</span>
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

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={isGroupedView ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsGroupedView(!isGroupedView)}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                {isGroupedView ? 'Grouped by Combined ID' : 'Individual View'}
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden lg:table-cell">Combined ID</TableHead>
                  <TableHead className="hidden xl:table-cell">Delivery Fee</TableHead>
                  <TableHead className="hidden xl:table-cell">Service Fee</TableHead>
                  <TableHead className="hidden sm:table-cell">Expected delivery</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDisplayItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDisplayItems.map(item => {
                    if (item.type === 'single') {
                      return (
                        <SingleOrderRow
                          key={item.order.id}
                          order={item.order}
                          warnings={getOrderWarnings(item.order)}
                          getStatusColor={getStatusColor}
                          generateShortId={generateShortId}
                          formatCurrency={formatCurrency}
                          formatDateTime={formatDateTime}
                          getDeliveryCountdown={getDeliveryCountdown}
                          handleCallShopper={handleCallShopper}
                          handleViewDetails={handleViewDetails}
                        />
                      );
                    } else {
                      return (
                        <GroupedOrderRow
                          key={item.combinedId}
                          item={item}
                          getOrderWarnings={getOrderWarnings}
                          getStatusColor={getStatusColor}
                          generateShortId={generateShortId}
                          formatCurrency={formatCurrency}
                          getDeliveryCountdown={getDeliveryCountdown}
                          handleCallShopper={handleCallShopper}
                          handleViewDetails={handleViewDetails}
                        />
                      );
                    }
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
        </TabsContent>

        {isProjectUser && (
          <>
            <TabsContent value="offers" className="space-y-6">
              <ManualDispatchCenter 
                allOrders={allOrders} 
                offers={offersData?.order_offers || []}
              />
              
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-64 grid-cols-2 mb-4">
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-4 pt-4">
                  <OrderOffersAnalytics offers={offersData?.order_offers || []} />
                </TabsContent>

                <TabsContent value="table" className="space-y-4 pt-4">
                  <OrderOffersTable
                    offers={offersData?.order_offers || []}
                    isLoading={isOffersLoading}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="combined" className="space-y-4">
              <CombinedOrdersTable
                combinedOrdersGroups={combinedOrdersGroups}
                getOrderWarnings={getOrderWarnings}
                getStatusColor={getStatusColor}
                generateShortId={generateShortId}
                formatCurrency={formatCurrency}
                getDeliveryCountdown={getDeliveryCountdown}
                handleCallShopper={handleCallShopper}
                handleViewDetails={handleViewDetails}
              />
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package ID</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Shopper</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPackagesLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : !packageData?.packages || packageData.packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          No package deliveries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      packageData.packages.map((pkg: any) => (
                        <PackageOrderRow
                          key={pkg.id}
                          pkg={pkg}
                          onViewDetails={() => {
                            const unifiedPkg: UnifiedOrder = {
                              ...pkg,
                              OrderID: pkg.DeliveryCode || pkg.id,
                              type: 'package',
                              total: pkg.delivery_fee || '0',
                              shopper: pkg.shopper ? {
                                id: pkg.shopper.id || pkg.shopper.user_id,
                                name: pkg.shopper.full_name,
                                phone: pkg.shopper.phone_number || pkg.shopper.phone,
                                email: pkg.shopper.email
                              } : undefined
                            };
                            handleViewDetails(unifiedPkg);
                          }}
                          formatCurrency={formatCurrency}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      <OrderDetailsDrawer order={selectedOrder} open={isDrawerOpen} onClose={handleCloseDrawer} />
    </AdminLayout>
  );
};

export default Orders;
