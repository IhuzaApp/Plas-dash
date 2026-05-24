import PetVendorDetails from '@/components/pages/PetVendorDetails';

export default function PetVendorDetailsPage({ params }: { params: { id: string } }) {
  return <PetVendorDetails vendorId={params.id} />;
}
