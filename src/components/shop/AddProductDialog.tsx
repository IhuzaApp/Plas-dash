import React, { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScanBarcode, Upload, X, Image as ImageIcon, Loader2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useShops, useSystemConfig, useGetProductNameByBarcode, useGetProductNameBySku, useSearchProductNames } from '@/hooks/useHasuraApi';
import { Switch } from '@/components/ui/switch';
import { BrowserMultiFormatReader } from '@zxing/library';

// Match the API types exactly
const formSchema = z.object({
  name: z.string().optional(), // Make name optional since we might use productName_id
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  quantity: z.number().int().min(0, 'Quantity must be a positive number'),
  measurement_unit: z.string().min(1, 'Measurement unit is required'),
  category: z.string().min(1, 'Category is required'),
  is_active: z.boolean().default(true),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  supplier: z.string().optional(),
  reorder_point: z.number().int().min(0).optional(),
  shop_id: z.string().optional(),
  image: z.string().optional(),
  // UI-only fields (not sent to database)
  has_commission: z.boolean().default(true),
  commission_percentage: z.number().min(0).max(100).optional(),
  final_price: z.string().optional(), // Make final_price optional since it's calculated
  productName_id: z.string().optional(), // Add this for tracking selected product name ID
}).refine((data) => {
  // Ensure either name or productName_id is provided
  return (data.name && data.name.trim() !== '') || data.productName_id;
}, {
  message: "Either product name or existing product must be selected",
  path: ["name"]
});

type FormData = z.infer<typeof formSchema>;

// Define the type for the data that will be sent to the API
type ProductSubmitData = {
  price: string;
  quantity: number;
  measurement_unit: string;
  shop_id: string | undefined;
  category: string;
  reorder_point: number | undefined;
  supplier: string | undefined;
  is_active: boolean;
  final_price: string | undefined;
  productName_id: string | undefined;
  productNameData?: {
    name: string;
    description?: string;
    barcode?: string;
    sku?: string;
    image?: string;
  };
};

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductSubmitData) => void;
  shopId?: string;
  isLoading?: boolean;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  shopId,
  isLoading = false,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanType, setScanType] = useState<'barcode' | 'qrcode' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<any>(null);
  const [searchMode, setSearchMode] = useState<'name' | 'barcode' | 'sku'>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Barcode scanning states
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  
  // Refs for video element and code reader
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const { data: shopsData } = useShops();
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
  const defaultCommission =
    systemConfig?.System_configuratioins[0]?.productCommissionPercentage || 0;
    
  // Hooks for searching by barcode and SKU
  const getProductByBarcode = useGetProductNameByBarcode();
  const getProductBySku = useGetProductNameBySku();
  const { data: searchProductNamesData, isLoading: isSearchingNames } = useSearchProductNames(searchTerm);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      quantity: 0,
      measurement_unit: 'item',
      category: '',
      is_active: true,
      barcode: undefined,
      sku: undefined,
      supplier: undefined,
      reorder_point: undefined,
      shop_id: shopId,
      image: '',
      has_commission: true,
      commission_percentage: Number(defaultCommission) || 0,
      final_price: '',
    },
  });

  // Watch price and commission-related fields to calculate final price
  const price = form.watch('price');
  const hasCommission = form.watch('has_commission');
  const commissionPercentage = Number(defaultCommission) || 0; // Convert to number

  // Calculate final price whenever price or commission changes
  useEffect(() => {
    const calculateFinalPrice = () => {
      if (price) {
        const basePrice = parseFloat(price);
        if (!isNaN(basePrice)) {
          let finalPrice;
          if (hasCommission) {
            // When commission is enabled, calculate with default commission rate
            finalPrice = basePrice * (1 + commissionPercentage / 100);
          } else {
            // When commission is disabled, final price is exactly the same as base price
            finalPrice = basePrice;
          }
          form.setValue('final_price', finalPrice.toFixed(2));
        }
      } else {
        // If no base price, set final price to empty
        form.setValue('final_price', '');
      }
    };

    calculateFinalPrice();
  }, [price, hasCommission, commissionPercentage, form]);

  // Update commission percentage when has_commission changes
  useEffect(() => {
    if (hasCommission) {
      form.setValue('commission_percentage', Number(defaultCommission) || 0);
    } else {
      form.setValue('commission_percentage', 0);
    }
  }, [hasCommission, defaultCommission, form]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Auto-search as user types
  useEffect(() => {
    if (searchTerm.trim() && searchMode === 'name') {
      // The useSearchProductNames hook will automatically handle the search
      setSearchResults(searchProductNamesData?.productNames || []);
      setShowSearchResults(true);
    } else if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm, searchMode, searchProductNamesData]);

  const resetForm = () => {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
    setSelectedProductName(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setScannedCode(null);
    setScanError(null);
    setManualInputMode(false);
    setManualCode('');
    setIsScanning(false);
    setIsScanDialogOpen(false);
    setHasScanned(false); // Reset scanning flag
  };

  function handleSubmit(values: FormData) {
    const submitData: ProductSubmitData = {
      price: values.price,
      quantity: values.quantity,
      measurement_unit: values.measurement_unit,
      shop_id: values.shop_id || shopId,
      category: values.category,
      reorder_point: values.reorder_point,
      supplier: values.supplier,
      is_active: values.is_active,
      final_price: values.final_price,
      productName_id: values.productName_id,
      productNameData: values.name && !values.productName_id ? {
        name: values.name,
        description: values.description,
        barcode: values.barcode,
        sku: values.sku,
        image: values.image,
      } : undefined,
    };

    onSubmit(submitData);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image file size must be less than 2MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        form.setValue('image', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('image', '');
  };

  const handleProductNameSelect = (product: any) => {
    setSelectedProductName(product);
    form.setValue('productName_id', product.id);
    form.setValue('name', product.name);
    form.setValue('description', product.description || '');
    form.setValue('barcode', product.barcode || '');
    form.setValue('sku', product.sku || '');
    if (product.image) {
      setImagePreview(product.image);
      form.setValue('image', product.image);
    }
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSearchResultSelect = (product: any) => {
    handleProductNameSelect(product);
  };

  const startScanning = async (type: 'barcode' | 'qrcode') => {
    setScanType(type);
    setScanError(null);
    setScannedCode(null);
    setManualInputMode(false);
    setManualCode('');
    setHasScanned(false); // Reset scanning flag
    setIsScanning(true);
    setIsScanDialogOpen(true);

    try {
      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }

      // Initialize code reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      // Start scanning
      const videoElement = videoRef.current;
      if (videoElement) {
        const result = await codeReaderRef.current.decodeFromVideoDevice(
          selectedCamera || undefined,
          videoElement,
          (result, error) => {
            if (result && !hasScanned) {
              setScannedCode(result.getText());
              setIsScanning(false);
              
              // Stop the code reader to prevent multiple scans
              if (codeReaderRef.current) {
                codeReaderRef.current.reset();
              }
              
              // Auto-fill barcode field only
              form.setValue('barcode', result.getText());
              setSearchTerm(result.getText() ?? '');
              setSearchMode('barcode');
              
              // Don't automatically search - let user decide
              toast.success(`Scanned ${type}: ${result.getText()}`);
              setHasScanned(true); // Set flag to true after successful scan
            }
            if (error && error.name !== 'NotFoundException') {
              setScanError(error.message);
            }
          }
        );

        // Set timeout for scanning
        const timeout = setTimeout(() => {
          if (isScanning) {
            setScanError('Scanning timeout. Please try again or enter manually.');
            setIsScanning(false);
          }
        }, 30000); // 30 seconds timeout

        setScanTimeout(timeout);
      }
    } catch (error) {
      console.error('Scanning error:', error);
      setScanError('Failed to start camera. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim()) return;

    setScannedCode(manualCode);
    setManualInputMode(false);
    
    // Auto-fill barcode field only
    form.setValue('barcode', manualCode);
    setSearchTerm(manualCode);
    setSearchMode('barcode');
    
    // Don't automatically search - let user decide
    toast.success(`Manual ${scanType}: ${manualCode}`);
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    setIsScanning(false);
    setScanError(null);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details of the new inventory item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {!shopId && (
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a shop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shopsData?.Shops.map(shop => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Product Name Input with Search Buttons */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name*</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        placeholder="Type to search existing products or add new..."
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchTerm(e.target.value || '');
                          setSearchMode('name');
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchMode('barcode');
                        startScanning('barcode');
                      }}
                      title="Scan Barcode"
                    >
                      <ScanBarcode className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchMode('sku');
                        setShowSearchResults(false);
                      }}
                      title="Search by SKU"
                    >
                      SKU
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Search Results */}
            {showSearchResults && (
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                {isSearchingNames ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Searching products...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => handleSearchResultSelect(product)}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.barcode && `Barcode: ${product.barcode}`}
                            {product.sku && `SKU: ${product.sku}`}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-muted-foreground mb-2">
                      No products found with "{searchTerm}"
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Auto-fill the name field with the search term
                        form.setValue('name', searchTerm);
                        setShowSearchResults(false);
                        toast.info('You can now add this as a new product');
                      }}
                    >
                      Add as New Product
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Product Image */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Input
                            id="product-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="flex-1"
                          />
                          {imagePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveImage}
                            >
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="groceries">Groceries</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="home">Home & Garden</SelectItem>
                        <SelectItem value="health">Health & Beauty</SelectItem>
                        <SelectItem value="sports">Sports & Outdoors</SelectItem>
                        <SelectItem value="books">Books & Media</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="toys">Toys & Games</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="final_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Price (with commission)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measurement_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Unit*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="item">Item</SelectItem>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="l">Liter (L)</SelectItem>
                        <SelectItem value="ml">Milliliter (mL)</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="can">Can</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter barcode..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter SKU..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter supplier name..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reorder_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this product for sale
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      
      {/* Scanning Dialog */}
      <Dialog
        open={isScanDialogOpen}
        onOpenChange={open => {
          if (!open) {
            stopScanning();
          }
          setIsScanDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scanning {scanType === 'barcode' ? 'Barcode' : 'QR Code'}</DialogTitle>
            <DialogDescription>
              Point your camera at the {scanType === 'barcode' ? 'barcode' : 'QR code'} to scan it.
            </DialogDescription>
          </DialogHeader>

          {/* Camera Selection */}
          {availableCameras.length > 1 && (
            <div className="mb-4">
              <label className="text-sm font-medium">Select Camera:</label>
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose camera" />
                </SelectTrigger>
                <SelectContent>
                  {availableCameras.map((camera, index) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="py-6">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative w-full h-[300px] bg-black rounded-md overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                    </div>
                  </div>
                </div>

                {scanError && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                    {scanError}
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManualInputMode(true)}
                        className="text-xs"
                      >
                        📝 Enter Manually Instead
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-sm text-center text-muted-foreground">
                  <p>Position the {scanType === 'barcode' ? 'barcode' : 'QR code'} within the frame</p>
                </div>
              </div>
            ) : manualInputMode ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-full h-[200px] bg-blue-50 flex items-center justify-center rounded-md border-2 border-blue-200">
                  <div className="flex flex-col items-center gap-2">
                    <ScanBarcode className="h-12 w-12 text-blue-500" />
                    <p className="text-sm text-blue-700 font-medium">Manual Input</p>
                    <p className="text-xs text-blue-600 text-center">
                      Enter the {scanType === 'barcode' ? 'barcode' : 'QR code'} manually
                    </p>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <Input
                    placeholder={`Enter ${scanType === 'barcode' ? 'barcode' : 'QR code'} number`}
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    className="text-center font-mono"
                  />
                  <Button
                    onClick={handleManualCodeSubmit}
                    disabled={!manualCode.trim()}
                    className="w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Link Code to Product
                  </Button>
                </div>
              </div>
            ) : scannedCode ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-full h-[200px] bg-green-50 flex items-center justify-center rounded-md border-2 border-green-200">
                  <div className="flex flex-col items-center gap-2">
                    <Check className="h-12 w-12 text-green-500" />
                    <p className="text-sm text-green-700 font-medium">Scan Successful!</p>
                    <p className="text-xs text-green-600 font-mono bg-green-100 px-2 py-1 rounded">
                      {scannedCode}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Code has been linked to the product
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <p>Initializing camera...</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                stopScanning();
                setIsScanDialogOpen(false);
              }}
              disabled={isScanning}
            >
              Cancel
            </Button>
            {scannedCode && (
              <Button
                onClick={() => {
                  setIsScanDialogOpen(false);
                  setScannedCode(null);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AddProductDialog;
