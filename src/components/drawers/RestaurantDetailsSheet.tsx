import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Mail,
  Phone,
  MapPin,
  Loader2,
  Users,
  Utensils,
  CreditCard,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useRestaurantById } from '@/hooks/useHasuraApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RestaurantDetailsSheetProps {
  restaurant: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
}

const RestaurantDetailsSheet: React.FC<RestaurantDetailsSheetProps> = ({
  restaurant: initialRestaurant,
  isOpen,
  onClose,
  onApprove,
}) => {
  const { hasAction } = usePrivilege();
  const { data, isLoading } = useRestaurantById(initialRestaurant?.id);
  const restaurant = data?.Restaurants_by_pk || initialRestaurant;

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[900px] sm:w-[900px] p-0 flex flex-col h-full">
        <ScrollArea className="flex-1">
          <div className="p-6">
            <SheetHeader className="mb-6">
              <SheetTitle>Restaurant Details</SheetTitle>
              <SheetDescription>Detailed information about {restaurant?.name}.</SheetDescription>
            </SheetHeader>

            {isLoading && !restaurant ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={restaurant?.logo} alt={restaurant?.name} />
                      <AvatarFallback className="text-lg">
                        {restaurant?.name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{restaurant?.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={restaurant?.is_active ? 'default' : 'secondary'}>
                          {restaurant?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {restaurant?.verified && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {(!restaurant?.is_active || !restaurant?.verified) &&
                    hasAction('restaurants', 'edit_restaurants') && (
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          onApprove(restaurant.id);
                          onClose();
                        }}
                      >
                        Approve Restaurant
                      </Button>
                    )}
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="dishes">Dishes</TabsTrigger>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    <TabsTrigger value="usage" className="hidden lg:flex">Usage</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center">
                          <Mail className="h-4 w-4 mr-2" /> Contact Information
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm border">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{restaurant?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{restaurant?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rating:</span>
                            <span className="font-medium">{restaurant?.rating ? `${restaurant.rating}/5` : 'No rating'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Related To:</span>
                            <span className="font-medium">{restaurant?.relatedTo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-2" /> Location Details
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm border">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Address:</span>
                            <span className="font-medium text-right">{restaurant?.location || 'N/A'}</span>
                          </div>
                          {restaurant?.lat && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Coordinates:</span>
                              <span className="font-medium">{restaurant.lat}, {restaurant.long}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" /> Business Details
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm border">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TIN:</span>
                            <span className="font-medium">{restaurant?.tin || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">USSD:</span>
                            <span className="font-medium">{restaurant?.ussd || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Member Since:</span>
                            <span className="font-medium">{formatDateTime(restaurant?.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="dishes" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center">
                          <Utensils className="h-4 w-4 mr-2" /> Restaurant Dishes ({restaurant?.restaurant_dishes?.length || 0})
                        </h4>
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Dish</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {restaurant?.restaurant_dishes?.length > 0 ? (
                              restaurant.restaurant_dishes.map((rd: any) => (
                                <TableRow key={rd.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {rd.dishes?.image && (
                                        <img src={rd.dishes.image} alt={rd.dishes.name} className="w-8 h-8 rounded-full object-cover" />
                                      )}
                                      <div>
                                        <div>{rd.dishes?.name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">SKU: {rd.SKU}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{rd.dishes?.category || 'N/A'}</TableCell>
                                  <TableCell className="font-medium">
                                    {rd.price}
                                    {rd.discount > 0 && <span className="ml-1 text-xs text-green-600">(-{rd.discount}%)</span>}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={rd.is_active ? 'outline' : 'secondary'} className={rd.is_active ? 'border-green-600 text-green-600' : ''}>
                                      {rd.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                  No dishes found for this restaurant.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="staff" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center">
                          <Users className="h-4 w-4 mr-2" /> Organization Employees ({restaurant?.orgEmployees?.length || 0})
                        </h4>
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {restaurant?.orgEmployees?.length > 0 ? (
                              restaurant.orgEmployees.map((emp: any) => (
                                <TableRow key={emp.id}>
                                  <TableCell className="font-medium">{emp.fullnames}</TableCell>
                                  <TableCell>
                                    <div className="text-sm">{emp.Position}</div>
                                    <div className="text-xs text-muted-foreground">{emp.roleType}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-xs">{emp.email}</div>
                                    <div className="text-xs text-muted-foreground">{emp.phone}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={emp.active ? 'outline' : 'secondary'} className={emp.active ? 'border-green-600 text-green-600' : ''}>
                                      {emp.active ? 'Online' : 'Offline'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                  No employees registered for this restaurant.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="orders" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" /> Restaurant Orders ({restaurant?.restaurant_orders?.length || 0})
                        </h4>
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Invoice</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {restaurant?.restaurant_orders?.length > 0 ? (
                              restaurant.restaurant_orders.map((order: any) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-medium">{order.OrderID || order.id.slice(0, 8)}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">{order.total}</TableCell>
                                  <TableCell className="text-xs">{formatDateTime(order.created_at)}</TableCell>
                                  <TableCell>
                                    <span className="text-xs text-muted-foreground">Manual Check</span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                  No orders found for this restaurant.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="subscription" className="pt-4 space-y-6">
                    {restaurant?.shop_subscription?.length > 0 ? (
                      restaurant.shop_subscription.map((sub: any) => (
                        <div key={sub.id} className="space-y-4 border rounded-lg p-4">
                          <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-primary" />
                              <div>
                                <h4 className="font-bold text-lg">{sub.plan?.name} Plan</h4>
                                <p className="text-sm text-muted-foreground">Billing: {sub.billing_cycle}</p>
                              </div>
                            </div>
                            <Badge variant={sub.status === 'active' ? 'default' : 'destructive'} className="h-6">
                              {sub.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Start Date</p>
                              <p className="text-sm font-medium">{formatDateTime(sub.start_date)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">End Date</p>
                              <p className="text-sm font-medium">{formatDateTime(sub.end_date)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">AI Limit</p>
                              <p className="text-sm font-medium">{sub.plan?.ai_request_limit || 0} req/mo</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Reel Limit</p>
                              <p className="text-sm font-medium">{sub.plan?.reel_limit || 0} uploads/mo</p>
                            </div>
                          </div>

                          {sub.plan?.plan_modules?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Enabled Modules</p>
                              <div className="flex flex-wrap gap-2">
                                {sub.plan.plan_modules.map((m: any) => (
                                  <Badge key={m.id} variant="secondary" className="bg-primary/10 text-primary border-none">
                                    {m.module?.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No active subscription found.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="usage" className="pt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-500" /> AI Usage
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {restaurant?.ai_usages?.length > 0 ? (
                            restaurant.ai_usages.map((usage: any) => (
                              <div key={usage.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                                <span>{usage.month}/{usage.year}</span>
                                <span className="font-bold">{usage.request_count} requests</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No AI usage data available.</p>
                          )}
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-red-500" /> Reel Usage
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {restaurant?.reel_usages?.length > 0 ? (
                            restaurant.reel_usages.map((usage: any) => (
                              <div key={usage.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                                <span>{usage.month}/{usage.year}</span>
                                <span className="font-bold">{usage.upload_count} uploads</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No Reel usage data available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet >
  );
};

export default RestaurantDetailsSheet;
