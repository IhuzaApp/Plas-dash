'use client';

import React, { useState, useMemo } from 'react';
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
  Plus,
  PowerOff,
  Eye,
  Edit,
  Utensils,
  CreditCard,
  Tag,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { useRestaurants } from '@/hooks/useHasuraApi';
import Pagination from '@/components/ui/pagination';
import { format } from 'date-fns';
import { usePrivilege } from '@/hooks/usePrivilege';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AddRestaurantModal from '@/components/Restaurants/AddRestaurantModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { UPDATE_RESTAURANT } from '@/lib/graphql/mutations';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

const Restaurants = () => {
  const router = useRouter();
  const { data, isLoading, isError, error } = useRestaurants();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);

  const handleAdd = () => {
    setEditingRestaurant(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (restaurant: any) => {
    setEditingRestaurant(restaurant);
    setIsAddModalOpen(true);
  };

  const [restaurantToToggle, setRestaurantToToggle] = useState<any>(null);
  const { hasAction } = usePrivilege();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter restaurants based on search term
  const filteredRestaurants = useMemo(() => {
    return (data?.Restaurants || []).filter(
      restaurant =>
        searchTerm === '' ||
        restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.Restaurants, searchTerm]);

  // Calculate pagination
  const totalItems = filteredRestaurants.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRestaurants = useMemo(() => {
    return filteredRestaurants.slice(startIndex, endIndex);
  }, [filteredRestaurants, startIndex, endIndex]);

  // Update restaurant mutation (Activation/Deactivation)
  const updateRestaurantMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
      verified,
    }: {
      id: string;
      is_active?: boolean;
      verified?: boolean;
    }) => {
      return hasuraRequest(UPDATE_RESTAURANT, {
        id,
        is_active,
        verified,
      });
    },
    onSuccess: (data, variables) => {
      const action =
        variables.is_active !== undefined
          ? variables.is_active
            ? 'enabled'
            : 'disabled'
          : 'updated';

      toast({
        title: 'Success',
        description: `Restaurant ${action} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      setRestaurantToToggle(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update restaurant status.',
        variant: 'destructive',
      });
    },
  });

  const handleToggleStatus = (restaurant: any) => {
    const newStatus = !restaurant.is_active;

    // Validation: Cannot activate a restaurant without a subscription
    if (
      newStatus &&
      (!restaurant.shop_subscription || restaurant.shop_subscription.status !== 'active')
    ) {
      toast({
        title: 'Subscription Required',
        description: 'This restaurant has no active subscription and cannot be activated.',
        variant: 'destructive',
      });
      return;
    }

    setRestaurantToToggle(restaurant);
  };

  return (
    <AdminLayout>
      {/* Hero Banner Section */}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-8 shadow-xl group">
        <img
          src="/restaurants_marketplace_banner.png"
          alt="Restaurants Banner"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-12">
          <Badge className="w-fit mb-4 bg-primary/20 text-primary-foreground border-primary/30 backdrop-blur-md">
            Partner Portal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Gourmet Partners
          </h1>
          <p className="text-gray-300 max-w-md text-lg mb-6">
            Manage your culinary network, monitor subscription health, and verify new restaurant
            applications.
          </p>
          {hasAction('restaurants', 'add_restaurants') && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Restaurant
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-2 rounded-xl backdrop-blur-sm border border-border/50">
          <TabsList className="bg-background/50">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" /> All Restaurants
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Verification
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
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
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Created</TableHead>
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
                        Error loading restaurants.
                        {error && <div className="text-sm mt-2">{error.message}</div>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No restaurants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRestaurants.map(restaurant => (
                    <TableRow key={restaurant.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={restaurant.logo} alt={restaurant.name} />
                            <AvatarFallback className="bg-primary/5 text-primary">
                              {restaurant.name
                                ?.split(' ')
                                .map(n => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{restaurant.name}</div>
                            <div className="text-xs text-muted-foreground">
                              TIN: {restaurant.tin || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            {restaurant.email || 'N/A'}
                          </div>
                          <div className="flex items-center text-xs">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {restaurant.phone || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-xs">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">
                            {restaurant.location || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={restaurant.is_active ? 'default' : 'secondary'}
                          className={
                            restaurant.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : ''
                          }
                        >
                          {restaurant.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {restaurant.verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs font-medium">
                            {restaurant.verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {restaurant.created_at
                          ? format(new Date(restaurant.created_at), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/restaurants/${restaurant.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {hasAction('restaurants', 'edit_restaurants') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(restaurant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasAction('restaurants', 'edit_restaurants') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(restaurant)}
                              disabled={updateRestaurantMutation.isPending}
                              className="h-8 w-8 p-0"
                              title={
                                restaurant.is_active ? 'Disable Restaurant' : 'Enable Restaurant'
                              }
                            >
                              {updateRestaurantMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : restaurant.is_active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!isLoading && !isError && currentRestaurants.length > 0 && (
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
            )}
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Restaurant Subscriptions</h3>
              <Button size="sm" variant="outline">
                Billing Overview
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
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
                ) : data?.Restaurants?.filter(r => r.shop_subscription).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No active subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.Restaurants?.filter(r => r.shop_subscription).map(restaurant => {
                    const sub = (restaurant as any).shop_subscription;
                    return (
                      <TableRow key={restaurant.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={restaurant.logo} />
                              <AvatarFallback>
                                <Utensils className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            {restaurant.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5">
                            {sub.plan?.name || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-xs">
                          {sub.billing_cycle || '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {sub.start_date ? format(new Date(sub.start_date), 'MMM dd, yyyy') : '—'}
                        </TableCell>
                        <TableCell className="text-xs">
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

        <TabsContent value="verification" className="space-y-4">
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden p-6">
            <h3 className="text-xl font-semibold mb-6">Verification Queue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.Restaurants?.filter(r => !r.verified).length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  All restaurants are currently verified.
                </div>
              ) : (
                data?.Restaurants?.filter(r => !r.verified).map(restaurant => (
                  <Card
                    key={restaurant.id}
                    className="bg-background/50 border-none shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={restaurant.logo} />
                          <AvatarFallback>{restaurant.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <Badge variant="destructive" className="animate-pulse">
                          Pending
                        </Badge>
                      </div>
                      <h4 className="font-bold text-lg mb-1">{restaurant.name}</h4>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-2" /> {restaurant.location}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-2" /> {restaurant.email}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                          onClick={() =>
                            updateRestaurantMutation.mutate({
                              id: restaurant.id,
                              verified: true,
                              is_active: true,
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          size="sm"
                          onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                        >
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AddRestaurantModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRestaurant(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['restaurants'] });
        }}
        restaurant={editingRestaurant}
      />

      <AlertDialog
        open={!!restaurantToToggle}
        onOpenChange={open => !open && setRestaurantToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {restaurantToToggle?.is_active ? 'Disable Restaurant' : 'Enable Restaurant'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {restaurantToToggle?.is_active ? 'disable' : 'enable'}{' '}
              <strong>{restaurantToToggle?.name}</strong>?
              {restaurantToToggle?.is_active
                ? ' This will hide the restaurant and its menu from the marketplace.'
                : ' This will make the restaurant and its menu visible to customers.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restaurantToToggle) {
                  updateRestaurantMutation.mutate({
                    id: restaurantToToggle.id,
                    is_active: !restaurantToToggle.is_active,
                  });
                }
              }}
              className={
                restaurantToToggle?.is_active
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {updateRestaurantMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm {restaurantToToggle?.is_active ? 'Disable' : 'Enable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Restaurants;
