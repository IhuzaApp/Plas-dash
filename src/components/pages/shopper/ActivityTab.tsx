import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Truck, CreditCard, Tag } from 'lucide-react';

interface ActivityTabProps {
  shopper: any;
  formatCurrency: (amount: string) => string;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ shopper, formatCurrency }) => {
  if (!shopper) return null;

  const orderOffers = shopper.order_offers || [];
  const packageDeliveries = shopper.package_deliveries || [];
  const paymentRequests = shopper.payment_requests || [];

  return (
    <div className="space-y-6">
      {/* Order Offers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Order Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Offered At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderOffers.length > 0 ? (
                  orderOffers.map((offer: any) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{offer.order_id || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{offer.order_type}</TableCell>
                      <TableCell>
                        <Badge variant={offer.status === 'accepted' ? 'default' : 'outline'}>
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(offer.offered_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No order offers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Package Deliveries Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Package Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery Code</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageDeliveries.length > 0 ? (
                  packageDeliveries.map((delivery: any) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.DeliveryCode}</TableCell>
                      <TableCell>{delivery.distance} km</TableCell>
                      <TableCell>{delivery.comment || 'None'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      No package deliveries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction Code</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRequests.length > 0 ? (
                  paymentRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-bold">{formatCurrency(request.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'completed' ? 'default' : 'outline'}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.transactionCode || 'N/A'}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No payment requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTab;
