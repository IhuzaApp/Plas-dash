'use client';

import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { usePetVendor, useUpdatePetVendor } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePageLoading } from '@/hooks/usePageLoading';
import { PetDetailsModal } from '@/components/modals/PetDetailsModal';
import { Pet } from '@/hooks/useHasuraApi';

interface PetVendorDetailsProps {
  vendorId: string;
}

const PetVendorDetails: React.FC<PetVendorDetailsProps> = ({ vendorId }) => {
  const router = useRouter();
  const { startLoading } = usePageLoading();
  const { data, isLoading, isError } = usePetVendor({ id: { _eq: vendorId } });
  const updateMutation = useUpdatePetVendor();
  const vendor = data?.pet_vendors?.[0];

  const [selectedPet, setSelectedPet] = React.useState<Pet | null>(null);
  const [isPetModalOpen, setIsPetModalOpen] = React.useState(false);

  const handlePetClick = (pet: Pet) => {
    setSelectedPet(pet);
    setIsPetModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!vendor) return;

    const newDisabled = !vendor.disabled;
    const newStatus = newDisabled ? 'disabled' : 'active';

    try {
      await updateMutation.mutateAsync({
        id: vendor.id,
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

  if (isError || !vendor) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
          <Info className="w-12 h-12 mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-bold">Pet Vendor Not Found</h2>
          <p className="text-muted-foreground mt-2">The requested vendor details could not be loaded or do not exist.</p>
          <Button variant="outline" className="mt-6" onClick={() => {
            startLoading();
            router.push('/pets');
          }}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Vendors
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
                router.push('/pets');
              }}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{String(vendor.fullname || 'Pet Vendor')}</h1>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>Pet Vendor Management</span>
                  <span>•</span>
                  <span>{String(vendor.organisationName || 'Organisation')}</span>
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
              className={vendor.disabled ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-destructive border-destructive/20 hover:bg-destructive/10'}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : vendor.disabled ? (
                <ShieldCheck className="h-4 w-4 mr-2" />
              ) : (
                <Info className="h-4 w-4 mr-2" />
              )}
              {vendor.disabled ? 'Enable Account' : 'Disable Account'}
            </Button>
            <Badge 
              variant={vendor.status === 'active' ? 'default' : 'secondary'}
              className={`px-4 py-1 text-sm capitalize ${vendor.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {vendor.status || 'Active'}
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
                    <Building2 className="w-4 h-4 text-primary" />
                    Organisation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-primary/60" /> {String(vendor.fullname || 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary/60" /> {String(vendor.address || 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Specialties</span>
                    <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                      {String(vendor.specialties || 'All Pets')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary/60" /> {format(new Date(vendor.created_at), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                    <FileCheck className="w-4 h-4 text-primary" />
                    Compliance Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">RDB Certificate</span>
                    </div>
                    <Badge variant={vendor.rdb_certificate ? 'default' : 'outline'} className={vendor.rdb_certificate ? 'bg-green-500' : ''}>
                      {vendor.rdb_certificate ? 'Verified' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium">Shelter Permit</span>
                    </div>
                    <Badge variant={vendor.sherter_permit ? 'default' : 'outline'} className={vendor.sherter_permit ? 'bg-green-500' : ''}>
                      {vendor.sherter_permit ? 'Verified' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background shadow-sm border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-sm font-medium">Proof of Residency</span>
                    </div>
                    <Badge variant={vendor.proof_residency ? 'default' : 'outline'} className={vendor.proof_residency ? 'bg-green-500' : ''}>
                      {vendor.proof_residency ? 'Verified' : 'Missing'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pets Inventory */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Available Pets</h3>
                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none font-bold">
                    {vendor.pets?.length || 0} Listed
                  </Badge>
                </div>
              </div>
              
              {vendor.pets && vendor.pets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {vendor.pets.map((pet) => (
                    <Card 
                      key={pet.id} 
                      className="overflow-hidden border-none shadow-md group hover:ring-2 hover:ring-primary/50 transition-all duration-300 cursor-pointer"
                      onClick={() => handlePetClick(pet)}
                    >
                      <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                        {pet.image ? (
                          <img 
                            src={pet.image} 
                            alt={pet.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <PawPrint className="w-16 h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <Badge className="bg-white/90 text-black border-none text-[10px] font-bold shadow-lg">
                            {pet.breed}
                          </Badge>
                          {pet.vaccinated && (
                            <Badge className="bg-green-500 text-white border-none text-[10px] font-bold shadow-lg">
                              <Stethoscope className="w-3 h-3 mr-1" /> VACCINATED
                            </Badge>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-black text-xl leading-none mb-1 group-hover:translate-x-1 transition-transform">{String(pet.name || 'Pet')}</h4>
                          <p className="text-xs text-white/70 font-medium">{String(pet.gender || 'Unknown')} • {String(pet.age || 'Unknown')}</p>
                        </div>

                        <div className="absolute top-3 right-3">
                          <div className="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-full shadow-xl">
                            {pet.free ? 'FREE' : `${pet.amount.toLocaleString()} RWF`}
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4 bg-background">
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-4 min-h-[3rem]">
                          {String(pet.story || 'This pet is looking for a forever home. Reach out to the vendor to learn more about their personality and needs.')}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{String(pet.pet_type || 'Pet')}</span>
                          </div>
                          <div className="text-[10px] font-bold text-primary">
                            {pet.quantity_sold}/{pet.quantity} ADOPTED
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/5 border-muted-foreground/20 flex flex-col items-center">
                  <PawPrint className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                  <h4 className="text-lg font-semibold text-muted-foreground">No pets listed yet</h4>
                  <p className="text-sm text-muted-foreground/60 max-w-xs mt-1">This vendor hasn't added any pets to their inventory for adoption.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <PetDetailsModal
        pet={selectedPet}
        open={isPetModalOpen}
        onOpenChange={setIsPetModalOpen}
      />
    </AdminLayout>
  );
};

export default PetVendorDetails;
