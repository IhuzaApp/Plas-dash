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
import { useCategories } from '@/hooks/useHasuraApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, Upload, X } from 'lucide-react';

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

  // Try partial matches
  for (const [key, image] of Object.entries(categoryImageMap)) {
    if (categoryNameLower.includes(key) || key.includes(categoryNameLower)) {
      return image;
    }
  }

  // Default fallback
  return '/Assets/images/superMarkets.jpg';
};

interface AddBranchShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentShopName: string;
}

interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

interface CreateBranchShopFormData {
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
  relatedTo: string; // Required for branch shops
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
  relatedTo?: string; // Optional for branch shops
}

const AddBranchShopDialog: React.FC<AddBranchShopDialogProps> = ({ 
  isOpen, 
  onClose, 
  parentShopName 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateBranchShopFormData>({
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
    relatedTo: parentShopName, // Always set to parent shop name for branch shops
  });

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  console.log('=== ADD BRANCH SHOP DIALOG: CATEGORIES DEBUG ===');
  console.log('Categories loading:', categoriesLoading);
  console.log('Categories error:', categoriesError);
  console.log('Categories data:', categoriesData);

  // Create shop mutation
  const createShopMutation = useMutation({
    mutationFn: async (data: CreateShopMutationData) => {
      console.log('=== ADD BRANCH SHOP DIALOG: MUTATION FUNCTION CALLED ===');
      console.log('Mutation data:', data);
      console.log('CREATE_SHOP mutation:', CREATE_SHOP);

      try {
        const result = await hasuraRequest(CREATE_SHOP, data);
        console.log('=== ADD BRANCH SHOP DIALOG: MUTATION SUCCESS ===');
        console.log('Mutation result:', result);
        return result;
      } catch (error: any) {
        console.error('=== ADD BRANCH SHOP DIALOG: MUTATION ERROR ===');
        console.error('Mutation error:', error);
        console.error('Error details:', {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        throw error;
      }
    },
    onSuccess: data => {
      console.log('=== ADD BRANCH SHOP DIALOG: ON SUCCESS CALLED ===');
      console.log('Success data:', data);
      toast({
        title: 'Success',
        description: 'Branch store created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.invalidateQueries({ queryKey: ['branchShops'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('=== ADD BRANCH SHOP DIALOG: ON ERROR CALLED ===');
      console.error('Error in onError:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);

      let errorMessage = 'Failed to create branch store. Please try again.';

      if (error?.response?.data?.errors) {
        const graphqlErrors = error.response.data.errors;
        console.error('GraphQL errors:', graphqlErrors);
        errorMessage = graphqlErrors.map((err: any) => err.message).join(', ');
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof CreateBranchShopFormData, value: any) => {
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

        console.log('=== ADD BRANCH SHOP DIALOG: AUTO-ASSIGNED IMAGE ===');
        console.log('Category:', selectedCategory.name);
        console.log('Default image:', defaultImage);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast({
          title: 'Error',
          description: 'Image file size must be less than 2MB.',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setImageFile(null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== ADD BRANCH SHOP DIALOG: SUBMIT STARTED ===');
    console.log('Form data:', formData);
    console.log('Image preview exists:', !!imagePreview);

    if (!formData.name.trim()) {
      console.log('=== ADD BRANCH SHOP DIALOG: VALIDATION ERROR - NAME REQUIRED ===');
      toast({
        title: 'Error',
        description: 'Branch store name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category_id) {
      console.log('=== ADD BRANCH SHOP DIALOG: VALIDATION ERROR - CATEGORY REQUIRED ===');
      toast({
        title: 'Error',
        description: 'Please select a category.',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      ...formData,
      logo: imagePreview,
    };

    console.log('=== ADD BRANCH SHOP DIALOG: SUBMITTING DATA ===');
    console.log('Submit data:', submitData);
    console.log('Operating hours type:', typeof submitData.operating_hours);
    console.log('Operating hours value:', submitData.operating_hours);

    try {
      // Try to parse operating hours to ensure it's valid JSON
      if (typeof submitData.operating_hours === 'string') {
        const parsedHours = JSON.parse(submitData.operating_hours);
        console.log('=== ADD BRANCH SHOP DIALOG: OPERATING HOURS PARSED SUCCESSFULLY ===');
        console.log('Parsed operating hours:', parsedHours);
      }
    } catch (error) {
      console.error('=== ADD BRANCH SHOP DIALOG: OPERATING HOURS PARSE ERROR ===');
      console.error('Error parsing operating hours:', error);
      toast({
        title: 'Error',
        description: 'Invalid operating hours format. Please check the JSON format.',
        variant: 'destructive',
      });
      return;
    }

    // Clean the data to avoid null values for String fields
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
      relatedTo: submitData.relatedTo, // Always required for branch shops
    };

    console.log('=== ADD BRANCH SHOP DIALOG: CLEANED DATA ===');
    console.log('Cleaned data:', cleanedData);

    createShopMutation.mutate(cleanedData as CreateShopMutationData);
  };

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
      relatedTo: parentShopName,
    });
    setImageFile(null);
    setImagePreview(null);
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
            Add New Branch Store
          </DialogTitle>
          <DialogDescription>
            Create a new branch store under {parentShopName}. This branch will be linked to the parent store.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Shop Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Parent Store</span>
            </div>
            <p className="text-sm text-muted-foreground">{parentShopName}</p>
          </div>

          {/* Shop Logo */}
          <div className="space-y-4">
            <Label>Branch Store Logo</Label>
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Store className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                {imagePreview && (
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
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  {imagePreview && (
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Recommended size: 512x512px</p>
                  <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                  <p>• Maximum file size: 2MB</p>
                  {imageFile && (
                    <p className="text-green-600 font-medium">
                      ✓ {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Store Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter branch store name"
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Enter branch store description"
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
                placeholder="Enter branch store address"
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
                You can edit the times or use "Closed" for days when the branch is not open.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Branch Store Status</h3>
              <p className="text-sm text-muted-foreground">Enable or disable the branch store</p>
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
                  Creating Branch...
                </>
              ) : (
                'Create Branch Store'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBranchShopDialog; 