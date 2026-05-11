'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Truck, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileCheck, 
  Car,
  Building2,
  Info,
  Users,
  Settings,
  Fuel
} from 'lucide-react';
import { useLogisticsAccount } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface LogisticsAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
  userId?: string;
}

export const LogisticsAccountModal: React.FC<LogisticsAccountModalProps> = ({
  open,
  onOpenChange,
  accountId,
  userId,
}) => {
  const where = accountId ? { id: { _eq: accountId } } : userId ? { user_id: { _eq: userId } } : null;
  const { data, isLoading } = useLogisticsAccount(where);
  const account = data?.logisticsAccount?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-48" /> : account?.fullname || 'Logistics Partner'}
              </DialogTitle>
              <DialogDescription>
                {isLoading ? <Skeleton className="h-4 w-64 mt-1" /> : `Logistics Account Management • ${account?.businessName || 'Business'}`}
              </DialogDescription>
            </div>
            {!isLoading && account && (
              <Badge 
                variant={account.status === 'active' ? 'default' : 'secondary'}
                className={`ml-auto capitalize ${account.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                {account.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !account ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="w-12 h-12 mb-4 opacity-20" />
              <p>No logistics account found for this selection.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              {/* Basic Info & Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-medium flex items-center gap-1">
                        <User className="w-3 h-3" /> {account.User?.name || account.fullname}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {account.address || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Member Since</span>
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(account.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Partner Type</span>
                      <Badge variant="outline" className="capitalize">{account.type}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary" />
                      Verification Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span>National ID / Passport</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {account.nationalIdOrPassport ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 text-xs">
                        <FileCheck className="w-4 h-4 text-muted-foreground" />
                        <span>Business Certificate</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {account.business_cert ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 text-xs">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span>Transport License</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {account.license ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fleet Overview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Fleet Management 
                    <Badge variant="secondary" className="ml-2">{account.RentalVehicles?.length || 0} Vehicles</Badge>
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {account.RentalVehicles?.map((vehicle) => (
                    <Card key={vehicle.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        {vehicle.main_photo ? (
                          <img 
                            src={vehicle.main_photo} 
                            alt={vehicle.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Car className="w-8 h-8 opacity-20" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border-none">
                          {vehicle.status}
                        </Badge>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold truncate pr-2">{vehicle.name}</h4>
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded uppercase">{vehicle.platNumber}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {vehicle.passenger} Passengers
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings className="w-3 h-3" /> {vehicle.transmission}
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="w-3 h-3" /> {vehicle.fuel_type}
                          </div>
                          <div className="font-bold text-primary">
                            {vehicle.price.toLocaleString()} RWF/day
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!account.RentalVehicles || account.RentalVehicles.length === 0) && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                      No vehicles registered in this fleet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LogisticsAccountModal;

