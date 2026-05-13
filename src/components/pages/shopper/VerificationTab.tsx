import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  User, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Truck, 
  CreditCard, 
  Image as ImageIcon,
  ShieldCheck,
  MapPin,
  Mail,
  Fingerprint
} from 'lucide-react';

interface VerificationTabProps {
  shopper: any;
}

const VerificationTab: React.FC<VerificationTabProps> = ({ shopper }) => {
  if (!shopper) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const VerificationItem = ({ icon: Icon, label, value, isImage = false, isStatus = false }: any) => (
    <div className="flex flex-col space-y-2 p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {isImage ? (
        value ? (
          <div className="relative group overflow-hidden rounded-lg border bg-white dark:bg-black">
            <img 
              src={value} 
              alt={label} 
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              onClick={() => window.open(value, '_blank')}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="text-white h-6 w-6" />
            </div>
          </div>
        ) : (
          <div className="h-40 w-full flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-white dark:bg-black">
            No Image Provided
          </div>
        )
      ) : isStatus ? (
        <Badge variant={value ? "default" : "destructive"} className="w-fit">
          {value ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Unverified
            </div>
          )}
        </Badge>
      ) : (
        <span className="text-lg font-semibold">{value || 'N/A'}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Identity & Background Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Identity Details
            </CardTitle>
            <CardDescription>Official identification and personal records</CardDescription>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VerificationItem icon={Calendar} label="Date of Birth" value={formatDate(shopper.dob)} />
            <VerificationItem icon={Mail} label="Official Email" value={shopper.email} />
            <VerificationItem icon={CreditCard} label="National ID" value={shopper.national_id} />
            <VerificationItem icon={ShieldCheck} label="Face Verified" value={shopper.face_verified} isStatus />
          </CardContent>
        </Card>

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Transport & Fleet
            </CardTitle>
            <CardDescription>Vehicle information and logistics type</CardDescription>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VerificationItem icon={Truck} label="Courier Type" value={shopper.courier} />
            <VerificationItem icon={ImageIcon} label="Plate Number" value={shopper.plate_number} isImage={true} />
            <VerificationItem icon={FileText} label="Driving License" value={shopper.driving_license} />
            <VerificationItem icon={Truck} label="Transport Mode" value={shopper.transport_mode} />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Verification Documents Section */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Verification Documents
          </CardTitle>
          <CardDescription>Submitted certificates and legal documents</CardDescription>
        </CardHeader>
        <CardContent className="px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <VerificationItem icon={ImageIcon} label="National ID (Front)" value={shopper.national_id_photo_front} isImage />
          <VerificationItem icon={ImageIcon} label="National ID (Back)" value={shopper.national_id_photo_back} isImage />
          <VerificationItem icon={ImageIcon} label="Driving License (Front)" value={shopper.driving_license_front} isImage />
          <VerificationItem icon={ImageIcon} label="Driving License (Back)" value={shopper.driving_license_back} isImage />
          <VerificationItem icon={ImageIcon} label="Police Clearance" value={shopper.Police_Clearance_Cert} isImage />
          <VerificationItem icon={ImageIcon} label="Proof of Residency" value={shopper.proofOfResidency} isImage />
          <VerificationItem icon={ImageIcon} label="Mutual Status Cert" value={shopper.mutual_StatusCertificate} isImage />
          <VerificationItem icon={ImageIcon} label="Driving License Cert" value={shopper.drivingLicense_Image} isImage />
        </CardContent>
      </Card>

      <Separator />

      {/* Liveness & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Liveness Verification
            </CardTitle>
            <CardDescription>Captured during face verification process</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.isArray(shopper.face_liveness_images) ? (
                shopper.face_liveness_images.map((img: string, idx: number) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border">
                    <img src={img} alt={`Liveness ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : shopper.face_liveness_images ? (
                <div className="relative group aspect-square rounded-xl overflow-hidden border">
                   <img src={shopper.face_liveness_images} alt="Liveness" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="col-span-4 h-32 flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground">
                  No liveness images available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Signatures & Comments
            </CardTitle>
            <CardDescription>Verification metadata and notes</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="text-sm font-medium text-muted-foreground mb-2">Signature Pad</div>
              {shopper.SignaturePad ? (
                <img src={shopper.SignaturePad} alt="Signature Pad" className="max-h-20 object-contain invert dark:invert-0" />
              ) : (
                <span className="text-sm italic">Not provided</span>
              )}
            </div>
            <div className="p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="text-sm font-medium text-muted-foreground mb-2">Collection Comment</div>
              <p className="text-sm">{shopper.collection_comment || 'No comments'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificationTab;
