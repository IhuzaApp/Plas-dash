import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, User, Mail, Phone, Star, Package } from 'lucide-react';
import {
  type CombinedTicket,
  getTicketDate,
  getTicketTitle,
  getTicketUpdateDate,
  useUpdateAnyTicket,
} from '@/hooks/useTickets';
import { useUserDetails, useShopperDetails } from '@/hooks/useUsers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketDrawerProps {
  ticket: CombinedTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TicketDrawer: React.FC<TicketDrawerProps> = ({ ticket, open, onOpenChange }) => {
  const { updateTicketStatus, isLoading: isUpdating } = useUpdateAnyTicket();
  const { data: userData, isLoading: isLoadingUser } = useUserDetails(
    ticket?.type === 'support' ? ticket.user_id : undefined
  );
  const { data: shopperData, isLoading: isLoadingShopper } = useShopperDetails(
    ticket?.type === 'delivery' ? ticket.shopper_id : undefined
  );

  if (!ticket) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateTicketStatus(ticket, newStatus);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  };

  const renderUserInfo = () => {
    if (isLoadingUser || isLoadingShopper) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
      );
    }

    if (ticket.type === 'support' && userData?.Users_by_pk) {
      const user = userData.Users_by_pk;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Member since {format(new Date(user.created_at), 'PP')}</span>
          </div>
        </div>
      );
    }

    if (ticket.type === 'delivery' && shopperData?.shoppers[0]) {
      const shopper = shopperData.shoppers[0];
      const user = shopper.User;
      const rating = shopper.Ratings_aggregate?.aggregate?.avg?.rating || 0;
      const totalOrders = shopper.Orders_aggregate?.aggregate?.count || 0;

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>Rating: {rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Total Orders: {totalOrders}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Member since {format(new Date(user.created_at), 'PP')}</span>
          </div>
        </div>
      );
    }

    return <div className="text-sm text-muted-foreground">No user information available</div>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>
              {ticket.type === 'support' ? `#${ticket.ticket_num}` : ticket.id.slice(0, 8)}
            </span>
            <Badge variant="outline" className="capitalize">
              {ticket.type}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Created {format(new Date(getTicketDate(ticket)), 'PPpp')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Title and Status */}
          <div>
            <h3 className="text-lg font-semibold">{getTicketTitle(ticket)}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`capitalize ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {ticket.priority}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Created: {format(new Date(getTicketDate(ticket)), 'PPpp')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Updated: {format(new Date(getTicketUpdateDate(ticket)), 'PPpp')}</span>
            </div>
          </div>

          {/* User Information */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {ticket.type === 'support' ? 'User Information' : 'Shopper Information'}
            </h4>
            {renderUserInfo()}
            {ticket.type === 'delivery' && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Order ID: {ticket.order_id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Description</h4>
            <div className="text-sm text-muted-foreground">
              {ticket.type === 'support' ? ticket.subject : ticket.description}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Ticket as Resolved?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will close the ticket and mark it as resolved. This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleUpdateStatus('resolved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? 'Updating...' : 'Confirm Resolution'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {ticket.status === 'resolved' && (
              <Button variant="outline" className="w-full" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ticket Resolved
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TicketDrawer;
