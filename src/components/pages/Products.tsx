import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, ScanBarcode, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useProducts,
  useAddProduct,
  useAddProductName,
  useSystemConfig,
} from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import AddProductDialog from '@/components/shop/AddProductDialog';
import { usePrivilege } from '@/hooks/usePrivilege';

const Products = () => {
  const { data, isLoading, isError, error, refetch } = useProducts();
  const { data: systemConfig } = useSystemConfig();
  const products = data?.Products || [];
  const addProduct = useAddProduct();
  const addProductName = useAddProductName();
  const { hasAction } = usePrivilege();

  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { label: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    if (quantity <= 10) return { label: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', class: 'bg-green-100 text-green-800' };
  };

  const startScanning = () => {
    setIsScanning(true);

    // In a real application, this would activate the device camera
    // For this demo, we'll simulate a scan after a short delay
    setTimeout(() => {
      const mockBarcode = '5901234123457'; // Mock barcode
      setSearchTerm(mockBarcode);
      toast.success('Barcode scanned: ' + mockBarcode);
      setIsScanning(false);
    }, 1500);
  };

  const handleAddProduct = async (formData: any) => {
    try {
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
        shop_id: formData.shop_id,
        category: formData.category,
        reorder_point: formData.reorder_point,
        supplier: formData.supplier,
        is_active: formData.is_active,
        final_price: formData.final_price || formData.price, // Use price as fallback if final_price is not set
      };

      await addProduct.mutateAsync(productData);
      toast.success('Product added successfully');
      setIsAddProductOpen(false);
      refetch(); // Refresh the products list
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Error loading products.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  const activeProducts = products.filter(p => p.is_active);
  const lowStockProducts = products.filter(p => p.quantity <= 10 && p.quantity > 0);
  const outOfStockProducts = products.filter(p => p.quantity <= 0);

  // Filter products based on search term
  const filteredProducts = products.filter(
    product =>
      searchTerm === '' ||
      product.ProductName?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <PageHeader
        title="Products"
        description="Manage products across all shops."
        actions={
          <>
            {hasAction('products', 'add_products') && (
              <Button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add New Product
              </Button>
            )}
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeProducts.length}</div>
            <p className="text-muted-foreground">Active Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{outOfStockProducts.length}</div>
            <p className="text-muted-foreground">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={startScanning}
            disabled={isScanning}
          >
            <ScanBarcode className="h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Scan Barcode'}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        {isScanning && (
          <div className="p-4 text-center bg-muted rounded-md">
            <p className="text-muted-foreground">
              Scanning barcode... Please point your camera at a barcode.
            </p>
          </div>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                currentProducts.map(product => {
                  const stockStatus = getStockStatus(product.quantity);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.ProductName?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{product.Shop?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {typeof product.category === 'string'
                          ? product.category
                          : (product.category as any)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{formatCurrency(product.final_price)}</TableCell>
                      <TableCell>
                        {product.quantity} {product.measurement_unit}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.class}`}
                        >
                          {stockStatus.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {hasAction('products', 'edit_products') && (
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        )}
                        {hasAction('products', 'delete_products') && (
                          <Button variant="ghost" size="sm">
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1); // Reset to first page when changing page size
            }}
            totalItems={totalItems}
          />
        </Card>
      </div>

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onSubmit={handleAddProduct}
      />
    </AdminLayout>
  );
};

export default Products;
