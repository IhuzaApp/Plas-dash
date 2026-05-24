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
  PawPrint,
  User,
  MapPin,
  Calendar,
  FileCheck,
  Heart,
  Building2,
  Info,
  Tag,
  Stethoscope,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { usePetVendor } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface PetVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: string;
  userId?: string;
}

export const PetVendorModal: React.FC<PetVendorModalProps> = ({
  open,
  onOpenChange,
  vendorId,
  userId,
}) => {
  const where = vendorId ? { id: { _eq: vendorId } } : userId ? { user_id: { _eq: userId } } : null;
  const { data, isLoading } = usePetVendor(where);
  const vendor = data?.pet_vendors?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-48" /> : vendor?.fullname || 'Pet Vendor'}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-64 mt-1" />
                  ) : (
                    `Pet Vendor Management • ${vendor?.organisationName || 'Organisation'}`
                  )}
                </div>
              </DialogDescription>
            </div>
            {!isLoading && vendor && (
              <Badge
                variant={vendor.status === 'active' ? 'default' : 'secondary'}
                className={`ml-auto capitalize ${vendor.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
              >
                {vendor.status || 'Active'}
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
          ) : !vendor ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="w-12 h-12 mb-4 opacity-20" />
              <p>No pet vendor found for this selection.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              {/* Basic Info & Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Organisation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Manager</span>
                      <span className="font-medium flex items-center gap-1">
                        <User className="w-3 h-3" /> {vendor.fullname}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {vendor.address || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Specialties</span>
                      <span className="font-medium">{vendor.specialties || 'All Pets'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Member Since</span>
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{' '}
                        {format(new Date(vendor.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary" />
                      Compliance Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 text-xs">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span>RDB Certificate</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {vendor.rdb_certificate ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 text-xs">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>Shelter Permit</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {vendor.sherter_permit ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>Proof of Residency</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {vendor.proof_residency ? 'Uploaded' : 'Missing'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pets Inventory */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Available Pets
                    <Badge variant="secondary" className="ml-2">
                      {vendor.pets?.length || 0} Listed
                    </Badge>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendor.pets?.map(pet => (
                    <Card
                      key={pet.id}
                      className="overflow-hidden group hover:border-primary/50 transition-colors"
                    >
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        {pet.image ? (
                          <img
                            src={pet.image}
                            alt={pet.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <PawPrint className="w-8 h-8 opacity-20" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Badge className="bg-black/60 backdrop-blur-md border-none text-[10px]">
                            {pet.breed}
                          </Badge>
                          {pet.vaccinated && (
                            <Badge className="bg-green-500/80 backdrop-blur-md border-none text-[10px]">
                              <Stethoscope className="w-3 h-3 mr-1" /> Vax
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <Badge className="bg-primary text-white border-none font-bold">
                            {pet.free ? 'FREE' : `${pet.amount.toLocaleString()} RWF`}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{pet.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {pet.gender}, {pet.age}
                            </p>
                          </div>
                          {pet.video && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Video className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {pet.story || 'No story provided.'}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] uppercase font-bold">{pet.pet_type}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {pet.quantity_sold}/{pet.quantity} Adopted
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!vendor.pets || vendor.pets.length === 0) && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                      No pets currently listed by this vendor.
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

export default PetVendorModal;
