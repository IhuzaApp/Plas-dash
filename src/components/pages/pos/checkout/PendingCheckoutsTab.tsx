import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Trash, RotateCcw } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PendingCheckout {
  id: string;
  items: CartItem[];
  timestamp: Date;
  customerName?: string;
  status: 'pending' | 'processing';
  total: number;
}

interface PendingCheckoutsTabProps {
  pendingCheckouts: PendingCheckout[];
  onViewDetails: (id: string) => void;
  onCompleteCheckout: (id: string) => void;
  onDeleteCheckout: (id: string) => void;
  onLoadCheckout: (id: string) => void;
  hasDeleteAction: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge className="bg-yellow-500">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500">
          <Clock className="mr-1 h-3 w-3" /> Processing
        </Badge>
      );
    default:
      return null;
  }
};

export const PendingCheckoutsTab: React.FC<PendingCheckoutsTabProps> = ({
  pendingCheckouts,
  onViewDetails,
  onCompleteCheckout,
  onDeleteCheckout,
  onLoadCheckout,
  hasDeleteAction,
}) => {
  const { data: systemConfig } = useSystemConfig();

  const getTimeRemaining = (timestamp: Date) => {
    const now = new Date();
    const checkoutTime = new Date(timestamp);
    const hoursDiff = (now.getTime() - checkoutTime.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursDiff);
    
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      return `${minutesRemaining}m remaining`;
    } else {
      return `${Math.floor(hoursRemaining)}h remaining`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Checkouts</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingCheckouts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No pending checkouts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCheckouts.map(checkout => (
              <div key={checkout.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium">Order #{checkout.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {checkout.timestamp.toLocaleString()} • {checkout.items.length} items
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      {getTimeRemaining(checkout.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(checkout.status)}
                    <Badge className="bg-primary">
                      {formatCurrencyWithConfig(checkout.total, systemConfig)}
                    </Badge>
                  </div>
                </div>
                {checkout.customerName && (
                  <p className="text-sm mb-2">Customer: {checkout.customerName}</p>
                )}
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" onClick={() => onViewDetails(checkout.id)}>
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCompleteCheckout(checkout.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoadCheckout(checkout.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Load
                  </Button>
                  {hasDeleteAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => onDeleteCheckout(checkout.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
