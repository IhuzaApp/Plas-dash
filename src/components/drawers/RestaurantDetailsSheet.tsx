import React from 'react';
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
import { Mail, Phone, MapPin } from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';

interface RestaurantDetailsSheetProps {
    restaurant: any;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string) => void;
}

const RestaurantDetailsSheet: React.FC<RestaurantDetailsSheetProps> = ({
    restaurant,
    isOpen,
    onClose,
    onApprove,
}) => {
    const { hasAction } = usePrivilege();

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-[800px] sm:w-[800px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Restaurant Details</SheetTitle>
                    <SheetDescription>
                        Detailed information about {restaurant?.name}.
                    </SheetDescription>
                </SheetHeader>

                {restaurant && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={restaurant.logo} alt={restaurant.name} />
                                <AvatarFallback className="text-lg">
                                    {restaurant.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-xl font-bold">{restaurant.name}</h3>
                                <Badge variant={restaurant.is_active ? 'default' : 'secondary'} className="mt-1">
                                    {restaurant.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {restaurant.verified && (
                                    <Badge variant="outline" className="mt-1 ml-2 text-green-600 border-green-600">
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Contact Information</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {restaurant.email || 'N/A'}
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {restaurant.phone || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Location Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {restaurant.location || 'N/A'}
                                    </div>
                                    {restaurant.lat && restaurant.long && (
                                        <div className="text-xs text-muted-foreground ml-6">
                                            Lat: {restaurant.lat}, Long: {restaurant.long}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-1">Business Details</h4>
                            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">TIN:</span>
                                    <span className="font-medium">{restaurant.tin || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">USSD:</span>
                                    <span className="font-medium">{restaurant.ussd || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="font-medium">{formatDateTime(restaurant.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t mt-6">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            {(!restaurant.is_active || !restaurant.verified) && hasAction('restaurants', 'edit_restaurants') && (
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
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default RestaurantDetailsSheet;
