import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Upload, Image as ImageIcon, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlans } from '@/hooks/useHasuraApi';
import { useToast } from '@/hooks/use-toast';

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurant?: any; // If provided, we are in Edit mode
}

import { uploadFileToFirebase } from '@/lib/firebaseStorage';
import { Textarea } from '@/components/ui/textarea';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useGoogleMap } from '@/contexts/GoogleProvider';

const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  restaurant 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ profile: 0, logo: 0, rdb_cert: 0 });
  const [isUploading, setIsUploading] = useState({ profile: false, logo: false, rdb_cert: false });

  const { data: plansData, isLoading: plansLoading } = usePlans();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    ussd: '',
    tin: '',
    profile: '',
    lat: '',
    long: '',
    logo: '',
    rdb_cert: '',
    plan_id: '',
    billing_cycle: 'monthly',
    operating_hours: '',
  });

  const isEditMode = !!restaurant;
  const { isLoaded } = useGoogleMap();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const defaultCenter = { lat: -1.9441, lng: 30.0619 }; // Kigali
  const [center, setCenter] = useState(defaultCenter);

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';
        
        setCenter({ lat, lng });
        setFormData(prev => ({
          ...prev,
          lat: lat.toString(),
          long: lng.toString(),
          location: address
        }));
      }
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setFormData(prev => ({
        ...prev,
        lat: lat.toString(),
        long: lng.toString()
      }));
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          setFormData(prev => ({
            ...prev,
            location: results[0].formatted_address
          }));
        }
      });
    }
  };

  React.useEffect(() => {
    if (restaurant && isOpen) {
      setFormData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        location: restaurant.location || '',
        ussd: restaurant.ussd || '',
        tin: restaurant.tin || '',
        profile: restaurant.profile || '',
        lat: restaurant.lat || '',
        long: restaurant.long || '',
        logo: restaurant.logo || '',
        rdb_cert: restaurant.rdb_cert || '',
        plan_id: restaurant.shop_subscription?.plan_id || '',
        billing_cycle: restaurant.shop_subscription?.billing_cycle || 'monthly',
        operating_hours: typeof restaurant.operating_hours === 'object' 
          ? JSON.stringify(restaurant.operating_hours, null, 2) 
          : restaurant.operating_hours || '',
      });
      
      if (restaurant.lat && restaurant.long) {
        setCenter({
          lat: parseFloat(restaurant.lat.toString()),
          lng: parseFloat(restaurant.long.toString()),
        });
      } else {
        setCenter(defaultCenter);
      }
      
      if (restaurant.profile) setProfilePreview(restaurant.profile);
      if (restaurant.logo) setLogoPreview(restaurant.logo);
      if (restaurant.rdb_cert) setRdbCertPreview(restaurant.rdb_cert);
    } else if (!isOpen) {
      // Reset form on close
      setCenter(defaultCenter);
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        ussd: '',
        tin: '',
        profile: '',
        lat: '',
        long: '',
        logo: '',
        rdb_cert: '',
        plan_id: '',
        billing_cycle: 'monthly',
        operating_hours: '',
      });
      setProfilePreview(null);
      setLogoPreview(null);
      setRdbCertPreview(null);
    }
  }, [restaurant, isOpen]);

  const profileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const rdbCertInputRef = React.useRef<HTMLInputElement>(null);

  const [uploadedProfile, setUploadedProfile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [uploadedRdbCert, setUploadedRdbCert] = useState<File | null>(null);
  const [rdbCertPreview, setRdbCertPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'logo' | 'rdb_cert'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (type !== 'rdb_cert' && !isImage) {
        toast.error('Please select a valid image file');
        return;
      }

      if (type === 'rdb_cert' && !isImage && !isPdf) {
        toast.error('Please select an image or PDF for the certificate');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      if (type === 'profile') {
        setUploadedProfile(file);
        setProfilePreview(previewUrl);
      } else if (type === 'logo') {
        setUploadedLogo(file);
        setLogoPreview(previewUrl);
      } else {
        setUploadedRdbCert(file);
        setRdbCertPreview(isImage ? previewUrl : 'pdf'); // Placeholder for PDF
      }

      try {
        setIsUploading(prev => ({ ...prev, [type]: true }));
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));

        const url = await uploadFileToFirebase(
          file,
          progress => setUploadProgress(prev => ({ ...prev, [type]: progress })),
          'certificates',
          undefined,
          'restaurant documents'
        );

        setFormData(prev => ({ ...prev, [type]: url }));
        setIsUploading(prev => ({ ...prev, [type]: false }));
        toast.success(`${type === 'rdb_cert' ? 'RDB Certificate' : type === 'logo' ? 'Logo' : 'Profile image'} uploaded successfully!`);
      } catch (error) {
        console.error(`Upload failed for ${type}:`, error);
        toast.error(`Failed to upload ${type}`);
        setIsUploading(prev => ({ ...prev, [type]: false }));
        if (type === 'profile') {
          setUploadedProfile(null);
          setProfilePreview(null);
        } else if (type === 'logo') {
          setUploadedLogo(null);
          setLogoPreview(null);
        } else {
          setUploadedRdbCert(null);
          setRdbCertPreview(null);
        }
      }
    }
  };

  const removeFile = (type: 'profile' | 'logo' | 'rdb_cert') => {
    if (type === 'profile') {
      setUploadedProfile(null);
      setProfilePreview(null);
      setFormData(prev => ({ ...prev, profile: '' }));
      if (profileInputRef.current) profileInputRef.current.value = '';
    } else if (type === 'logo') {
      setUploadedLogo(null);
      setLogoPreview(null);
      setFormData(prev => ({ ...prev, logo: '' }));
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else {
      setUploadedRdbCert(null);
      setRdbCertPreview(null);
      setFormData(prev => ({ ...prev, rdb_cert: '' }));
      if (rdbCertInputRef.current) rdbCertInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading.profile || isUploading.logo || isUploading.rdb_cert) {
      toast.error('Please wait for uploads to complete');
      return;
    }

    if (!isEditMode) {
      const selectedPlan = plansData?.plans?.find((p: any) => p.id === formData.plan_id);
      if (!selectedPlan) {
        toast.error('Please select a subscription plan');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields.');
      }

      let opHours = formData.operating_hours;
      try {
        if (opHours && (opHours.startsWith('{') || opHours.startsWith('['))) {
          opHours = JSON.parse(opHours);
        }
      } catch (e) {
        // Keep as string if not valid JSON
      }

      const restaurantData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        ussd: formData.ussd,
        tin: formData.tin,
        profile: formData.profile,
        lat: formData.lat,
        long: formData.long,
        logo: formData.logo,
        rdb_cert: formData.rdb_cert,
        operating_hours: opHours,
      };

      if (isEditMode) {
        const response = await fetch('/api/mutations/restaurants/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: restaurant.id,
            ...restaurantData
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update restaurant');
        }

        toast.success('Restaurant updated successfully!');
      } else {
        const selectedPlan = plansData?.plans?.find((p: any) => p.id === formData.plan_id);
        const response = await fetch('/api/mutations/restaurants/create-with-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            restaurant: restaurantData,
            plan: selectedPlan,
            billing_cycle: formData.billing_cycle
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create restaurant');
        }

        toast.success('Restaurant created successfully!', {
          description: `${formData.name} has been added with an active ${selectedPlan?.name} subscription.`,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving restaurant:', error);
      toast.error(isEditMode ? 'Failed to update restaurant' : 'Failed to create restaurant', {
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of the restaurant. Changes will take effect immediately.' 
              : 'Enter the details of the new restaurant. It will require approval before going live.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Restaurant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. The Golden Grill"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Public Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. contact@goldengrill.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="e.g. +1 234 567 890"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {!isEditMode && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Subscription Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_id">Select Plan <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, plan_id: value }))}
                    disabled={isSubmitting || plansLoading}
                  >
                    <SelectTrigger id="plan_id" className="bg-background">
                      <SelectValue placeholder={plansLoading ? "Loading plans..." : "Select a plan"} />
                    </SelectTrigger>
                    <SelectContent>
                      {plansData?.plans?.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - RWF {formData.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select
                    value={formData.billing_cycle}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="billing_cycle" className="bg-background">
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="location">Physical Location</Label>
            {isLoaded ? (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
              >
                <Input
                  id="location"
                  name="location"
                  placeholder="Search for a location..."
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </Autocomplete>
            ) : (
              <Input
                id="location"
                name="location"
                placeholder="e.g. 123 Main St, Springfield"
                value={formData.location}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude (lat)</Label>
              <Input
                id="lat"
                name="lat"
                placeholder="-1.286389"
                value={formData.lat}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long">Longitude (long)</Label>
              <Input
                id="long"
                name="long"
                placeholder="36.817223"
                value={formData.long}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {isLoaded && (
            <div className="border rounded-lg overflow-hidden h-[200px] w-full">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={center}
                zoom={15}
                onLoad={onMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                }}
              >
                <Marker
                  position={center}
                  draggable={true}
                  onDragEnd={onMarkerDragEnd}
                />
              </GoogleMap>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ussd">USSD</Label>
              <Input
                id="ussd"
                name="ussd"
                placeholder="*123#"
                value={formData.ussd}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin">TIN</Label>
              <Input
                id="tin"
                name="tin"
                placeholder="Tax ID"
                value={formData.tin}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="operating_hours">Operating Hours</Label>
            <Textarea
              id="operating_hours"
              name="operating_hours"
              placeholder="e.g. Mon-Fri: 8:00 AM - 10:00 PM, Sat-Sun: 9:00 AM - 11:00 PM"
              value={formData.operating_hours}
              onChange={handleChange}
              disabled={isSubmitting}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profile Image</Label>
              {!uploadedProfile && !profilePreview ? (
                <div className="space-y-2">
                  <div
                    className="border border-dashed rounded-lg p-6 text-center hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => profileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">Upload Profile</span>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'profile')}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border rounded-lg p-2 relative h-[140px] bg-muted/20">
                    <img
                      src={profilePreview || ''}
                      alt="Profile Preview"
                      className={`w-full h-full object-cover rounded-md ${isUploading.profile ? 'opacity-50' : ''}`}
                    />
                    {isUploading.profile && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeFile('profile')}
                      disabled={isUploading.profile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {isUploading.profile && (
                    <div className="w-full bg-muted rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.profile}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              {!uploadedLogo && !logoPreview ? (
                <div className="space-y-2">
                  <div
                    className="border border-dashed rounded-lg p-6 text-center hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <span className="text-sm font-medium text-muted-foreground">Upload Logo</span>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'logo')}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border rounded-lg p-2 relative h-[140px] bg-muted/20">
                    <img
                      src={logoPreview || ''}
                      alt="Logo Preview"
                      className={`w-full h-full object-contain rounded-md ${isUploading.logo ? 'opacity-50' : ''}`}
                    />
                    {isUploading.logo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeFile('logo')}
                      disabled={isUploading.logo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {isUploading.logo && (
                    <div className="w-full bg-muted rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.logo}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>RDB Certificate (PDF or Image)</Label>
            {!uploadedRdbCert && !rdbCertPreview ? (
              <div
                className="border border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => rdbCertInputRef.current?.click()}
              >
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Click to upload RDB Certificate</p>
                  <p className="text-xs text-muted-foreground">PDF, PNG, or JPG (max. 10MB)</p>
                </div>
                <input
                  ref={rdbCertInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => handleFileUpload(e, 'rdb_cert')}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/20 flex items-center gap-4 relative">
                <div className="h-16 w-16 rounded border bg-background flex items-center justify-center overflow-hidden">
                  {rdbCertPreview === 'pdf' ? (
                    <div className="text-primary font-bold text-xs">PDF</div>
                  ) : (
                    <img src={rdbCertPreview || ''} alt="RDB Cert" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadedRdbCert ? uploadedRdbCert.name : 'RDB Certificate'}
                  </p>
                  {isUploading.rdb_cert ? (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-muted rounded-full h-1">
                        <div
                          className="bg-primary h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.rdb_cert}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Uploading... {Math.round(uploadProgress.rdb_cert)}%</p>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600 font-medium mt-1">✓ Ready for submission</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeFile('rdb_cert')}
                  disabled={isUploading.rdb_cert}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Restaurant')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRestaurantModal;
