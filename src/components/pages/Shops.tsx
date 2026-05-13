import React, { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  User,
  Calendar,
  DollarSign,
  Plus,
  PowerOff,
  Eye,
  Edit,
  Store,
  CreditCard,
  Tag,
} from 'lucide-react';
import { useShops } from '@/hooks/useHasuraApi';
import Pagination from '@/components/ui/pagination';
import { format } from 'date-fns';
import { usePrivilege } from '@/hooks/usePrivilege';
import AddShopDialog from '../shop/AddShopDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { UPDATE_SHOP_SETTINGS } from '@/lib/graphql/mutations';
import { useToast } from '@/hooks/use-toast';

interface Shop {
  id: string;
  name: string;
  category_id: string;
  logo: string | null;
  image: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  Products_aggregate: {
    aggregate: {
      count: number;
    };
  };
  Orders_aggregate: {
    aggregate: {
      count: number;
    };
  };
  is_active: boolean;
  Orders: Array<{
    id: string;
    OrderID: string;
    status: string;
    total: string;
    created_at: string;
    delivery_fee: string;
    service_fee: string;
    User: {
      id: string;
      name: string;
      email: string;
    };
    Order_Items: Array<{
      id: string;
      quantity: number;
      price: string;
      Product: {
        name: string;
      };
    }>;
  }>;
}

const Shops = () => {
  const { data, isLoading, isError, error } = useShops();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedShops, setExpandedShops] = useState<Set<string>>(new Set());
  const [isAddShopDialogOpen, setIsAddShopDialogOpen] = useState(false);
  const { hasAction } = usePrivilege();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Disable shop mutation
  const disableShopMutation = useMutation({
    mutationFn: async ({ shopId, isActive }: { shopId: string; isActive: boolean }) => {
      return hasuraRequest(UPDATE_SHOP_SETTINGS, {
        id: shopId,
        is_active: isActive,
      });
    },
    onSuccess: (data, variables) => {
      const action = variables.isActive ? 'enabled' : 'disabled';
      toast({
        title: 'Success',
        description: `Shop ${action} successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update shop status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDisableShop = (shopId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enable' : 'disable';

    if (confirm(`Are you sure you want to ${action} this shop?`)) {
      disableShopMutation.mutate({ shopId, isActive: newStatus });
    }
  };

  // Filter shops based on search term
  const filteredShops =
    data?.Shops?.filter(
      shop =>
        searchTerm === '' ||
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Calculate pagination
  const totalItems = filteredShops.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const toggleShopExpansion = (shopId: string) => {
    const newExpanded = new Set(expandedShops);
    if (newExpanded.has(shopId)) {
      newExpanded.delete(shopId);
    } else {
      newExpanded.add(shopId);
    }
    setExpandedShops(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      out_for_delivery: { color: 'bg-purple-100 text-purple-800', label: 'Out for Delivery' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'bg-gray-100 text-gray-800',
      label: status,
    };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount || '0'));
  };

  return (
    <AdminLayout>
      {/* Hero Banner Section */}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-8 shadow-xl group">
        <img
          src="/shops_marketplace_banner.png"
          alt="Marketplace Banner"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-12">
          <Badge className="w-fit mb-4 bg-primary/20 text-primary-foreground border-primary/30 backdrop-blur-md">
            Management Portal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Partner Shops
          </h1>
          <p className="text-gray-300 max-w-md text-lg">
            Monitor shop performance, manage active subscriptions, and track promotional campaigns across your marketplace.
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-2 rounded-xl backdrop-blur-sm border border-border/50">
          <TabsList className="bg-background/50">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Store className="h-4 w-4" /> All Shops
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> Promotions
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shops..."
                className="pl-8 bg-background/50 border-none shadow-none"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-background/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Shop Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="text-red-500">
                      Error loading shops. Please try again.
                      {error && <div className="text-sm mt-2">Error details: {error.message}</div>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentShops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No shops found.
                  </TableCell>
                </TableRow>
              ) : (
                currentShops.map(shop => (
                  <React.Fragment key={shop.id}>
                    <TableRow>
                      <TableCell>
                        {(shop.Orders?.length ?? 0) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShopExpansion(shop.id)}
                            className="p-1 h-6 w-6"
                          >
                            {expandedShops.has(shop.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className="h-10 w-10 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted"
                          title={shop.name}
                        >
                          {shop.logo ? (
                            <img
                              src={shop.logo}
                              alt={`${shop.name} logo`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Store className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{shop.name}</TableCell>
                      <TableCell>{shop.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>{shop.Products_aggregate?.aggregate?.count ?? 0}</TableCell>
                      <TableCell>{shop.Orders_aggregate?.aggregate?.count ?? 0}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shop.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/shops/${shop.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {hasAction('shops', 'edit_shops') && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasAction('shops', 'delete_shops') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisableShop(shop.id, shop.is_active)}
                              disabled={disableShopMutation.isPending}
                              className="h-8 w-8 p-0"
                              title={shop.is_active ? 'Disable Shop' : 'Enable Shop'}
                            >
                              {disableShopMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : shop.is_active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Orders Section */}
                    {expandedShops.has(shop.id) && (shop.Orders?.length ?? 0) > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <div className="bg-muted/30 p-4">
                            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                              Recent Orders ({shop.Orders?.length ?? 0})
                            </h4>
                            <div className="space-y-3">
                              {(shop.Orders ?? []).map(order => (
                                <div key={order.id} className="bg-background rounded-lg p-4 border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-sm">#{order.OrderID}</span>
                                      {getStatusBadge(order.status)}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold">
                                        {formatCurrency(order.total)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span>{order.User?.name ?? '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                                      <span>Delivery: {formatCurrency(order.delivery_fee)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{order.Order_Items?.length ?? 0} items</span>
                                    </div>
                                  </div>

                                  {(order.Order_Items?.length ?? 0) > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="text-xs font-medium text-muted-foreground mb-2">
                                        Items:
                                      </div>
                                      <div className="space-y-1">
                                        {(order.Order_Items ?? []).slice(0, 3).map(item => (
                                          <div
                                            key={item.id}
                                            className="flex justify-between text-xs"
                                          >
                                            <span>
                                              {item.Product?.name ?? 'Unknown Product'} x
                                              {item.quantity}
                                            </span>
                                            <span>{formatCurrency(item.price)}</span>
                                          </div>
                                        ))}
                                        {(order.Order_Items?.length ?? 0) > 3 && (
                                          <div className="text-xs text-muted-foreground">
                                            +{(order.Order_Items?.length ?? 0) - 3} more items
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && !isError && currentShops.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={size => {
                setPageSize(size);
                setCurrentPage(1); // Reset to first page when changing page size
              }}
              totalItems={totalItems}
            />
          )}
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Active Subscriptions</h3>
              <Button size="sm" variant="outline">
                View Billing Reports
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.Shops?.filter(s => s.shop_subscription).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No active subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.Shops?.filter(s => s.shop_subscription).map(shop => {
                    const sub = (shop as any).shop_subscription;
                    return (
                      <TableRow key={shop.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden">
                              {shop.logo ? (
                                <img src={shop.logo} className="object-contain h-full w-full" />
                              ) : (
                                <Store className="h-4 w-4" />
                              )}
                            </div>
                            {shop.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5">
                            {sub.plan?.name || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{sub.billing_cycle || '—'}</TableCell>
                        <TableCell>
                          {sub.start_date ? format(new Date(sub.start_date), 'MMM dd, yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          {sub.end_date ? format(new Date(sub.end_date), 'MMM dd, yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              sub.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Active Promotions</h3>
              <Link href="/promotions">
                <Button size="sm" variant="outline">
                  Manage Global Promos
                </Button>
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Promo Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Budget Used</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.Shops?.filter(s => (s as any).promotions && (s as any).promotions.length > 0).length ===
                  0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No active promotions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.Shops?.flatMap(shop =>
                    ((shop as any).promotions || []).map((promo: any) => ({ ...promo, shopName: shop.name, shopLogo: shop.logo }))
                  ).map(promo => (
                    <TableRow key={promo.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {promo.shopLogo ? (
                              <img src={promo.shopLogo} className="object-contain h-full w-full" />
                            ) : (
                              <Store className="h-4 w-4" />
                            )}
                          </div>
                          {promo.shopName}
                        </div>
                      </TableCell>
                      <TableCell>{promo.name}</TableCell>
                      <TableCell className="font-mono text-xs">{promo.code || '—'}</TableCell>
                      <TableCell className="capitalize">{promo.discount_type}</TableCell>
                      <TableCell>
                        {promo.discount_type === 'percentage'
                          ? `${promo.discount_value}%`
                          : formatCurrency(promo.discount_value)}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (parseFloat(promo.budget_used || '0') /
                                  parseFloat(promo.budget_limit || '1')) *
                                  100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatCurrency(promo.budget_used || '0')} / {formatCurrency(promo.budget_limit || '0')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            promo.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {promo.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <AddShopDialog isOpen={isAddShopDialogOpen} onClose={() => setIsAddShopDialogOpen(false)} />
    </AdminLayout>
  );
};

export default Shops;
