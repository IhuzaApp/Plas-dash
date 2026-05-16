'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useShopSettings } from '@/hooks/useShopSettings';
import { useMutation } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { UPDATE_SHOP_SETTINGS } from '@/lib/graphql/mutations';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Globe,
  Building,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMap } from '@/contexts/GoogleProvider';

// Helper function to format operating hours JSON to readable string
const formatOperatingHours = (operatingHours: any): string => {
  if (!operatingHours) return 'No operating hours set';

  if (typeof operatingHours === 'string') {
    try {
      const parsed = JSON.parse(operatingHours);
      return formatOperatingHours(parsed);
    } catch {
      return operatingHours;
    }
  }

  if (typeof operatingHours === 'object') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formattedDays = days
      .map(day => {
        const dayData = operatingHours[day];
        if (!dayData) return null;

        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        if (dayData.closed) {
          return `${dayName}: Closed`;
        }

        const openTime = dayData.open || '';
        const closeTime = dayData.close || '';
        return `${dayName}: ${openTime}-${closeTime}`;
      })
      .filter(Boolean);

    return formattedDays.join(', ');
  }

  return 'Invalid operating hours format';
};

// Helper function to parse operating hours string back to JSON
const parseOperatingHours = (operatingHoursString: string): any => {
  if (!operatingHoursString || operatingHoursString === 'No operating hours set') {
    return null;
  }

  // Try to parse as JSON first
  try {
    return JSON.parse(operatingHoursString);
  } catch {
    // If it's not JSON, return as is (will be handled as string)
    return operatingHoursString;
  }
};

export default function SupermarketSettings() {
  const { toast } = useToast();
  const { hasAction } = usePrivilege();
  const { data, isLoading, error, refetch } = useShopSettings();

  const updateShopMutation = useMutation({
    mutationFn: async (variables: {
      id: string;
      name?: string;
      description?: string;
      address?: string;
      phone?: string;
      operating_hours?: string;
      is_active?: boolean;
      logo?: string | null;
      tin?: string | null;
      ssd?: string | null;
      latitude?: string | null;
      longitude?: string | null;
    }) => {
      return hasuraRequest(UPDATE_SHOP_SETTINGS, variables);
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    operating_hours: '',
    is_active: true,
    tin: '',
    ssd: '',
    latitude: '',
    longitude: '',
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const { isLoaded: isMapLoaded } = useGoogleMap();

  const shop = data?.Shops?.[0];

  // Initialize form data when shop data loads
  React.useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        address: shop.address || '',
        phone: shop.phone || '',
        operating_hours:
          typeof shop.operating_hours === 'object'
            ? JSON.stringify(shop.operating_hours, null, 2)
            : shop.operating_hours || '',
        is_active: shop.is_active ?? true,
        tin: shop.tin || '',
        ssd: shop.ssd || '',
        latitude: String(shop.latitude || ''),
        longitude: String(shop.longitude || ''),
      });
      // Set logo preview if shop has a logo
      if (shop.logo) {
        setLogoPreview(shop.logo);
      }
    }
  }, [shop]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      const address = place.formatted_address;

      if (lat && lng) {
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          address: address || prev.address,
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!shop) return;

    try {
      // Parse operating hours back to JSON if it's a string
      let operatingHours = formData.operating_hours;
      if (typeof formData.operating_hours === 'string' && formData.operating_hours.trim()) {
        try {
          operatingHours = JSON.parse(formData.operating_hours);
        } catch {
          // If it's not valid JSON, keep it as a string
          operatingHours = formData.operating_hours;
        }
      }

      // Handle logo upload - convert to base64 if there's a new file
      let logoData = shop.logo || null; // Keep existing logo if no new file
      if (logoFile && logoPreview) {
        logoData = logoPreview; // Use the base64 preview data
      }

      await updateShopMutation.mutateAsync({
        id: shop.id,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        operating_hours: operatingHours,
        is_active: formData.is_active,
        logo: logoData,
        tin: formData.tin,
        ssd: formData.ssd,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      toast({
        title: 'Settings updated',
        description: 'Supermarket settings have been saved successfully.',
      });
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (shop) {
      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        address: shop.address || '',
        phone: shop.phone || '',
        operating_hours:
          typeof shop.operating_hours === 'object'
            ? JSON.stringify(shop.operating_hours, null, 2)
            : shop.operating_hours || '',
        is_active: shop.is_active ?? true,
        tin: shop.tin || '',
        ssd: shop.ssd || '',
        latitude: String(shop.latitude || ''),
        longitude: String(shop.longitude || ''),
      });
      // Reset logo preview
      setLogoPreview(shop.logo || null);
      setLogoFile(null);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Settings</h3>
            <p className="text-gray-600 mb-4">
              Failed to load supermarket settings. Please try again.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shop) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shop Found</h3>
            <p className="text-gray-600">No supermarket information found for your account.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Supermarket Information</CardTitle>
            <CardDescription>Configure your supermarket details and branding.</CardDescription>
          </div>
          {hasAction('settings', 'edit_settings') && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} size="sm" disabled={updateShopMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateShopMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={updateShopMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Settings
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supermarket Logo */}
        <div className="space-y-4">
          <Label>Supermarket Logo</Label>
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden bg-primary/5 group relative cursor-pointer"
                 onClick={() => isEditing && document.getElementById('logo-upload')?.click()}>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Store className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Input
                id="logo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={!isEditing}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-primary/20 hover:bg-primary/5"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={!isEditing}
              >
                <ImageIcon className="h-4 w-4 mr-2 text-primary" />
                Change Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended size: 512x512px. Max file size: 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Supermarket Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter supermarket name"
              />
            ) : (
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <span className="font-medium">{shop.name}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description/Slogan</Label>
            {isEditing ? (
              <Input
                id="description"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Enter description or slogan"
              />
            ) : (
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <span className="text-sm">{shop.description || 'No description available'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tax Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
            {isEditing ? (
              <Input
                id="tin"
                value={formData.tin}
                onChange={e => handleInputChange('tin', e.target.value)}
                placeholder="Enter TIN number"
              />
            ) : (
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <span className="text-sm">{shop.tin || 'No TIN available'}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssd">Social Security Number (SSD)</Label>
            {isEditing ? (
              <Input
                id="ssd"
                value={formData.ssd}
                onChange={e => handleInputChange('ssd', e.target.value)}
                placeholder="Enter SSD number"
              />
            ) : (
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <span className="text-sm">{shop.ssd || 'No SSD available'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <div className="p-3 bg-gray-50 rounded-md border">
            <Badge variant="secondary">{shop.Category?.name || 'Uncategorized'}</Badge>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            ) : (
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 flex items-center gap-2 transition-colors">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{shop.phone || 'No phone number'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address & Location</Label>
          {isEditing ? (
            <div className="space-y-4">
              {isMapLoaded ? (
                <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Search for supermarket location..."
                    className="rounded-xl"
                  />
                </Autocomplete>
              ) : (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  placeholder="Enter supermarket address"
                  className="rounded-xl"
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={e => handleInputChange('latitude', e.target.value)}
                    placeholder="e.g. -1.9441"
                    className="rounded-xl font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={e => handleInputChange('longitude', e.target.value)}
                    placeholder="e.g. 30.0619"
                    className="rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 flex items-center gap-2 transition-colors">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{shop.address || 'No address available'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 flex items-center gap-2 transition-colors">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono">Lat: {shop.latitude || 'N/A'}</span>
                </div>
                <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 flex items-center gap-2 transition-colors">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono">Lng: {shop.longitude || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operating Hours */}
        <div className="space-y-2">
          <Label htmlFor="operating_hours">Store Hours</Label>
          {isEditing ? (
            <Textarea
              id="operating_hours"
              value={formData.operating_hours}
              onChange={e => handleInputChange('operating_hours', e.target.value)}
              placeholder="Enter JSON format or simple text"
              rows={6}
            />
          ) : (
            <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 flex items-center gap-2 transition-colors">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatOperatingHours(shop.operating_hours)}</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Store Status</h3>
            <p className="text-sm text-muted-foreground">Enable or disable the store</p>
          </div>
          {isEditing ? (
            <Switch
              checked={formData.is_active}
              onCheckedChange={checked => handleInputChange('is_active', checked)}
            />
          ) : (
            <Badge variant={shop.is_active ? 'default' : 'secondary'}>
              {shop.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>

        {/* Additional Information */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Shop ID</Label>
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <code className="text-sm">{shop.id}</code>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Created</Label>
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <span className="text-sm">{format(new Date(shop.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <div className="p-3 bg-muted/30 dark:bg-zinc-900/50 rounded-xl border border-muted-foreground/10 transition-colors">
                <span className="text-sm">{format(new Date(shop.updated_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>


        </div>
      </CardContent>
    </Card>
  );
}
