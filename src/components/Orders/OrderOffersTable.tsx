'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrderOffer } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { ShoppingBag, Video, UtensilsCrossed, ExternalLink } from 'lucide-react';

interface OrderOffersTableProps {
    offers: OrderOffer[];
    isLoading: boolean;
}

const OrderOffersTable = ({ offers, isLoading }: OrderOffersTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const formatDateTime = (dateString: string | null | undefined) => {
        if (!dateString) return '—';
        try {
            return format(new Date(dateString), 'MMM d, HH:mm');
        } catch (e) {
            return '—';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'skipped':
                return 'bg-gray-100 text-gray-800';
            case 'offered':
                return 'bg-blue-100 text-blue-800';
            case 'expired':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getOrderIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'reel':
                return <Video className="h-4 w-4" />;
            case 'restaurant':
                return <UtensilsCrossed className="h-4 w-4" />;
            case 'business':
                return <ShoppingBag className="h-4 w-4" />;
            default:
                return <ShoppingBag className="h-4 w-4" />;
        }
    };

    const totalItems = offers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentOffers = offers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Order Offers</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Shopper</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Offered At</TableHead>
                            <TableHead>Expires At</TableHead>
                            <TableHead>Done On</TableHead>
                            <TableHead>Round</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Loading offers...
                                </TableCell>
                            </TableRow>
                        ) : currentOffers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No offers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentOffers.map((offer) => {
                                const orderId = offer.order_id || offer.reel_order_id || offer.restaurant_order_id || offer.business_order_id;
                                const shopperName = offer.ShopperUser?.shopper?.full_name || 'Unknown';

                                return (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-1">
                                                #{orderId?.toString().slice(0, 8) || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                {getOrderIcon(offer.order_type)}
                                                <span className="capitalize">{offer.order_type}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarFallback className="text-[10px]">
                                                        {shopperName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{shopperName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(offer.status)}>
                                                {offer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDateTime(offer.offered_at)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDateTime(offer.expires_at)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDateTime(offer.done_on)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                                                R{offer.round_number}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            totalItems={totalItems}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default OrderOffersTable;
