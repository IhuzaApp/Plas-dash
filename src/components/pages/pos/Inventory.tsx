import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Import,
  Download,
  ScanBarcode,
  ScanQrCode,
  Check,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AddProductDialog from '@/components/shop/AddProductDialog';
import ImportProductsDialog from '@/components/shop/ImportProductsDialog';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSystemConfig, useProductsByShop, useUpdateProduct, useUpdateProductName } from '@/hooks/useHasuraApi';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useShopSession } from '@/hooks/useShopSession';

interface InventoryItem {
  id: string;
  productName_id?: string;
  name: string;
  barcode?: string;
  category?: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  description?: string;
  measurement_unit?: string;
  sku?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Inventory = () => {
  const { data: systemConfig } = useSystemConfig();
  const { shopSession } = useShopSession();
  const updateProduct = useUpdateProduct();
  const updateProductName = useUpdateProductName();

  // Fetch products for the current shop
  const { data: productsData, isLoading: productsLoading } = useProductsByShop(
    shopSession?.shopId || ''
  );

  // Transform API data to match our interface
  const transformProductsToInventoryItems = (products: any[]): InventoryItem[] => {
    return products.map(product => ({
      id: product.id,
      productName_id: product.productName_id,
      name: product.ProductName?.name || 'Unknown Product',
      barcode: product.ProductName?.barcode || '',
      category: product.category || 'Uncategorized',
      price: parseFloat(product.price) || 0,
      stock: parseInt(product.quantity) || 0,
      status: getStockStatus(parseInt(product.quantity) || 0),
      description: product.ProductName?.description || '',
      measurement_unit: product.measurement_unit || 'unit',
      sku: product.ProductName?.sku || '',
      is_active: product.is_active || false,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString(),
    }));
  };

  const getStockStatus = (quantity: number): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    return 'in-stock';
  };

  const [items, setItems] = useState<InventoryItem[]>([]);

  // Update items when products data changes
  React.useEffect(() => {
    console.log('=== PRODUCTS DATA CHANGED ===');
    console.log('Products data:', productsData);
    
    if (productsData?.Products) {
      const transformedItems = transformProductsToInventoryItems(productsData.Products);
      console.log('Transformed items:', transformedItems);
      setItems(transformedItems);
    }
  }, [productsData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [stockStatus, setStockStatus] = useState<string | undefined>(undefined);

  // Dialog states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Edit dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
  });

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Barcode scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState<'barcode' | 'qrcode' | null>(null);
  const [selectedItemForScan, setSelectedItemForScan] = useState<string | null>(null);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isSavingBarcode, setIsSavingBarcode] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  // Refs for video element and code reader
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const filteredItems = items.filter(item => {
    return (
      (searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchTerm))) &&
      (category === undefined || category === 'all' || item.category === category) &&
      (stockStatus === undefined || stockStatus === 'all' || item.status === stockStatus)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-green-500">In Stock</Badge>;
      case 'low-stock':
        return <Badge className="bg-yellow-500">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge className="bg-red-500">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const handleAddProduct = (values: any) => {
    const newItem: InventoryItem = {
      id: (items.length + 1).toString(),
      name: values.name,
      barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
      category: values.category,
      price: parseFloat(values.price),
      stock: parseInt(values.stock),
      status:
        parseInt(values.stock) > 10
          ? 'in-stock'
          : parseInt(values.stock) > 0
            ? 'low-stock'
            : 'out-of-stock',
      description: values.description || '',
      measurement_unit: values.measurement_unit || 'unit',
      sku: values.sku || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems([...items, newItem]);
    setIsAddProductOpen(false);
    toast.success('Product added successfully');
  };

  const handleImportFile = (file: File) => {
    // In a real application, this would process the Excel/CSV file
    console.log('Importing file:', file.name);

    // Simulate processing delay
    setTimeout(() => {
      toast.success(`Successfully imported products from ${file.name}`);
      setIsImportOpen(false);
    }, 1500);
  };

  const handleExportTemplate = () => {
    // In a real application, this would generate and download an Excel template
    toast.success('Template downloaded successfully');
  };

  const startScanning = async (itemId: string, type: 'barcode' | 'qrcode') => {
    console.log('=== STARTING BARCODE SCAN ===');
    console.log('Item ID:', itemId);
    console.log('Scan type:', type);
    
    setSelectedItemForScan(itemId);
    setScanType(type);
    setIsScanning(true);
    setScanError(null);
    setScannedCode(null);
    setManualInputMode(false);
    setManualCode('');
    setIsScanDialogOpen(true);

    try {
      // Initialize the code reader
      codeReaderRef.current = new BrowserMultiFormatReader();
      console.log('Code reader initialized');

      // Get available video devices
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      console.log('Available video devices:', videoInputDevices);
      setAvailableCameras(videoInputDevices);

      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use selected camera or first available camera
      const selectedDeviceId = selectedCamera || videoInputDevices[0].deviceId;
      console.log('Selected device ID:', selectedDeviceId);
      console.log('Selected device details:', videoInputDevices.find(d => d.deviceId === selectedDeviceId));

      // Configure video constraints for better scanning
      const constraints = {
        video: {
          deviceId: selectedDeviceId,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment', // Use back camera if available
        }
      };

      console.log('Video constraints:', constraints);

      // Set a timeout to stop scanning after 30 seconds
      const timeout = setTimeout(() => {
        console.log('Scan timeout reached - stopping scanner');
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
        }
        setIsScanning(false);
        setScanError('Scan timeout. Please try again or use manual input.');
      }, 30000); // 30 seconds
      setScanTimeout(timeout);

      // Start scanning with better configuration
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        async (result: Result | null, error: any) => {
          // Reduce console spam - only log occasionally
          if (Math.random() < 0.01) { // Log only 1% of the time
            console.log('=== SCAN CALLBACK TRIGGERED ===');
            console.log('Result:', result);
            console.log('Error:', error);
          }
          
          if (result) {
            // Successfully scanned a code
            const scannedText = result.getText();
            console.log('🎉 SUCCESS! Scanned text:', scannedText);
            setScannedCode(scannedText);

            // Stop scanning immediately to prevent multiple scans
            if (codeReaderRef.current) {
              codeReaderRef.current.reset();
            }
            if (scanTimeout) {
              clearTimeout(scanTimeout);
              setScanTimeout(null);
            }
            setIsScanning(false);

            // Update the product in the database
            try {
              setIsSavingBarcode(true);
              console.log('Updating product with barcode:', { itemId, scannedText });
              
              // Get current product data to ensure we have all required fields
              const currentProduct = getCurrentProduct(itemId);
              console.log('Current product data:', currentProduct);
              
              // Since barcode is now in ProductName table, we need to update the ProductName
              // First, we need to get the productName_id from the current product
              const productNameId = currentProduct?.productName_id;
              
              if (!productNameId) {
                throw new Error('Product name ID not found');
              }
              
              console.log('Updating ProductName with barcode:', { productNameId, scannedText });
              
              // Update the ProductName with the new barcode
              const updateProductNameResult = await updateProductName.mutateAsync({
                id: productNameId,
                barcode: scannedText || '', // Ensure it's not null
              });
              
              console.log('ProductName update successful:', updateProductNameResult);

              // Update local state
              const updatedItems = items.map(item => {
                if (item.id === itemId) {
                  return { ...item, barcode: scannedText };
                }
                return item;
              });

              setItems(updatedItems);

              // Immediately close dialog and show success message
              setIsScanDialogOpen(false);
              setSelectedItemForScan(null);
              setScannedCode(null);
              toast.success(
                `${type === 'barcode' ? 'Barcode' : 'QR code'} successfully linked to product!`
              );
            } catch (error: any) {
              console.error('Failed to update product barcode:', error);
              console.error('Error details:', {
                itemId,
                scannedText,
                errorMessage: error.message,
                errorStack: error.stack,
                errorResponse: error.response,
                errorData: error.data
              });
              setScanError(`Failed to save barcode to database: ${error.message}`);
              setIsScanning(false);
            } finally {
              setIsSavingBarcode(false);
            }
          }

          if (error) {
            if (error.name === 'NotFoundException') {
              // This is normal - no barcode detected yet, but don't log every time
              if (Math.random() < 0.001) { // Log only 0.1% of the time
                console.log('No barcode detected yet - this is normal');
              }
            } else {
            console.error('Scanning error:', error);
            setScanError('Failed to scan. Please try again.');
            }
          }
        }
      );
    } catch (error) {
      console.error('Failed to start scanning:', error);
      setScanError('Failed to access camera. You can manually enter the code below.');
      setIsScanning(false);
      setManualInputMode(true);
    }
  };

  // Handle manual code input
  const handleManualCodeSubmit = async () => {
    console.log('=== MANUAL CODE SUBMIT ===');
    console.log('Manual code:', manualCode);
    console.log('Selected item:', selectedItemForScan);
    
    if (!manualCode.trim() || !selectedItemForScan) return;

    try {
      setIsSavingBarcode(true);
      console.log('Updating product with manual barcode:', { selectedItemForScan, manualCode });
      
      // Get current product data to ensure we have all required fields
      const currentProduct = getCurrentProduct(selectedItemForScan);
      console.log('Current product data for manual input:', currentProduct);
      
      // Create update data with current product info to avoid null issues
      const updateData = {
        id: selectedItemForScan,
        barcode: manualCode.trim() || '', // Ensure it's not null
        // Include other fields that might be required
        name: currentProduct?.name || '',
        price: currentProduct?.price?.toString() || '0',
        quantity: currentProduct?.stock || 0,
        measurement_unit: currentProduct?.measurement_unit || 'unit',
        final_price: currentProduct?.price?.toString() || '0',
      };
      
      console.log('Manual update data being sent:', updateData);
      
      // Update the product in the database
      const updateResult = await updateProduct.mutateAsync(updateData);
      
      console.log('Manual barcode update successful:', updateResult);

      // Update local state
    const updatedItems = items.map(item => {
      if (item.id === selectedItemForScan) {
        return { ...item, barcode: manualCode.trim() };
      }
      return item;
    });

    setItems(updatedItems);
    setScannedCode(manualCode.trim());
    setManualInputMode(false);
    setManualCode('');

      // Immediately close dialog and show success message
      setIsScanDialogOpen(false);
      setSelectedItemForScan(null);
      setScannedCode(null);

    toast.success(
      `${scanType === 'barcode' ? 'Barcode' : 'QR code'} successfully linked to product!`
    );
    } catch (error: any) {
      console.error('Failed to update product barcode:', error);
      console.error('Manual input error details:', {
        selectedItemForScan,
        manualCode,
        errorMessage: error.message,
        errorStack: error.stack
      });
      toast.error(`Failed to save barcode to database: ${error.message}`);
    } finally {
      setIsSavingBarcode(false);
    }
  };

  // Function to get current product data
  const getCurrentProduct = (productId: string) => {
    return items.find(item => item.id === productId);
  };

  // Cleanup function to stop scanning when dialog closes
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    setIsScanning(false);
    setScanError(null);
    setScannedCode(null);
    setManualInputMode(false);
    setManualCode('');
    setSelectedItemForScan(null);
    setIsSavingBarcode(false);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // New functions for edit dialog
  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category || '',
      price: item.price.toString(),
      stock: item.stock.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleEditSelectChange = (value: string) => {
    setEditFormData({
      ...editFormData,
      category: value,
    });
  };

  const handleEditSave = () => {
    if (!editingItem) return;

    const updatedItems = items.map(item => {
      if (item.id === editingItem.id) {
        const updatedStock = parseInt(editFormData.stock);
        const updatedStatus =
          updatedStock > 10 ? 'in-stock' : updatedStock > 0 ? 'low-stock' : 'out-of-stock';

        return {
          ...item,
          name: editFormData.name,
          category: editFormData.category,
          price: parseFloat(editFormData.price),
          stock: updatedStock,
          status: updatedStatus as 'in-stock' | 'low-stock' | 'out-of-stock',
        };
      }
      return item;
    });

    setItems(updatedItems);
    setIsEditDialogOpen(false);
    toast.success('Product updated successfully');
  };

  // New functions for delete confirmation
  const openDeleteDialog = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    const updatedItems = items.filter(item => item.id !== itemToDelete);
    setItems(updatedItems);
    setIsDeleteDialogOpen(false);
    toast.success('Product deleted successfully');
  };

  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const { hasAction } = usePrivilege();

  // Show loading state while fetching products
  if (productsLoading) {
    return (
      <AdminLayout>
        <PageHeader
          title="POS Inventory"
          description="Manage inventory levels and product information"
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show message if no shop session
  if (!shopSession) {
    return (
      <AdminLayout>
        <PageHeader
          title="POS Inventory"
          description="Manage inventory levels and product information"
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <div className="p-6">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Shop Session</h3>
            <p className="text-muted-foreground">Please log into a shop to view inventory.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={`POS Inventory - ${shopSession.shopName}`}
        description="Manage inventory levels and product information"
        icon={<ShoppingBag className="h-6 w-6" />}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            {hasAction('inventory', 'import_products') && (
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Import className="mr-2 h-4 w-4" />
                Import Products
              </Button>
            )}
            {hasAction('inventory', 'export_products') && (
              <Button variant="outline" onClick={handleExportTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Export Template
              </Button>
            )}
            {hasAction('inventory', 'add_products') && (
              <Button onClick={() => setIsAddProductOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or barcode..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.barcode || '-'}</TableCell>
                      <TableCell>{item.category || 'Uncategorized'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{item.stock}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              console.log('=== SCAN BUTTON CLICKED ===');
                              console.log('Item:', item);
                              startScanning(item.id, 'barcode');
                            }}
                            title="Scan Barcode"
                          >
                            <ScanBarcode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startScanning(item.id, 'qrcode')}
                            title="Scan QR Code"
                          >
                            <ScanQrCode className="h-4 w-4" />
                          </Button>
                          {hasAction('inventory', 'edit_products') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasAction('inventory', 'delete_products') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => openDeleteDialog(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onSubmit={handleAddProduct}
      />

      {/* Import Products Dialog */}
      <ImportProductsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSubmit={handleImportFile}
      />

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Make changes to the product details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">
                Category
              </label>
              <Select value={editFormData.category} onValueChange={handleEditSelectChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right">
                Price ($)
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={editFormData.price}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="stock" className="text-right">
                Stock
              </label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={editFormData.stock}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEditSave}>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from the
              inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              Point your camera at the {scanType === 'barcode' ? 'barcode' : 'QR code'} to connect
              it to this inventory item.
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
                    onLoadedMetadata={() => {
                      console.log('Video loaded metadata');
                      console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                    }}
                    onCanPlay={() => {
                      console.log('Video can play');
                    }}
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
                  
                  {/* Debug info */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                    <div>Camera: {availableCameras.find(c => c.deviceId === selectedCamera)?.label || 'Unknown'}</div>
                    <div>Status: Scanning...</div>
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

                <div className="text-sm text-center text-muted-foreground space-y-2">
                  <p>Position the {scanType === 'barcode' ? 'barcode' : 'QR code'} within the frame</p>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">💡 Tips for better scanning:</p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Ensure good lighting</li>
                      <li>• Hold the barcode steady</li>
                      <li>• Keep it within the green frame</li>
                      <li>• Try different angles if needed</li>
                    </ul>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">🧪 Test Mode:</p>
                      <p className="text-xs text-blue-600">Try scanning this test barcode: <code className="bg-blue-100 px-1 rounded">1234567890123</code></p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            console.log('=== TEST SCAN TRIGGERED ===');
                            const testBarcode = '1234567890123';
                            setScannedCode(testBarcode);
                            
                            // Get current product data to ensure we have all required fields
                            const currentProduct = getCurrentProduct(selectedItemForScan!);
                            console.log('Current product data for test scan:', currentProduct);
                            
                            // Create update data with current product info to avoid null issues
                            const updateData = {
                              id: selectedItemForScan!,
                              barcode: testBarcode || '', // Ensure it's not null
                              // Include other fields that might be required
                              name: currentProduct?.name || '',
                              price: currentProduct?.price?.toString() || '0',
                              quantity: currentProduct?.stock || 0,
                              measurement_unit: currentProduct?.measurement_unit || 'unit',
                              final_price: currentProduct?.price?.toString() || '0',
                            };
                            
                            console.log('Test update data being sent:', updateData);
                            
                            // Simulate the database update
                            updateProduct.mutateAsync(updateData).then((result) => {
                              console.log('Test barcode saved successfully:', result);
                              // Immediately close dialog and show success message
                              setIsScanDialogOpen(false);
                              setSelectedItemForScan(null);
                              setScannedCode(null);
                              toast.success('Test barcode scanned successfully!');
                            }).catch((error: any) => {
                              console.error('Test barcode save failed:', error);
                              console.error('Test scan error details:', {
                                selectedItemForScan,
                                testBarcode,
                                errorMessage: error.message,
                                errorStack: error.stack
                              });
                              toast.error(`Test barcode save failed: ${error.message}`);
                            });
                          }}
                        >
                          🧪 Test Scan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            console.log('=== TEST CAMERA ===');
                            if (videoRef.current) {
                              console.log('Video element:', videoRef.current);
                              console.log('Video ready state:', videoRef.current.readyState);
                              console.log('Video paused:', videoRef.current.paused);
                              console.log('Video current time:', videoRef.current.currentTime);
                              console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                              toast.info('Camera test info logged to console');
                            }
                          }}
                        >
                          📷 Test Camera
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => setManualInputMode(true)}
                        >
                          📝 Manual Input
                        </Button>
                      </div>
                    </div>
                  </div>
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
                    disabled={!manualCode.trim() || isSavingBarcode}
                    className="w-full"
                  >
                    {isSavingBarcode ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                    <Check className="mr-2 h-4 w-4" />
                    Link Code to Product
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : scannedCode ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-full h-[200px] bg-green-50 flex items-center justify-center rounded-md border-2 border-green-200">
                  <div className="flex flex-col items-center gap-2">
                    {isSavingBarcode ? (
                      <>
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                        <p className="text-sm text-green-700 font-medium">Saving to Database...</p>
                      </>
                    ) : (
                      <>
                    <Check className="h-12 w-12 text-green-500" />
                    <p className="text-sm text-green-700 font-medium">Scan Successful!</p>
                      </>
                    )}
                    <p className="text-xs text-green-600 font-mono bg-green-100 px-2 py-1 rounded">
                      {scannedCode}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {isSavingBarcode ? 'Saving barcode to database...' : 'Code has been linked to the product'}
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
    </AdminLayout>
  );
};

export default Inventory;
