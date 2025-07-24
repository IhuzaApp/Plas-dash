import React, { useState } from 'react';
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
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { usePrivilege } from '@/hooks/usePrivilege';

interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const Inventory = () => {
  const { data: systemConfig } = useSystemConfig();
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Milk 1L',
      barcode: '5901234123457',
      category: 'Dairy',
      price: 2.99,
      stock: 25,
      status: 'in-stock',
    },
    {
      id: '2',
      name: 'Bread',
      barcode: '4003994155486',
      category: 'Bakery',
      price: 1.5,
      stock: 12,
      status: 'in-stock',
    },
    {
      id: '3',
      name: 'Eggs (12)',
      barcode: '0012000811331',
      category: 'Dairy',
      price: 3.49,
      stock: 6,
      status: 'low-stock',
    },
    {
      id: '4',
      name: 'Apples (1kg)',
      barcode: '7622210101266',
      category: 'Produce',
      price: 4.99,
      stock: 18,
      status: 'in-stock',
    },
    {
      id: '5',
      name: 'Chicken Breast (500g)',
      barcode: '5449000000996',
      category: 'Meat',
      price: 6.75,
      stock: 0,
      status: 'out-of-stock',
    },
    {
      id: '6',
      name: 'Rice (2kg)',
      barcode: '7318690102205',
      category: 'Grocery',
      price: 5.25,
      stock: 8,
      status: 'low-stock',
    },
  ]);

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

  const filteredItems = items.filter(item => {
    return (
      (searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode.includes(searchTerm)) &&
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

  const categories = Array.from(new Set(items.map(item => item.category)));

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

  const startScanning = (itemId: string, type: 'barcode' | 'qrcode') => {
    setSelectedItemForScan(itemId);
    setScanType(type);
    setIsScanning(true);
    setIsScanDialogOpen(true);

    // In a real application, this would activate the device camera
    // For this demo, we'll simulate a scan after a short delay
    setTimeout(() => {
      const mockData =
        type === 'barcode'
          ? '5901234' + Math.floor(1000000 + Math.random() * 9000000).toString() // Mock barcode
          : 'https://product-info.example.com/' +
            Math.floor(10000 + Math.random() * 90000).toString(); // Mock QR code data

      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return { ...item, barcode: type === 'barcode' ? mockData : mockData };
        }
        return item;
      });

      setItems(updatedItems);
      setIsScanning(false);

      setTimeout(() => {
        setIsScanDialogOpen(false);
        setSelectedItemForScan(null);
        toast.success(
          `${type === 'barcode' ? 'Barcode' : 'QR code'} successfully linked to product!`
        );
      }, 500);
    }, 1500);
  };

  // New functions for edit dialog
  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category,
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

  return (
    <AdminLayout>
      <PageHeader
        title="POS Inventory"
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
                      <TableCell className="font-mono text-sm">{item.barcode}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{item.stock}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startScanning(item.id, 'barcode')}
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
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
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
      <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scanning {scanType === 'barcode' ? 'Barcode' : 'QR Code'}</DialogTitle>
            <DialogDescription>
              Point your camera at the {scanType === 'barcode' ? 'barcode' : 'QR code'} to connect
              it to this inventory item.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-full h-[200px] bg-muted flex items-center justify-center rounded-md border-2 border-dashed">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    {scanType === 'barcode' ? (
                      <ScanBarcode className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <ScanQrCode className="h-12 w-12 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground">Scanning...</p>
                  </div>
                </div>
                <p className="text-sm text-center">
                  Please hold steady while we scan the{' '}
                  {scanType === 'barcode' ? 'barcode' : 'QR code'}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <p>Scan completed!</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScanDialogOpen(false)}
              disabled={isScanning}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Inventory;
