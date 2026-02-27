import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Package, ThumbsUp, Headset, MapPin, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Rating } from '@/hooks/useHasuraApi';

export const RatingCard = ({ rating }: { rating: Rating }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderStars = (score: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-3 h-3 md:w-4 md:h-4 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                    }`}
            />
        ));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Header Info */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="flex">{renderStars(rating.rating)}</div>
                                <span className="font-semibold">{rating.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDate(rating.created_at)}</span>
                        </div>

                        {/* User Info */}
                        <div className="mb-3">
                            <p className="font-medium text-sm">
                                {rating.User?.name || 'Anonymous User'}
                            </p>
                            {rating.review && (
                                <p className="text-sm text-muted-foreground mt-2 italic">"{rating.review}"</p>
                            )}
                        </div>

                        {/* Detailed Ratings */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-xs text-muted-foreground">
                            {rating.delivery_experience && (
                                <div className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    <span>Delivery: {rating.delivery_experience}/5</span>
                                </div>
                            )}
                            {rating.packaging_quality && (
                                <div className="flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    <span>Packaging: {rating.packaging_quality}/5</span>
                                </div>
                            )}
                            {rating.professionalism && (
                                <div className="flex items-center gap-1">
                                    <Headset className="w-3 h-3" />
                                    <span>Professionalism: {rating.professionalism}/5</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action to expand Order info */}
                    {rating.Order && (
                        <div className="flex flex-col items-end justify-start">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary h-8"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-4 h-4 mr-1" /> Hide Order
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 mr-1" /> View Order
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Expanded Order Section */}
                {isExpanded && rating.Order && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold mb-1 flex items-center gap-1">
                                    <Package className="w-4 h-4" /> Order #{rating.Order.OrderID}
                                </p>
                                <div className="space-y-1 text-muted-foreground">
                                    <p>Delivery Fee: RWF {rating.Order.delivery_fee}</p>
                                    {rating.Order.discount > 0 && <p>Discount: RWF {rating.Order.discount}</p>}
                                    {rating.Order.delivery_notes && (
                                        <p className="italic">Note: {rating.Order.delivery_notes}</p>
                                    )}
                                </div>
                            </div>

                            {rating.Order.Shop && (
                                <div>
                                    <p className="font-semibold mb-1 flex items-center gap-1">
                                        <MapPin className="w-4 h-4" /> Store
                                    </p>
                                    <div className="space-y-1 text-muted-foreground">
                                        <p className="font-medium text-foreground">{rating.Order.Shop.name}</p>
                                        <p className="text-xs">{rating.Order.Shop.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
