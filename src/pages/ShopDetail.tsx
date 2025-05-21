
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileUp } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import AddProductDialog from "@/components/shop/AddProductDialog";
import ImportProductsDialog from "@/components/shop/ImportProductsDialog";
import { toast } from "sonner";

const ShopDetail = () => {
  const { id } = useParams();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Mock shop data - in a real app, you would fetch this from an API
  const shopData = {
    id: Number(id),
    name: id === "1" ? "Fresh Groceries" : id === "2" ? "Quick Mart" : id === "3" ? "Healthy Options" : id === "4" ? "City Pharmacy" : "Pet Supplies Co.",
    category: id === "1" ? "Grocery" : id === "2" ? "Convenience" : id === "3" ? "Health Food" : id === "4" ? "Pharmacy" : "Pet Store",
    description: "A premium shop offering high quality products to customers across the city.",
    address: "123 Market Street, Downtown",
    phone: "+1 (555) 123-4567",
    email: "contact@example.com",
    website: "www.example.com",
    openingHours: "9:00 AM - 9:00 PM",
    rating: 4.8,
    products: 156,
    orders: 532,
    status: "Active",
  };

  // Mock product data
  const products = [
    { id: 1, name: "Organic Apples", category: "Fruits", price: "$3.99", stock: 120, status: "In Stock" },
    { id: 2, name: "Whole Grain Bread", category: "Bakery", price: "$4.50", stock: 45, status: "In Stock" },
    { id: 3, name: "Free Range Eggs", category: "Dairy", price: "$5.99", stock: 60, status: "In Stock" },
    { id: 4, name: "Almond Milk", category: "Dairy", price: "$3.99", stock: 35, status: "In Stock" },
    { id: 5, name: "Organic Spinach", category: "Vegetables", price: "$2.99", stock: 80, status: "In Stock" },
  ];

  const handleAddProduct = (formData) => {
    console.log("Adding product:", formData);
    toast.success("Product added successfully");
    setIsAddProductOpen(false);
  };

  const handleImportProducts = (file) => {
    console.log("Importing products from file:", file);
    toast.success("Products imported successfully");
    setIsImportOpen(false);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title={shopData.name} 
        description={`View and manage details for ${shopData.name}`}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)} className="flex items-center gap-2">
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
                      <p>{shopData.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status:</p>
                      <p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          shopData.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {shopData.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rating:</p>
                      <p>⭐ {shopData.rating}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Products:</p>
                      <p>{shopData.products}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orders:</p>
                      <p>{shopData.orders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address:</p>
                    <p>{shopData.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone:</p>
                    <p>{shopData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email:</p>
                    <p>{shopData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Website:</p>
                    <p>{shopData.website}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Opening Hours:</p>
                    <p>{shopData.openingHours}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>About the Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{shopData.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-8" />
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
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === "In Stock" ? "bg-green-100 text-green-800" : 
                          product.status === "Low Stock" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {product.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders" className="pt-4">
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">Orders details will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="pt-4">
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">Shop analytics will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddProductDialog 
        open={isAddProductOpen} 
        onOpenChange={setIsAddProductOpen}
        onSubmit={handleAddProduct}
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
