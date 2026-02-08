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
import { Search, Filter, ScanBarcode, Loader2, Plus, Upload, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  useProducts,
  useProductNamesFromApi,
  useAddProduct,
  useAddProductName,
  useUpdateProductName,
  useSystemConfig,
} from '@/hooks/useHasuraApi';
import Pagination from '@/components/ui/pagination';
import AddProductDialog from '@/components/shop/AddProductDialog';
import {
  ProductNameFormDialog,
  type ProductNameRow,
} from '@/components/shop/ProductNameFormDialog';
import { ImportProductNamesDialog } from '@/components/shop/ImportProductNamesDialog';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/components/layout/RootLayout';
import { format } from 'date-fns';

const PRODUCT_PLACEHOLDER = '/placeholder.svg';

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(() =>
    src && src.trim() !== '' ? src : PRODUCT_PLACEHOLDER
  );
  return (
    <img
      src={imgSrc}
      alt={alt}
      className="h-10 w-10 rounded-md object-cover bg-muted"
      onError={() => setImgSrc(PRODUCT_PLACEHOLDER)}
    />
  );
}

const Products = () => {
  const { session } = useAuth();
  const isProjectUser = session?.isProjectUser === true;

  const productsQuery = useProducts(!isProjectUser);
  const productNamesQuery = useProductNamesFromApi(isProjectUser);

  const productsData = productsQuery.data;
  const productNamesData = productNamesQuery.data;
  const data = isProjectUser ? productNamesData : productsData;
  const isLoading = isProjectUser ? productNamesQuery.isLoading : productsQuery.isLoading;
  const isError = isProjectUser ? productNamesQuery.isError : productsQuery.isError;
  const error = isProjectUser ? productNamesQuery.error : productsQuery.error;
  const refetch = isProjectUser ? productNamesQuery.refetch : productsQuery.refetch;

  const { data: systemConfig } = useSystemConfig();
  const products = (productsData?.Products ?? []) as any[];
  const productNames = productNamesData?.productNames ?? [];
  const addProduct = useAddProduct();
  const addProductName = useAddProductName();
  const updateProductName = useUpdateProductName();
  const { hasAction } = usePrivilege();

  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  // Project user: product name catalog add/edit/import
  const [editProductName, setEditProductName] = useState<ProductNameRow | null>(null);
  const [isAddProductNameOpen, setIsAddProductNameOpen] = useState(false);
  const [isImportProductNamesOpen, setIsImportProductNamesOpen] = useState(false);

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

  const handleAddOrEditProductName = async (data: {
    name: string;
    description?: string;
    barcode?: string;
    sku?: string;
    image?: string;
  }) => {
    try {
      if (editProductName) {
        await updateProductName.mutateAsync({
          id: editProductName.id,
          name: data.name,
          description: data.description ?? undefined,
          barcode: data.barcode ?? undefined,
          sku: data.sku ?? undefined,
          image: data.image ?? undefined,
        });
        toast.success('Product name updated.');
      } else {
        await addProductName.mutateAsync({
          name: data.name,
          description: data.description ?? undefined,
          barcode: data.barcode ?? undefined,
          sku: data.sku ?? undefined,
          image: data.image ?? undefined,
        });
        toast.success('Product name added.');
      }
      setEditProductName(null);
      setIsAddProductNameOpen(false);
      productNamesQuery.refetch();
    } catch (err) {
      console.error(err);
      toast.error(editProductName ? 'Failed to update product name.' : 'Failed to add product name.');
      throw err;
    }
  };

  const handleImportProductNames = async (
    rows: { name: string; description?: string; barcode?: string; sku?: string; image?: string }[],
    onProgress?: (current: number, total: number) => void
  ) => {
    const total = rows.length;
    let imported = 0;
    let skipped = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await addProductName.mutateAsync({
          name: row.name,
          description: row.description ?? undefined,
          barcode: row.barcode ?? undefined,
          sku: row.sku ?? undefined,
          image: row.image ?? undefined,
        });
        imported++;
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        const isDuplicate =
          /uniqueness violation|duplicate key|productNames_name_key|unique constraint/i.test(msg);
        if (isDuplicate) {
          skipped++;
        } else {
          console.error(err);
          toast.error(`Import failed at row ${i + 1}: ${msg}`);
          throw err;
        }
      }
      onProgress?.(i + 1, total);
    }
    if (skipped > 0) {
      toast.success(`Imported ${imported} product name(s), skipped ${skipped} duplicate(s).`);
    } else {
      toast.success(`Imported ${imported} product name(s).`);
    }
    setIsImportProductNamesOpen(false);
    productNamesQuery.refetch();
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
          <p className="text-red-500">
            {isProjectUser ? 'Error loading product catalog.' : 'Error loading products.'}
          </p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  // Project user: catalog view (productNames only)
  if (isProjectUser) {
    const filtered = productNames.filter(
      pn =>
        searchTerm === '' ||
        pn.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pn.barcode ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pn.sku ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pn.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentRows = filtered.slice(startIndex, startIndex + pageSize);

    return (
      <AdminLayout>
        <PageHeader
          title="Products"
          description="Product catalog (all product names)."
          actions={
            <>
              <Button
                onClick={() => {
                  setEditProductName(null);
                  setIsAddProductNameOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add product name
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsImportProductNamesOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" /> Import
              </Button>
            </>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{productNames.length}</div>
              <p className="text-muted-foreground">Total product names</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, barcode, SKU..."
              className="pl-8"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No product names found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRows.map(pn => (
                    <TableRow key={pn.id}>
                      <TableCell>
                        <ProductImage
                          src={pn.image && pn.image.trim() !== '' ? pn.image : PRODUCT_PLACEHOLDER}
                          alt={pn.name || 'Product'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pn.name || '—'}</TableCell>
                      <TableCell>{pn.barcode ?? '—'}</TableCell>
                      <TableCell>{pn.sku ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {pn.description ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {pn.create_at
                          ? format(new Date(pn.create_at), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditProductName(pn as ProductNameRow);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
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
                setCurrentPage(1);
              }}
              totalItems={totalItems}
            />
          </Card>
        </div>

        <ProductNameFormDialog
          open={isAddProductNameOpen || !!editProductName}
          onOpenChange={open => {
            if (!open) {
              setIsAddProductNameOpen(false);
              setEditProductName(null);
            }
          }}
          onSubmit={handleAddOrEditProductName}
          initialValues={editProductName}
          isLoading={addProductName.isPending || updateProductName.isPending}
        />
        <ImportProductNamesDialog
          open={isImportProductNamesOpen}
          onOpenChange={setIsImportProductNamesOpen}
          onImport={handleImportProductNames}
          isLoading={addProductName.isPending}
        />
      </AdminLayout>
    );
  }

  // Org employee: full products table (from Products table with shop, prices, stock)
  const activeProducts = products.filter((p: any) => p.is_active);
  const lowStockProducts = products.filter((p: any) => p.quantity <= 10 && p.quantity > 0);
  const outOfStockProducts = products.filter((p: any) => p.quantity <= 0);
  const filteredProducts = products.filter(
    (product: any) =>
      searchTerm === '' ||
      product.ProductName?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
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
                setCurrentPage(1);
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
                <TableHead className="w-[60px]">Image</TableHead>
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
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                currentProducts.map((product: any) => {
                  const stockStatus = getStockStatus(product.quantity);
                  const imageUrl =
                    product.image ||
                    product.ProductName?.image ||
                    PRODUCT_PLACEHOLDER;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <ProductImage src={imageUrl} alt={product.ProductName?.name || 'Product'} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.ProductName?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{product.Shop?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {typeof product.category === 'string'
                          ? product.category
                          : product.category?.name || 'N/A'}
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
              setCurrentPage(1);
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
