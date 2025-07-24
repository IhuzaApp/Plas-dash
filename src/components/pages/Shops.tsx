import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { useShops } from '@/hooks/useHasuraApi';
import Pagination from '@/components/ui/pagination';
import { format } from 'date-fns';
import { usePrivilege } from '@/hooks/usePrivilege';

interface Shop {
  id: string;
  name: string;
  category_id: string;
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
  const { hasAction } = usePrivilege();

  // Filter shops based on search term
  const filteredShops =
    data?.Shops.filter(
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
      <PageHeader
        title="Shops"
        description="Manage partner shops and their products."
        actions={
          <div className="flex gap-2">
            {hasAction('shops', 'add_shops') && (
              <Button>Add New Shop</Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shops..."
              className="pl-8"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="text-red-500">
                      Error loading shops. Please try again.
                      {error && <div className="text-sm mt-2">Error details: {error.message}</div>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentShops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No shops found.
                  </TableCell>
                </TableRow>
              ) : (
                currentShops.map(shop => (
                  <React.Fragment key={shop.id}>
                    <TableRow>
                      <TableCell>
                        {shop.Orders.length > 0 && (
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
                      <TableCell className="font-medium">{shop.name}</TableCell>
                      <TableCell>{shop.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell>{shop.Products_aggregate.aggregate.count}</TableCell>
                      <TableCell>{shop.Orders_aggregate.aggregate.count}</TableCell>
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
                        <Link href={`/shops/${shop.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                        {hasAction('shops', 'edit_shops') && (
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        )}
                        {hasAction('shops', 'delete_shops') && (
                          <Button variant="ghost" size="sm">
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Orders Section */}
                    {expandedShops.has(shop.id) && shop.Orders.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-muted/30 p-4">
                            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                              Recent Orders ({shop.Orders.length})
                            </h4>
                            <div className="space-y-3">
                              {shop.Orders.map(order => (
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
                                      <span>{order.User.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                                      <span>Delivery: {formatCurrency(order.delivery_fee)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{order.Order_Items.length} items</span>
                                    </div>
                                  </div>

                                  {order.Order_Items.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="text-xs font-medium text-muted-foreground mb-2">
                                        Items:
                                      </div>
                                      <div className="space-y-1">
                                        {order.Order_Items.slice(0, 3).map(item => (
                                          <div
                                            key={item.id}
                                            className="flex justify-between text-xs"
                                          >
                                            <span>
                                              {item.Product.name} x{item.quantity}
                                            </span>
                                            <span>{formatCurrency(item.price)}</span>
                                          </div>
                                        ))}
                                        {order.Order_Items.length > 3 && (
                                          <div className="text-xs text-muted-foreground">
                                            +{order.Order_Items.length - 3} more items
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
      </div>
    </AdminLayout>
  );
};

export default Shops;
