import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserDetails } from '@/hooks/useUsers';
import { Loader2, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserDetailsDrawerProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({ userId, open, onClose }) => {
  const { data: userData, isLoading } = useUserDetails(userId || undefined);
  const user = userData?.Users_by_pk;

  if (!userId || !user) return null;

  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase() || 'U'
    );
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>User Profile</SheetTitle>
          <SheetDescription>View detailed information about this user</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* User Header Card */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profile_picture || undefined} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                  <Badge
                    className={
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {user.shopper && <Badge className="bg-blue-100 text-blue-800">Shopper</Badge>}
                </div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Basic Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{user.phone || 'Not provided'}</span>
                  </div>
                  {user.gender && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="font-medium capitalize">{user.gender}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Member since:</span>
                    <span className="font-medium">{formatDateTime(user.created_at)}</span>
                  </div>
                  {user.Addresses?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Default Address:</span>
                      <span className="font-medium">
                        {user.Addresses.find(addr => addr.is_default)?.street ||
                          user.Addresses[0].street}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Shopper Information */}
              {user.shopper && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Shopper Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Full Name:</span>
                      <span className="font-medium">{user.shopper.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{user.shopper.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{user.shopper.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="capitalize">
                        {user.shopper.transport_mode || 'Not specified'}
                      </Badge>
                      {user.shopper.background_check_completed && (
                        <Badge className="bg-green-100 text-green-800">
                          Background Check Completed
                        </Badge>
                      )}
                      <Badge
                        className={
                          user.shopper.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {user.shopper.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}

              {/* Wallet Information */}
              {user.Wallets?.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Wallet</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Available Balance:</span>
                      <span className="font-medium">${user.Wallets[0].available_balance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Reserved Balance:</span>
                      <span className="font-medium">${user.Wallets[0].reserved_balance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">
                        {formatDateTime(user.Wallets[0].last_updated)}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="orders">
              {/* Orders Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                {user.Orders && user.Orders.length > 0 ? (
                  <div className="space-y-4">
                    {user.Orders.map(order => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center border-b pb-4 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">Order #{order.OrderID}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total}</p>
                          <Badge
                            className={
                              order.status.toLowerCase() === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No orders found</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              {/* Invoices Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Invoices</h3>
                {user.Invoices && user.Invoices.length > 0 ? (
                  <div className="space-y-4">
                    {user.Invoices.map(invoice => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center border-b pb-4 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(invoice.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.total_amount}</p>
                          <Badge
                            className={
                              invoice.status.toLowerCase() === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No invoices found</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              {/* Schedule Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Weekly Availability Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 bg-muted text-left">Day</th>
                        <th className="border px-4 py-2 bg-muted text-left">Time Slot</th>
                        <th className="border px-4 py-2 bg-muted text-left">Status</th>
                        <th className="border px-4 py-2 bg-muted text-left">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.Shopper_Availabilities && user.Shopper_Availabilities.length > 0 ? (
                        user.Shopper_Availabilities.sort((a, b) => {
                          const dayA = parseInt(String(a.day_of_week || '1'));
                          const dayB = parseInt(String(b.day_of_week || '1'));
                          return dayA - dayB;
                        }).map(schedule => {
                          const dayNames = [
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday',
                            'Sunday',
                          ];
                          const dayIndex = parseInt(String(schedule.day_of_week || '1')) - 1;
                          const dayName = dayNames[dayIndex] || 'Unknown';

                          // Format time
                          const formatTime = (timeStr: string | null) => {
                            if (!timeStr) return 'N/A';
                            // Remove timezone offset if present
                            const time = timeStr.split('+')[0];
                            return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                          };

                          return (
                            <tr key={schedule.id} className="hover:bg-muted/50">
                              <td className="border px-4 py-2">
                                <span className="font-medium">{dayName}</span>
                              </td>
                              <td className="border px-4 py-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">{formatTime(schedule.start_time)}</span>
                                  <span className="text-muted-foreground">to</span>
                                  <span className="text-sm">{formatTime(schedule.end_time)}</span>
                                </div>
                              </td>
                              <td className="border px-4 py-2">
                                <Badge
                                  className={
                                    schedule.is_available
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {schedule.is_available ? 'Available' : 'Unavailable'}
                                </Badge>
                              </td>
                              <td className="border px-4 py-2 text-sm text-muted-foreground">
                                {schedule.created_at ? formatDateTime(schedule.created_at) : 'N/A'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="border px-4 py-8 text-center text-muted-foreground"
                          >
                            No schedule found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {user.shopper && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Schedule Summary</h4>
                      <Badge variant="outline" className="capitalize">
                        {user.shopper.transport_mode}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Available Days</div>
                        <div className="text-2xl font-bold mt-1">
                          {user.Shopper_Availabilities?.filter(s => s.is_available).length || 0}
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Average Hours/Day</div>
                        <div className="text-2xl font-bold mt-1">
                          {(() => {
                            const totalHours =
                              user.Shopper_Availabilities?.reduce((acc, curr) => {
                                if (!curr.is_available || !curr.start_time || !curr.end_time)
                                  return acc;
                                try {
                                  const formatTime = (timeStr: string) => {
                                    const time = timeStr.split('+')[0];
                                    return new Date(`2000-01-01T${time}`);
                                  };

                                  const start = formatTime(curr.start_time);
                                  const end = formatTime(curr.end_time);

                                  if (isNaN(start.getTime()) || isNaN(end.getTime())) return acc;

                                  const hours =
                                    (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                  return acc + (hours > 0 ? hours : 24 + hours); // Handle cases where end time is on next day
                                } catch (e) {
                                  return acc;
                                }
                              }, 0) || 0;

                            const availableDays =
                              user.Shopper_Availabilities?.filter(s => s.is_available).length || 1;
                            return (totalHours / availableDays).toFixed(1) + 'h';
                          })()}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserDetailsDrawer;
