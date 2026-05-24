'use client';

import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Truck,
  User,
  MapPin,
  Calendar,
  FileCheck,
  Building2,
  Info,
  ShieldCheck,
  ChevronLeft,
  Loader2,
  Car,
  Settings,
  Fuel,
  Users,
} from 'lucide-react';
import { useLogisticsAccount, useUpdateLogisticsAccount } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePageLoading } from '@/hooks/usePageLoading';
import { VehicleDetailsModal } from '@/components/modals/VehicleDetailsModal';
import { RentalVehicle } from '@/hooks/useHasuraApi';

interface LogisticsDetailsProps {
  accountId: string;
}

const LogisticsDetails: React.FC<LogisticsDetailsProps> = ({ accountId }) => {
  const router = useRouter();
  const { startLoading } = usePageLoading();
  const { data, isLoading, isError } = useLogisticsAccount({ id: { _eq: accountId } });
  const updateMutation = useUpdateLogisticsAccount();
  const account = data?.logisticsAccount?.[0];

  const [selectedVehicle, setSelectedVehicle] = React.useState<RentalVehicle | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = React.useState(false);

  const handleVehicleClick = (vehicle: RentalVehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!account) return;

    const newDisabled = !account.disabled;
    const newStatus = newDisabled ? 'disabled' : 'active';

    try {
      await updateMutation.mutateAsync({
        id: account.id,
        disabled: newDisabled,
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      toast.success(`Account ${newDisabled ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update account status');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-6 p-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (isError || !account) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
          <Info className="w-12 h-12 mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-bold">Partner Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The requested logistics partner details could not be loaded or do not exist.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              startLoading();
              router.push('/logistics');
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Partners
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                startLoading();
                router.push('/logistics');
              }}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{String(account.fullname || 'Partner')}</h1>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>Logistics Management</span>
                  <span>•</span>
                  <span>{String(account.businessName || 'Business')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={updateMutation.isPending}
              className={
                account.disabled
                  ? 'text-green-600 border-green-200 hover:bg-green-50'
                  : 'text-destructive border-destructive/20 hover:bg-destructive/10'
              }
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : account.disabled ? (
                <ShieldCheck className="h-4 w-4 mr-2" />
              ) : (
                <Info className="h-4 w-4 mr-2" />
              )}
              {account.disabled ? 'Enable Account' : 'Disable Account'}
            </Button>
            <Badge
              variant={account.status === 'active' ? 'default' : 'secondary'}
              className={`px-4 py-1 text-sm capitalize ${account.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {String(account.status || 'Active')}
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-8 pb-10">
            {/* Basic Info & Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Contact Person</span>
                    <span className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500/60" />{' '}
                      {String(account.fullname || 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500/60" />{' '}
                      {String(account.address || 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Service Type</span>
                    <span className="font-medium bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-xs">
                      {String(account.type || 'Standard Logistics')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Partner Since</span>
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500/60" />{' '}
                      {format(new Date(account.created_at), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    Compliance & KYC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium">Business Cert</span>
                    </div>
                    <Badge
                      variant={(account as any).business_cert ? 'default' : 'outline'}
                      className={(account as any).business_cert ? 'bg-green-500' : ''}
                    >
                      {(account as any).business_cert ? 'Verified' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FileCheck className="w-4 h-4 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium">Operating License</span>
                    </div>
                    <Badge
                      variant={(account as any).license ? 'default' : 'outline'}
                      className={(account as any).license ? 'bg-green-500' : ''}
                    >
                      {(account as any).license ? 'Verified' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-sm font-medium">Tax Clearance</span>
                    </div>
                    <Badge
                      variant={(account as any).proof_address ? 'default' : 'outline'}
                      className={(account as any).proof_address ? 'bg-green-500' : ''}
                    >
                      {(account as any).proof_address ? 'Verified' : 'Missing'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fleet Inventory */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold">Managed Fleet</h3>
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-emerald-500/10 text-emerald-600 border-none font-bold"
                  >
                    {account.RentalVehicles?.length || 0} Vehicles
                  </Badge>
                </div>
              </div>

              {account.RentalVehicles && account.RentalVehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {account.RentalVehicles.map(vehicle => (
                    <Card
                      key={vehicle.id}
                      className="overflow-hidden border-none shadow-md group hover:ring-2 hover:ring-blue-500/50 transition-all duration-300 cursor-pointer"
                      onClick={() => handleVehicleClick(vehicle)}
                    >
                      <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                        {(vehicle as any).main_photo ? (
                          <img
                            src={(vehicle as any).main_photo}
                            alt={vehicle.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <Car className="w-16 h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <Badge className="bg-white/90 text-black border-none text-[10px] font-bold shadow-lg">
                            {String((vehicle as any).category || 'Vehicle')}
                          </Badge>
                          <Badge className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-bold shadow-lg uppercase">
                            {String((vehicle as any).platNumber || 'N/A')}
                          </Badge>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-black text-xl leading-none mb-1 group-hover:translate-x-1 transition-transform">
                            {String(vehicle.name || 'Vehicle')}
                          </h4>
                          <p className="text-xs text-white/70 font-medium">
                            {(vehicle as any).fuel_type} • {(vehicle as any).transmission}
                          </p>
                        </div>

                        <div className="absolute top-3 right-3">
                          <div className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-xl">
                            {Number((vehicle as any).price || 0).toLocaleString()} RWF / DAY
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4 bg-background">
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            {(vehicle as any).brand} {(vehicle as any).model}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                          >
                            {vehicle.status || 'AVAILABLE'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/5 border-muted-foreground/20 flex flex-col items-center">
                  <Car className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                  <h4 className="text-lg font-semibold text-muted-foreground">
                    No vehicles in fleet
                  </h4>
                  <p className="text-sm text-muted-foreground/60 max-w-xs mt-1">
                    This partner hasn&apos;t added any vehicles to their fleet inventory yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <VehicleDetailsModal
        vehicle={selectedVehicle}
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
      />
    </AdminLayout>
  );
};

export default LogisticsDetails;
