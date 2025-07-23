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
            <AvatarFallback className="text-lg">
              {getInitials(shopper.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{shopper.full_name}</h2>
            <p className="text-muted-foreground">{shopper.Employment_id}</p>
            <p className="text-muted-foreground">{shopper.phone_number}</p>
            <div className="flex gap-2 mt-2">
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