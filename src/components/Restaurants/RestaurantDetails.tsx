import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Pencil } from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useRestaurantById } from '@/hooks/useHasuraApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditRestaurantDrawer from './EditRestaurantDrawer';

// Tab Components
import OverviewTab from './tabs/OverviewTab';
import DishesTab from './tabs/DishesTab';
import StaffTab from './tabs/StaffTab';
import OrdersTab from './tabs/OrdersTab';
import SubscriptionTab from './tabs/SubscriptionTab';
import UsageTab from './tabs/UsageTab';

interface RestaurantDetailsProps {
    id: string;
    onApprove?: (id: string) => void;
}

const RestaurantDetails: React.FC<RestaurantDetailsProps> = ({
    id,
    onApprove,
}) => {
    const { hasAction } = usePrivilege();
    const { data, isLoading, isError, refetch } = useRestaurantById(id);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const restaurant = data?.Restaurants_by_pk;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !restaurant) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-destructive font-medium">Error loading restaurant details.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
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

                <div className="flex items-center gap-2">
                    {hasAction('restaurants', 'edit_restaurants') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Details
                        </Button>
                    )}

                    {(!restaurant?.is_active || !restaurant?.verified) &&
                        hasAction('restaurants', 'edit_restaurants') && onApprove && (
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    onApprove(restaurant.id);
                                }}
                            >
                                Approve Restaurant
                            </Button>
                        )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="dishes">Menu</TabsTrigger>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    <TabsTrigger value="usage" className="hidden lg:flex">Usage</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 pt-0">
                    <OverviewTab restaurant={restaurant} />
                </TabsContent>

                <TabsContent value="dishes" className="pt-0">
                    <DishesTab
                        dishes={restaurant?.restaurant_dishes}
                        onRefresh={() => refetch()}
                        restaurantId={id}
                    />
                </TabsContent>

                <TabsContent value="staff" className="pt-0">
                    <StaffTab staff={restaurant?.orgEmployees} />
                </TabsContent>

                <TabsContent value="orders" className="pt-0">
                    <OrdersTab orders={restaurant?.restaurant_orders} />
                </TabsContent>

                <TabsContent value="subscription" className="pt-0 space-y-6">
                    <SubscriptionTab subscriptions={restaurant?.shop_subscription} />
                </TabsContent>

                <TabsContent value="usage" className="pt-0 space-y-6">
                    <UsageTab
                        aiUsage={restaurant?.ai_usages}
                        reelUsage={restaurant?.reel_usages}
                    />
                </TabsContent>
            </Tabs>

            <EditRestaurantDrawer
                restaurant={restaurant}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
};

export default RestaurantDetails;
