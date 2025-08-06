import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
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
import { useSystemConfig, useProductsByShop, useUpdateProduct, useUpdateProductName, useAddProduct, useAddProductName } from '@/hooks/useHasuraApi';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useShopSession } from '@/contexts/ShopSessionContext';

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
  const { shopSession, debugSession } = useShopSession();
  const updateProduct = useUpdateProduct();
  const updateProductName = useUpdateProductName();
  const addProduct = useAddProduct();
  const addProductName = useAddProductName();

  // Fetch products for the current shop
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProductsByShop(
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
    if (productsData?.Products) {
      const transformedItems = transformProductsToInventoryItems(productsData.Products);
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

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];

  const handleAddProduct = async (formData: any) => {
    try {
      // Validate that we have a valid shop session
      if (!shopSession?.shopId) {
        toast.error('No shop session found. Please log into a shop first.');
        return;
      }



      let productNameId = formData.productName_id;

      // If we don't have a productName_id but have productNameData, create the product name first
      if (!productNameId && formData.productNameData) {
  
        const productNameResult = await addProductName.mutateAsync(formData.productNameData);
        productNameId = productNameResult.insert_productNames_one.id;
        
      }

      // Now create the product with the productName_id
      const productData = {
        productName_id: productNameId,
        price: formData.price,
        quantity: formData.quantity,
        measurement_unit: formData.measurement_unit,
        shop_id: shopSession.shopId, // Use the current shop session ID
        category: formData.category,
        reorder_point: formData.reorder_point,
        supplier: formData.supplier,
        is_active: formData.is_active,
        final_price: formData.final_price || formData.price, // Use price as fallback if final_price is not set
      };


      await addProduct.mutateAsync(productData);
      
      
      // Verify shop session is still valid after mutation
      if (!shopSession?.shopId) {
        console.error('Shop session lost after product creation!');
        toast.error('Shop session was lost. Please log in again.');
        return;
      }
      
      toast.success('Product added successfully');
      setIsAddProductOpen(false);
      
      // Refresh the products data without losing shop session
      
      await refetchProducts();
      
    } catch (error) {
      console.error('Error adding product:', error);
              console.error('Error details:', {
        error,
        shopSession: shopSession ? { shopId: shopSession.shopId, shopName: shopSession.shopName } : null,
        formData
      });
      toast.error('Failed to add product. Please try again.');
    }
  };

  const handleImportFile = (file: File) => {
    // In a real application, this would process the Excel/CSV file


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
            {hasAction('inventory', 'add_products') && shopSession?.shopId && (
              <Button onClick={() => setIsAddProductOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
            {/* Debug button for testing session persistence */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex gap-2">

              </div>
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
        shopId={shopSession?.shopId}
        hideCommission={true}
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


    </AdminLayout>
  );
};

export default Inventory;
