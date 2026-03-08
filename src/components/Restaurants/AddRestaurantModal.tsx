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
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

import { uploadFileToFirebase } from '@/lib/firebaseStorage';

const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ profile: 0, logo: 0 });
  const [isUploading, setIsUploading] = useState({ profile: false, logo: false });

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
  });

  const profileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const [uploadedProfile, setUploadedProfile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'logo'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file size must be less than 10MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      if (type === 'profile') {
        setUploadedProfile(file);
        setProfilePreview(previewUrl);
      } else {
        setUploadedLogo(file);
        setLogoPreview(previewUrl);
      }

      try {
        setIsUploading(prev => ({ ...prev, [type]: true }));
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));

        const url = await uploadFileToFirebase(
          file,
          (progress) => setUploadProgress(prev => ({ ...prev, [type]: progress })),
          'images',
          undefined,
          'company images and logos'
        );

        setFormData(prev => ({ ...prev, [type]: url }));
        setIsUploading(prev => ({ ...prev, [type]: false }));
        toast.success(`${type === 'logo' ? 'Logo' : 'Profile image'} uploaded successfully!`);
      } catch (error) {
        console.error(`Upload failed for ${type}:`, error);
        toast.error(`Failed to upload ${type}`);
        setIsUploading(prev => ({ ...prev, [type]: false }));
        if (type === 'profile') {
          setUploadedProfile(null);
          setProfilePreview(null);
        } else {
          setUploadedLogo(null);
          setLogoPreview(null);
        }
      }
    }
  };

  const removeImage = (type: 'profile' | 'logo') => {
    if (type === 'profile') {
      setUploadedProfile(null);
      setProfilePreview(null);
      setFormData(prev => ({ ...prev, profile: '' }));
      if (profileInputRef.current) profileInputRef.current.value = '';
    } else {
      setUploadedLogo(null);
      setLogoPreview(null);
      setFormData(prev => ({ ...prev, logo: '' }));
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading.profile || isUploading.logo) {
      toast.error('Please wait for uploads to complete');
      return;
    }

    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields.');
      }

      const variables = {
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
        is_active: false,
      };

      const response = await fetch('/api/mutations/add-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create restaurant');
      }

      toast.success('Restaurant created successfully!', {
        description: `${formData.name} has been added and is pending verification.`,
      });

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
      });
      removeImage('profile');
      removeImage('logo');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast.error('Failed to create restaurant', {
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
          <DialogTitle>Add New Restaurant</DialogTitle>
          <DialogDescription>
            Enter the details of the new restaurant. It will require approval before going live.
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
          <div className="space-y-2">
            <Label htmlFor="location">Physical Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. 123 Main St, Springfield"
              value={formData.location}
              onChange={handleChange}
              disabled={isSubmitting}
            />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profile Image</Label>
              {!uploadedProfile ? (
                <div className="space-y-2">
                  <Input
                    name="profile"
                    placeholder="Image URL..."
                    value={formData.profile}
                    onChange={handleChange}
                    disabled={isSubmitting || isUploading.profile}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or upload</span>
                    </div>
                  </div>
                  <div
                    className="border border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer"
                    onClick={() => profileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'profile')}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border rounded-lg p-2 relative h-[120px] bg-muted/20">
                    <img
                      src={profilePreview || ''}
                      alt="Profile Preview"
                      className={`w-full h-full object-cover rounded-md ${isUploading.profile ? 'opacity-50' : ''}`}
                    />
                    {isUploading.profile && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage('profile')}
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
              {!uploadedLogo ? (
                <div className="space-y-2">
                  <Input
                    name="logo"
                    placeholder="Logo URL..."
                    value={formData.logo}
                    onChange={handleChange}
                    disabled={isSubmitting || isUploading.logo}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or upload</span>
                    </div>
                  </div>
                  <div
                    className="border border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'logo')}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border rounded-lg p-2 relative h-[120px] bg-muted/20">
                    <img
                      src={logoPreview || ''}
                      alt="Logo Preview"
                      className={`w-full h-full object-contain rounded-md ${isUploading.logo ? 'opacity-50' : ''}`}
                    />
                    {isUploading.logo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage('logo')}
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
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Adding...' : 'Add Restaurant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRestaurantModal;
