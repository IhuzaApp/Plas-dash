import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { CREATE_SHOP } from '@/lib/graphql/mutations';
import { useCategories, usePlans } from '@/hooks/useHasuraApi';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2, Store, Upload, X } from 'lucide-react';

// Utility function to get default image based on category name
const getDefaultImageForCategory = (categoryName: string): string => {
  const categoryNameLower = categoryName.toLowerCase();

  // Map category names to default images
  const categoryImageMap: { [key: string]: string } = {
    supermarket: '/Assets/images/superMarkets.jpg',
    grocery: '/Assets/images/superMarkets.jpg',
    market: '/Assets/images/publicMarket.jpg',
    'public market': '/Assets/images/publicMarket.jpg',
    organic: '/Assets/images/OrganicShop.jpg',
    'organic shop': '/Assets/images/OrganicShop.jpg',
    'health food': '/Assets/images/OrganicShop.jpg',
    delicatessen: '/Assets/images/delicatessen.jpeg',
    deli: '/Assets/images/delicatessen.jpeg',
    butcher: '/Assets/images/Butcher.webp',
    'meat shop': '/Assets/images/Butcher.webp',
    bakery: '/Assets/images/Bakery.webp',
    'bread shop': '/Assets/images/Bakery.webp',
    pastry: '/Assets/images/Bakery.webp',
  };

  // Try exact match first
  if (categoryImageMap[categoryNameLower]) {
    return categoryImageMap[categoryNameLower];
  }

  // Try partial matches with priority order
  const partialMatches = [
    { key: 'supermarket', image: '/Assets/images/superMarkets.jpg' },
    { key: 'grocery', image: '/Assets/images/superMarkets.jpg' },
    { key: 'organic', image: '/Assets/images/OrganicShop.jpg' },
    { key: 'delicatessen', image: '/Assets/images/delicatessen.jpeg' },
    { key: 'deli', image: '/Assets/images/delicatessen.jpeg' },
    { key: 'butcher', image: '/Assets/images/Butcher.webp' },
    { key: 'bakery', image: '/Assets/images/Bakery.webp' },
    { key: 'pastry', image: '/Assets/images/Bakery.webp' },
    { key: 'market', image: '/Assets/images/publicMarket.jpg' },
  ];

  for (const { key, image } of partialMatches) {
    if (categoryNameLower.includes(key)) {
      return image;
    }
  }

  // Default fallback
  return '/Assets/images/superMarkets.jpg';
};

interface AddShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

interface CreateShopFormData {
  name: string;
  description: string;
  category_id: string;
  address: string;
  phone: string;
  operating_hours: string;
  latitude: number | null;
  longitude: number | null;
  logo: string | null;
  image: string | null;
  tin: string;
  ssd: string;
  is_active: boolean;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
}

interface CreateShopMutationData {
  name: string;
  description?: string;
  category_id: string;
  address?: string;
  phone?: string;
  operating_hours: any; // JSON object
  latitude?: string;
  longitude?: string;
  logo?: string;
  image?: string;
  tin?: string;
  ssd?: string;
  is_active: boolean;
  relatedTo?: string;
}

import { uploadFileToFirebase } from '@/lib/firebaseStorage';

const AddShopDialog: React.FC<AddShopDialogProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<CreateShopFormData>({
    name: '',
    description: '',
    category_id: '',
    address: '',
    phone: '',
    operating_hours: JSON.stringify(
      {
        monday: '9am - 5pm',
        tuesday: '9am - 5pm',
        wednesday: '9am - 5pm',
        thursday: '9am - 5pm',
        friday: '9am - 5pm',
        saturday: '9am - 2pm',
        sunday: 'Closed',
      },
      null,
      2
    ),
    latitude: null,
    longitude: null,
    logo: null,
    image: null,
    tin: '',
    ssd: '',
    is_active: true,
    plan_id: '',
    billing_cycle: 'monthly',
  });

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // Fetch plans
  const {
    data: plansData,
    isLoading: plansLoading,
  } = usePlans();



  const handleInputChange = (field: keyof CreateShopFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Automatically set default image when category is selected
    if (field === 'category_id' && value) {
      const selectedCategory = categoriesData?.Categories?.find(cat => cat.id === value);
      if (selectedCategory) {
        const defaultImage = getDefaultImageForCategory(selectedCategory.name);
        setFormData(prev => ({
          ...prev,
          [field]: value,
          image: defaultImage,
        }));

        console.log('=== ADD SHOP DIALOG: AUTO-ASSIGNED IMAGE ===');
        console.log('Category:', selectedCategory.name);
        console.log('Default image:', defaultImage);
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select a valid image file.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: 'Error',
          description: 'Image file size must be less than 10MB.',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const url = await uploadFileToFirebase(
          file,
          progress => setUploadProgress(progress),
          'images',
          undefined,
          'company images and logos'
        );

        setFormData(prev => ({ ...prev, logo: url }));
        setIsUploading(false);
        toast({
          title: 'Success',
          description: 'Logo uploaded successfully!',
        });
      } catch (error) {
        console.error('Upload failed:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload logo',
          variant: 'destructive',
        });
        setIsUploading(false);
        setImageFile(null);
        setImagePreview(null);
      }
    }
  };

  const handleRemoveLogo = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
    // Clear the file input
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== ADD SHOP DIALOG: SUBMIT STARTED ===');
    console.log('Form data:', formData);
    console.log('Image preview exists:', !!imagePreview);

    if (!formData.name.trim()) {
      console.log('=== ADD SHOP DIALOG: VALIDATION ERROR - NAME REQUIRED ===');
      toast({
        title: 'Error',
        description: 'Shop name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category_id) {
      console.log('=== ADD SHOP DIALOG: VALIDATION ERROR - CATEGORY REQUIRED ===');
      toast({
        title: 'Error',
        description: 'Please select a category.',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      ...formData,
      // logo is already in formData.logo from the upload
    };

    console.log('=== ADD SHOP DIALOG: SUBMITTING DATA ===');
    console.log('Submit data:', submitData);
    console.log('Operating hours type:', typeof submitData.operating_hours);
    console.log('Operating hours value:', submitData.operating_hours);

    try {
      // Try to parse operating hours to ensure it's valid JSON
      if (typeof submitData.operating_hours === 'string') {
        const parsedHours = JSON.parse(submitData.operating_hours);
        console.log('=== ADD SHOP DIALOG: OPERATING HOURS PARSED SUCCESSFULLY ===');
        console.log('Parsed operating hours:', parsedHours);
      }
    } catch (error) {
      console.error('=== ADD SHOP DIALOG: OPERATING HOURS PARSE ERROR ===');
      console.error('Error parsing operating hours:', error);
      toast({
        title: 'Error',
        description: 'Invalid operating hours format. Please check the JSON format.',
        variant: 'destructive',
      });
      return;
    }

    const selectedPlan = plansData?.plans?.find(p => p.id === formData.plan_id);
    if (!selectedPlan) {
      toast({
        title: 'Error',
        description: 'Please select a subscription plan.',
        variant: 'destructive',
      });
      return;
    }

    const cleanedData = {
      name: submitData.name,
      description: submitData.description?.trim() || undefined,
      category_id: submitData.category_id,
      address: submitData.address?.trim() || undefined,
      phone: submitData.phone?.trim() || undefined,
      operating_hours: JSON.parse(submitData.operating_hours),
      latitude: submitData.latitude?.toString() || undefined,
      longitude: submitData.longitude?.toString() || undefined,
      logo: submitData.logo || undefined,
      image: submitData.image || undefined,
      tin: submitData.tin?.trim() || undefined,
      ssd: submitData.ssd?.trim() || undefined,
      is_active: submitData.is_active,
    };

    console.log('=== ADD SHOP DIALOG: CLEANED DATA ===');
    console.log('Cleaned data:', cleanedData);

    createShopMutation.mutate({
      shop: cleanedData,
      plan: selectedPlan,
      billing_cycle: formData.billing_cycle,
    });
  };

  // Update mutation logic to use the new endpoint
  const createShopMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('/api/mutations/shops/create-with-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create shop');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Shop and subscription created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['api', 'shops'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      address: '',
      phone: '',
      operating_hours: JSON.stringify(
        {
          monday: '9am - 5pm',
          tuesday: '9am - 5pm',
          wednesday: '9am - 5pm',
          thursday: '9am - 5pm',
          friday: '9am - 5pm',
          saturday: '9am - 2pm',
          sunday: 'Closed',
        },
        null,
        2
      ),
      latitude: null,
      longitude: null,
      logo: null,
      image: null,
      tin: '',
      ssd: '',
      is_active: true,
      plan_id: '',
      billing_cycle: 'monthly',
    });
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    // Clear the file input
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Add New Shop
          </DialogTitle>
          <DialogDescription>Create a new shop with all the necessary details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Logo */}
          <div className="space-y-4">
            <Label>Shop Logo</Label>
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted">
                  {imagePreview || formData.logo ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreview || formData.logo || ''}
                        alt="Logo preview"
                        className={`h-full w-full object-contain ${isUploading ? 'opacity-50' : ''}`}
                      />
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Store className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                {(imagePreview || formData.logo) && !isUploading && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    title="Remove logo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="space-y-2">
                  <Input
                    placeholder="Logo URL..."
                    value={formData.logo || ''}
                    onChange={e => handleInputChange('logo', e.target.value)}
                    disabled={isUploading}
                  />
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground whitespace-nowrap">
                        or upload file
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                      disabled={isUploading}
                    />
                    {imagePreview && !isUploading && (
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Recommended size: 512x512px</p>
                  <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>• Maximum file size: 10MB</p>
                  {imageFile && !isUploading && (
                    <p className="text-green-600 font-medium">
                      ✓ {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* rest of the form */}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter shop name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={value => handleInputChange('category_id', value)}
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={categoriesLoading ? 'Loading categories...' : 'Select a category'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.Categories?.filter(category => category.is_active).map(
                    category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {formData.image && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>✓ Default image assigned:</span>
                  <span className="font-medium">{formData.image.split('/').pop()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Subscription Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="plan">Select Plan *</Label>
                <Select
                  value={formData.plan_id}
                  onValueChange={value => handleInputChange('plan_id', value)}
                  disabled={plansLoading}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue
                      placeholder={plansLoading ? 'Loading plans...' : 'Select a plan'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {plansData?.plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {formData.billing_cycle === 'monthly' ? `RWF ${plan.price_monthly}/mo` : `RWF ${plan.price_yearly}/yr`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={value => handleInputChange('billing_cycle', value)}
                >
                  <SelectTrigger className="bg-background">
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Enter shop description"
              rows={3}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                placeholder="Enter shop address"
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
              <Input
                id="tin"
                value={formData.tin}
                onChange={e => handleInputChange('tin', e.target.value)}
                placeholder="Enter TIN number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssd">Social Security Number (SSD)</Label>
              <Input
                id="ssd"
                value={formData.ssd}
                onChange={e => handleInputChange('ssd', e.target.value)}
                placeholder="Enter SSD number"
              />
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={e =>
                  handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="Enter latitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={e =>
                  handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="Enter longitude"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2">
            <Label htmlFor="operating_hours">Operating Hours</Label>
            <Textarea
              id="operating_hours"
              value={formData.operating_hours}
              onChange={e => handleInputChange('operating_hours', e.target.value)}
              placeholder="Enter operating hours (e.g., Monday-Friday: 8AM-6PM, Saturday: 9AM-5PM)"
              rows={6}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Current format (JSON):</p>
              <div className="bg-muted p-2 rounded text-xs font-mono">
                {`{
  "monday": "9am - 5pm",
  "tuesday": "9am - 5pm",
  "wednesday": "9am - 5pm", 
  "thursday": "9am - 5pm",
  "friday": "9am - 5pm",
  "saturday": "9am - 2pm",
  "sunday": "Closed"
}`}
              </div>
              <p className="text-xs">
                You can edit the times or use &quot;Closed&quot; for days when the shop is not open.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Shop Status</h3>
              <p className="text-sm text-muted-foreground">Enable or disable the shop</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={checked => handleInputChange('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createShopMutation.isPending || categoriesLoading}>
              {createShopMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shop'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShopDialog;
