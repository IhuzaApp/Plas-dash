import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Loader2,
  Package,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Plus,
  FileUp,
  Users,
  Edit,
  Trash2,
  UserX,
  Store,
  Image as ImageIcon,
} from 'lucide-react';
import {
  useShopById,
  useReelOrders,
  useAddProduct,
  useAddProductName,
  useUpdateProduct,
  useSystemConfig,
  useEmployeesByShop,
  useAddEmployee,
  useAddEmployeeRole,
  useUpdateEmployee,
  useUpdateEmployeeRole,
  useDeleteEmployee,
  OrgEmployee,
} from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { z } from 'zod';
import AddProductDialog from '@/components/shop/AddProductDialog';
import ImportProductsDialog from '@/components/shop/ImportProductsDialog';
import EditProductDialog from '@/components/shop/EditProductDialog';
import AddStaffDialog from '@/components/shop/AddStaffDialog';
import EditStaffDialog from '@/components/shop/EditStaffDialog';
import ShopPerformanceCharts from '@/components/shop/ShopPerformanceCharts';
import { toast } from 'sonner';
import { formatCurrency, formatCurrencyWithConfig } from '@/lib/utils';
import { hasuraRequest } from '@/lib/hasura';
import { convertPrivilegesToOldFormat } from '@/lib/privileges';
import { usePrivilege } from '@/hooks/usePrivilege';

// Helper function to get GraphQL type for each field
function getGraphQLType(fieldName: string): string {
  switch (fieldName) {
    case 'id':
      return 'uuid!';
    case 'active':
      return 'Boolean';
    case 'fullnames':
    case 'email':
    case 'phone':
    case 'Address':
    case 'Position':
    case 'roleType':
      return 'String';
    default:
      return 'String';
  }
}

interface OperatingHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

function OpeningHoursCalendar({ hours }: { hours: OperatingHours | string | null }) {
  if (!hours) {
    return <p className="text-sm text-muted-foreground">Not specified</p>;
  }
  if (typeof hours === 'string') {
    return <p className="text-sm">{hours}</p>;
  }
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr] bg-muted/50">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-r border-border">
          Day
        </div>
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          Hours
        </div>
      </div>
      {DAY_ORDER.map(day => (
        <div
          key={day}
          className="grid grid-cols-[1fr_1fr] border-b border-border last:border-b-0 odd:bg-muted/20"
        >
          <div className="px-3 py-2.5 text-sm font-medium capitalize">{day}</div>
          <div className="px-3 py-2.5 text-sm text-muted-foreground">
            {(hours as Record<string, string>)[day]?.trim() || 'Closed'}
          </div>
        </div>
      ))}
    </div>
  );
}

const productFormSchema = z.object({
  productName_id: z.string().optional(),
  productNameData: z
    .object({
      name: z.string().min(1, 'Product name is required'),
      description: z.string().optional(),
      barcode: z.string().optional(),
      sku: z.string().optional(),
      image: z.string().optional(),
    })
    .optional(),
  price: z.string().min(1, 'Price is required'),
  quantity: z.number().int().min(0, 'Quantity must be a positive number'),
  measurement_unit: z.string().min(1, 'Measurement unit is required'),
  category: z.string().min(1, 'Category is required'),
  is_active: z.boolean().default(true),
  sku: z.string().optional(),
  supplier: z.string().optional(),
  reorder_point: z.number().int().min(0).optional(),
  image: z.string().optional(),
  final_price: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

const ShopDetail = () => {
  const params = useParams();
  const id = params?.id?.toString() || '';
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Staff management state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<OrgEmployee | null>(null);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(10);

  const { data, isLoading, isError, error, refetch } = useShopById(id);
  const shop = data?.Shops_by_pk;

  // Extract subscription module slugs directly from the shop query result
  const planModuleSlugs = useMemo(() => {
    const sub = (shop as any)?.shop_subscription;
    if (!sub?.plan?.plan_modules) return undefined;
    return (sub.plan.plan_modules as { module: { slug: string } }[])
      .map(pm => pm.module?.slug)
      .filter(Boolean) as string[];
  }, [shop]);

  const { data: reelOrdersData } = useReelOrders();
  const shopReelOrders = useMemo(() => {
    const list = (reelOrdersData?.reel_orders ?? []) as {
      id: string;
      status: string;
      total: string;
      created_at: string;
      Shop?: { id?: string };
      Reel?: { shop_id?: string };
    }[];
    return list
      .filter(o => o.Shop?.id === id || o.Reel?.shop_id === id)
      .map(o => ({ id: o.id, status: o.status, total: o.total, created_at: o.created_at }));
  }, [reelOrdersData?.reel_orders, id]);

  const addProduct = useAddProduct();
  const addProductName = useAddProductName();
  const updateProduct = useUpdateProduct();
  const { data: configData } = useSystemConfig();
  const config = configData?.System_configuratioins[0];
  const { hasAction } = usePrivilege();

  // Staff management hooks
  const { data: employeesData, refetch: refetchEmployees } = useEmployeesByShop(id);
  const addEmployee = useAddEmployee();
  const addEmployeeRole = useAddEmployeeRole();
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeRole = useUpdateEmployeeRole();
  const deleteEmployee = useDeleteEmployee();

  const handleAddProduct = async (formData: ProductFormData) => {
    try {
      // First, create or find the ProductName
      let productNameId = formData.productName_id;

      // If we don't have a productName_id but have productNameData, create the product name first
      if (!productNameId && formData.productNameData) {
        const productNameResult = await addProductName.mutateAsync(formData.productNameData);
        productNameId = productNameResult.insert_productNames_one.id;
      }

      // Ensure we have a valid productNameId
      if (!productNameId) {
        throw new Error('Product name is required');
      }

      // Then create the Product with the productName_id
      const productData = {
        productName_id: productNameId,
        price: formData.price,
        quantity: formData.quantity,
        measurement_unit: formData.measurement_unit,
        shop_id: id,
        category: formData.category,
        reorder_point: formData.reorder_point,
        supplier: formData.supplier,
        is_active: formData.is_active,
        final_price: formData.final_price || formData.price, // Use price as fallback
      };

      await addProduct.mutateAsync(productData);

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

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = async (formData: any) => {
    try {
      // Only update Product fields, not ProductName fields
      const updateData = {
        id: selectedProduct.id,
        price: formData.price,
        quantity: formData.quantity,
        measurement_unit: formData.measurement_unit,
        final_price: formData.final_price || formData.price,
        supplier: formData.supplier,
        reorder_point: formData.reorder_point,
      };

      // Call the update mutation
      await updateProduct.mutateAsync(updateData);

      toast.success('Product updated successfully!');
      setIsEditProductOpen(false);
      setSelectedProduct(null);
      refetch(); // Refresh the shop data to show the updated product
    } catch (error) {
      toast.error('Failed to update product');
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (confirm('Are you sure you want to deactivate this product?')) {
      try {
        // Use soft delete by setting is_active to false
        const softDeleteMutation = `
          mutation SoftDeleteProduct($id: uuid!) {
            update_Products_by_pk(
              pk_columns: { id: $id }
              _set: { is_active: false, updated_at: "now()" }
            ) {
              id
              is_active
            }
          }
        `;

        await hasuraRequest(softDeleteMutation, { id: product.id });

        toast.success('Product deactivated successfully');
        refetch(); // Refresh the shop data
      } catch (error) {
        console.error('Error deactivating product:', error);
        toast.error('Failed to deactivate product. Please try again.');
      }
    }
  };

  // Filter products based on search term
  const filteredProducts =
    shop?.Products.filter(product => {
      if (searchTerm === '') return true;
      const term = searchTerm.toLowerCase();
      const name = product.ProductName?.name?.toLowerCase() ?? '';
      const sku = (product.ProductName?.sku ?? (product as { sku?: string }).sku ?? '')
        .toString()
        .toLowerCase();
      const barcode = (
        product.ProductName?.barcode ??
        (product as { barcode?: string }).barcode ??
        ''
      )
        .toString()
        .toLowerCase();
      const unit = product.measurement_unit?.toLowerCase() ?? '';
      return (
        name.includes(term) || sku.includes(term) || barcode.includes(term) || unit.includes(term)
      );
    }) ?? [];

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Staff management handlers
  const handleAddStaff = async (data: {
    employee: {
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      gender: string;
      Position: string;
      password: string;
      roleType: string;
    };
    privileges: any; // Changed from permissions: string[] to privileges: UserPrivileges
  }) => {
    try {
      // Add employee
      const result = await addEmployee.mutateAsync({
        ...data.employee,
        shop_id: id,
      });

      // Convert new privilege format to old string format for database
      const oldFormatPermissions = convertPrivilegesToOldFormat(data.privileges);

      // Add employee role
      if (result.insert_orgEmployees.returning[0]) {
        await addEmployeeRole.mutateAsync({
          orgEmployeeID: result.insert_orgEmployees.returning[0].id,
          privillages: oldFormatPermissions,
        });
      }

      toast.success('Staff member added successfully');
      setIsAddStaffOpen(false);
      refetchEmployees();
    } catch (error) {
      console.error('Error adding staff member:', error);
      toast.error('Failed to add staff member. Please try again.');
    }
  };

  const handleEditStaff = (employee: OrgEmployee) => {
    setSelectedEmployee(employee);
    setIsEditStaffOpen(true);
  };

  const handleUpdateStaff = async (data: {
    id: string;
    employee: Partial<{
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      Position: string;
      roleType: string;
      active: boolean;
    }>;
    privileges: any; // Changed from permissions: string[] to privileges: UserPrivileges
  }) => {
    try {
      // Only update employee if there are changes
      if (Object.keys(data.employee).length > 0) {
        // Create dynamic mutation that only sets provided fields
        const setFields = Object.keys(data.employee)
          .map(key => `${key}: $${key}`)
          .join(', ');
        const variables = Object.keys(data.employee)
          .map(key => `$${key}: ${getGraphQLType(key)}`)
          .join(', ');

        const dynamicMutation = `
          mutation UpdateOrgEmployee($id: uuid!, ${variables}) {
            update_orgEmployees(where: {id: {_eq: $id}}, _set: {${setFields}}) {
              affected_rows
            }
          }
        `;

        await hasuraRequest(dynamicMutation, { id: data.id, ...data.employee });
      }

      // Convert new privilege format to old string format for database
      const oldFormatPermissions = convertPrivilegesToOldFormat(data.privileges);

      // Always update employee role (permissions might have changed)
      await updateEmployeeRole.mutateAsync({
        id: data.id,
        privillages: oldFormatPermissions,
      });

      toast.success('Staff member updated successfully');
      setIsEditStaffOpen(false);
      setSelectedEmployee(null);
      refetchEmployees();
    } catch (error) {
      console.error('Error updating staff member:', error);
      toast.error('Failed to update staff member. Please try again.');
    }
  };

  const handleDeleteStaff = async (employeeId: string) => {
    if (
      confirm(
        'Are you sure you want to deactivate this staff member? They will no longer be able to access the system.'
      )
    ) {
      try {
        // Use soft delete by setting active to false
        const softDeleteMutation = `
          mutation SoftDeleteOrgEmployee($id: uuid!) {
            update_orgEmployees(where: {id: {_eq: $id}}, _set: {active: false}) {
              affected_rows
            }
          }
        `;

        await hasuraRequest(softDeleteMutation, { id: employeeId });

        toast.success('Staff member deactivated successfully');
        refetchEmployees();
      } catch (error) {
        console.error('Error deactivating staff member:', error);
        toast.error('Failed to deactivate staff member. Please try again.');
      }
    }
  };

  // Filter staff based on search term
  const filteredStaff =
    employeesData?.orgEmployees.filter(
      employee =>
        staffSearchTerm === '' ||
        employee.fullnames.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        employee.phone.includes(staffSearchTerm)
    ) || [];

  // Calculate staff pagination
  const totalStaffItems = filteredStaff.length;
  const totalStaffPages = Math.ceil(totalStaffItems / staffPageSize);
  const staffStartIndex = (staffCurrentPage - 1) * staffPageSize;
  const staffEndIndex = staffStartIndex + staffPageSize;
  const currentStaff = filteredStaff.slice(staffStartIndex, staffEndIndex);

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
        description={`${shop.category?.name || 'Uncategorized'} • ${shop.is_active ? 'Active' : 'Inactive'}`}
        icon={
          <div className="h-12 w-12 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={`${shop.name} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <Store className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            {hasAction('products', 'add_products') && (
              <Button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            )}
            {hasAction('products', 'import_products') && (
              <Button
                variant="outline"
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-2"
              >
                <FileUp className="h-4 w-4" /> Import Products
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-3/4">
            <TabsTrigger value="info">Shop Info</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
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
                  <CardTitle>Contact & business information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-sm">{shop.address ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm">
                        {String(
                          (shop as unknown as Record<string, unknown>).phone ?? shop.phone ?? ''
                        ).trim() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">TIN number</p>
                      <p className="text-sm font-mono">
                        {String(
                          (shop as unknown as Record<string, unknown>).tin ?? shop.tin ?? ''
                        ).trim() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">SSD</p>
                      <p className="text-sm">
                        {String(
                          (shop as unknown as Record<string, unknown>).ssd ?? shop.ssd ?? ''
                        ).trim() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Related to</p>
                      <p className="text-sm">
                        {String(
                          (shop as unknown as Record<string, unknown>).relatedTo ??
                            shop.relatedTo ??
                            ''
                        ).trim() || '—'}
                      </p>
                    </div>
                    {shop.latitude != null &&
                      shop.longitude != null &&
                      (shop.latitude || shop.longitude) && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                          <p className="text-sm font-mono text-muted-foreground">
                            {shop.latitude}, {shop.longitude}
                          </p>
                        </div>
                      )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Opening hours</p>
                    <OpeningHoursCalendar
                      hours={shop.operating_hours as OperatingHours | string | null}
                    />
                  </div>
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
                    <TableHead className="w-[72px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Final Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentProducts.map(product => {
                      const imageUrl =
                        product.ProductName?.image ?? (product as { image?: string }).image;
                      const sku =
                        product.ProductName?.sku ?? (product as { sku?: string }).sku ?? '—';
                      const barcode =
                        product.ProductName?.barcode ??
                        (product as { barcode?: string }).barcode ??
                        '—';
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="h-12 w-12 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`${product.ProductName?.name || 'Product'} image`}
                                  className="h-full w-full object-cover"
                                  title={product.ProductName?.name || 'Product'}
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.ProductName?.name || 'Unknown Product'}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {sku}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {barcode}
                          </TableCell>
                          <TableCell>{formatCurrencyWithConfig(product.price, config)}</TableCell>
                          <TableCell>
                            {formatCurrencyWithConfig(product.final_price, config)}
                          </TableCell>
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
                            {hasAction('products', 'edit_products') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                Edit
                              </Button>
                            )}
                            {hasAction('products', 'delete_products') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
                                className="text-orange-600 hover:text-orange-700"
                                title="Deactivate product"
                              >
                                <Trash2 className="h-4 w-4" />
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
          </TabsContent>

          <TabsContent value="orders" className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search orders..." className="pl-8" />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shop?.Orders && shop.Orders.length > 0 ? (
                      shop.Orders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />#{order.OrderID}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{order.orderedBy?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.orderedBy?.email || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.Order_Items?.length || 0} items</TableCell>
                          <TableCell>{formatCurrencyWithConfig(order.total, config)}</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No orders found for this shop.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff members..."
                    className="pl-8"
                    value={staffSearchTerm}
                    onChange={e => {
                      setStaffSearchTerm(e.target.value);
                      setStaffCurrentPage(1);
                    }}
                  />
                </div>
                <Button onClick={() => setIsAddStaffOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Staff
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No staff members found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentStaff.map(employee => {
                        const permissions =
                          Array.isArray(employee.orgEmployeeRoles) && employee.orgEmployeeRoles[0]
                            ? employee.orgEmployeeRoles[0].privillages || []
                            : [];
                        let roleBadge = employee.roleType || 'Custom';
                        let roleVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
                          'outline';

                        if (permissions.includes('globalAdmin')) {
                          roleBadge = 'Global Admin';
                          roleVariant = 'destructive';
                        } else if (permissions.includes('systemAdmin')) {
                          roleBadge = 'System Admin';
                          roleVariant = 'default';
                        } else if (employee.roleType === 'basicAdmin') {
                          roleBadge = 'Basic Admin';
                          roleVariant = 'secondary';
                        }

                        return (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {employee.fullnames}
                              </div>
                            </TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{employee.phone}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {employee.Position}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={roleVariant}>{roleBadge}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={employee.active ? 'default' : 'secondary'}
                                className={
                                  employee.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {employee.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(employee.created_on), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStaff(employee)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStaff(employee.id)}
                                  className="text-orange-600 hover:text-orange-700"
                                  title="Deactivate staff member"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={staffCurrentPage}
                  totalPages={totalStaffPages}
                  pageSize={staffPageSize}
                  onPageChange={setStaffCurrentPage}
                  onPageSizeChange={size => {
                    setStaffPageSize(size);
                    setStaffCurrentPage(1);
                  }}
                  totalItems={totalStaffItems}
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="pt-4">
            <ShopPerformanceCharts shop={shop} reelOrders={shopReelOrders} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onSubmit={handleAddProduct}
        shopId={id}
        isLoading={addProduct.isPending}
      />

      <ImportProductsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSubmit={handleImportProducts}
      />

      <EditProductDialog
        open={isEditProductOpen}
        onOpenChange={setIsEditProductOpen}
        onSubmit={handleUpdateProduct}
        product={selectedProduct}
        isLoading={updateProduct.isPending}
      />

      <AddStaffDialog
        open={isAddStaffOpen}
        onOpenChange={setIsAddStaffOpen}
        onSubmit={handleAddStaff}
        shopId={id}
        planModuleSlugs={planModuleSlugs}
      />

      <EditStaffDialog
        open={isEditStaffOpen}
        onOpenChange={setIsEditStaffOpen}
        onSubmit={handleUpdateStaff}
        employee={selectedEmployee}
        planModuleSlugs={planModuleSlugs}
      />
    </AdminLayout>
  );
};

export default ShopDetail;
