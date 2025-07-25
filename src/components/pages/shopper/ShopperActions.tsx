import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { usePrivilege } from '@/hooks/usePrivilege';

interface ShopperActionsProps {
  shopper: any;
  detailedShopper: any;
  isLoadingFullDetails: boolean;
  handleApprove: () => void;
  handleReject: () => void;
  calculateAverageRating: (ratings: any[]) => string;
}

const ShopperActions: React.FC<ShopperActionsProps> = ({
  shopper,
  detailedShopper,
  isLoadingFullDetails,
  handleApprove,
  handleReject,
  calculateAverageRating,
}) => {
  const { hasAction } = usePrivilege();
  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plasa Details</DialogTitle>
            <DialogDescription>
              Complete information about the plasa including ratings and reviews
            </DialogDescription>
          </DialogHeader>

          {isLoadingFullDetails ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailedShopper ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{detailedShopper.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{detailedShopper.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{detailedShopper.User.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{detailedShopper.User.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{detailedShopper.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transport Mode</p>
                      <p className="font-medium capitalize">{detailedShopper.transport_mode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employment ID</p>
                      <p className="font-medium">{detailedShopper.Employment_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">National ID</p>
                      <p className="font-medium">{detailedShopper.national_id}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">Driving License</p>
                      {detailedShopper.driving_license ? (
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border">
                          <img
                            src={detailedShopper.driving_license}
                            alt="Driving License"
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ) : (
                        <p className="font-medium text-muted-foreground">Not provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ratings & Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratings & Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">
                        {calculateAverageRating(detailedShopper.User.Ratings)}
                      </span>
                      <span className="text-muted-foreground">
                        ({detailedShopper.User.Ratings.length} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {detailedShopper.User.Ratings.map((rating: any) => (
                      <div key={rating.id} className="border-b pb-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{rating.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(rating.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{rating.review}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Delivery</p>
                            <p>{rating.delivery_experience}/5</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Packaging</p>
                            <p>{rating.packaging_quality}/5</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Professionalism</p>
                            <p>{rating.professionalism}/5</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Failed to load shopper details</div>
          )}
        </DialogContent>
      </Dialog>

      {shopper?.status === 'pending' && hasAction('shoppers', 'edit_shoppers') && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100">
                Reject Application
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Plasa Application</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject this plasa application? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject} className="bg-red-600">
                  Reject Application
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">Approve Application</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Shopper Application</AlertDialogTitle>
                <AlertDialogDescription>
                  This will approve the shopper application and allow them to start accepting
                  orders. Please ensure you have reviewed all the necessary documents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove} className="bg-green-600">
                  Approve Application
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {shopper?.status === 'approved' && hasAction('shoppers', 'edit_shoppers') && (
        <Button
          variant="outline"
          className="bg-red-50 text-red-600 hover:bg-red-100"
          onClick={() => handleReject()}
        >
          Suspend Account
        </Button>
      )}
      {hasAction('shoppers', 'send_message') && <Button>Send Message</Button>}
    </div>
  );
};

export default ShopperActions;
