'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, CreditCard } from 'lucide-react';

interface OverviewTabProps {
    restaurant: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ restaurant }) => {
    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy HH:mm');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center">
                        <Mail className="h-4 w-4 mr-2" /> Contact Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center">
                        <MapPin className="h-4 w-4 mr-2" /> Location Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" /> Business Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
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
                </CardContent>
            </Card>
        </div>
    );
};

export default OverviewTab;
