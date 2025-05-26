import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, FileUp, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AddProductDialog from '@/components/shop/AddProductDialog';
import ImportProductsDialog from '@/components/shop/ImportProductsDialog';
import { useShopById, useAddProduct, useSystemConfig } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import * as z from 'zod';
import Pagination from '@/components/ui/pagination';
import { formatCurrency } from '@/lib/utils';

interface OperatingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
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
});

type ProductFormData = z.infer<typeof productFormSchema>;

const formatOperatingHours = (hours: OperatingHours | string | null) => {
  if (!hours) return 'Not specified';
  if (typeof hours === 'string') return hours;

  return (
    <ol className="space-y-1">
      {Object.entries(hours).map(([day, time]) => (
        <li key={day} className="grid grid-cols-2 gap-2">
          <span className="capitalize">{day}:</span>
          <span>{time || 'Closed'}</span>
        </li>
      ))}
    </ol>
  );
};

const ShopDetail = () => {
  const params = useParams();
  const id = params?.id?.toString() || '';
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, error, refetch } = useShopById(id);
  const shop = data?.Shops_by_pk;
  const addProduct = useAddProduct();
  const { data: configData } = useSystemConfig();
  const config = configData?.System_configuratioins[0];

  const handleAddProduct = async (formData: ProductFormData) => {
    try {
      await addProduct.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        quantity: formData.quantity,
        measurement_unit: formData.measurement_unit,
        shop_id: id,
        category: formData.category,
        barcode: formData.barcode,
        sku: formData.sku,
        reorder_point: formData.reorder_point,
        supplier: formData.supplier,
        is_active: formData.is_active,
      });

      toast.success('Product added successfully');
      setIsAddProductOpen(false);
      refetch(); // Refresh the shop data to show the new product
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    }
  };

  const handleImportProducts = (file: File) => {
    console.log('Importing products from file:', file);
    toast.success('Products imported successfully');
    setIsImportOpen(false);
  };

  // Filter products based on search term
  const filteredProducts =
    shop?.Products.filter(
      product =>
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.measurement_unit?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  if (isLoading || !config) {
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
          <p className="text-red-500">Error loading shop details.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  if (!shop) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Shop not found.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={shop.name}
        description={`View and manage details for ${shop.name}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" /> Import Products
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-1/2">
            <TabsTrigger value="info">Shop Info</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category:</p>
                      <p>{shop.category?.name || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status:</p>
                      <p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shop.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Products:</p>
                      <p>{shop.Products_aggregate.aggregate.count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orders:</p>
                      <p>{shop.Orders_aggregate.aggregate.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address:</p>
                    <p>{shop.address || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Opening Hours:</p>
                    {formatOperatingHours(shop.operating_hours)}
                  </div>
                  {shop.latitude && shop.longitude && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location:</p>
                      <p>
                        {shop.latitude}, {shop.longitude}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {shop.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About the Shop</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{shop.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4 pt-4">
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
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.price, config)}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{product.measurement_unit}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
          </TabsContent>

          <TabsContent value="orders" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Orders feature coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Analytics feature coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onSubmit={handleAddProduct}
        shopId={id}
      />

      <ImportProductsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSubmit={handleImportProducts}
      />
    </AdminLayout>
  );
};

export default ShopDetail;
