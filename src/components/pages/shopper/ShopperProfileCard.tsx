import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ShopperProfileCardProps {
  shopper: any;
  user: any;
}

const ShopperProfileCard: React.FC<ShopperProfileCardProps> = ({ shopper, user }) => {
  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase() || 'NA'
    );
  };

  if (!shopper || !user) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profile_picture || shopper.profile_photo || undefined} />
            <AvatarFallback className="text-lg">{getInitials(shopper.full_name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{shopper.full_name}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
              <p>{shopper.Employment_id}</p>
              <p>{shopper.phone_number || shopper.phone}</p>
              <p>{shopper.email}</p>
              {shopper.dob && <p>DOB: {new Date(shopper.dob).toLocaleDateString()}</p>}
              {shopper.courier && <p>Courier: {shopper.courier}</p>}
              {shopper.plate_number && (
                <div className="flex items-center gap-2">
                  <span>Plate:</span>
                  <img
                    src={shopper.plate_number}
                    alt="Plate Number"
                    className="h-6 w-12 object-contain rounded border bg-white cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => window.open(shopper.plate_number, '_blank')}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge
                className={
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge
                className={
                  shopper.background_check_completed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {shopper.background_check_completed
                  ? 'Background Check Completed'
                  : 'Background Check Pending'}
              </Badge>
              {shopper.face_verified && (
                <Badge className="bg-blue-100 text-blue-800 border-none">Face Verified</Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {shopper.transport_mode}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopperProfileCard;
