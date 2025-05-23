
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Search, Filter, ScanBarcode } from "lucide-react";
import { toast } from "sonner";

const Products = () => {
  const [products, setProducts] = useState([
    { id: 1, name: "Organic Apples", shop: "Fresh Groceries", category: "Fruits", price: "$3.99", stock: 120, status: "In Stock" },
    { id: 2, name: "Whole Grain Bread", shop: "Healthy Options", category: "Bakery", price: "$4.50", stock: 45, status: "In Stock" },
    { id: 3, name: "Free Range Eggs", shop: "Fresh Groceries", category: "Dairy", price: "$5.99", stock: 60, status: "In Stock" },
    { id: 4, name: "Vitamin C Tablets", shop: "City Pharmacy", category: "Supplements", price: "$12.99", stock: 8, status: "Low Stock" },
    { id: 5, name: "Dog Food Premium", shop: "Pet Supplies Co.", category: "Pet Food", price: "$24.99", stock: 0, status: "Out of Stock" },
  ]);
  
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const startScanning = () => {
    setIsScanning(true);
    
    // In a real application, this would activate the device camera
    // For this demo, we'll simulate a scan after a short delay
    setTimeout(() => {
      const mockBarcode = '5901234123457'; // Mock barcode
      setSearchTerm(mockBarcode);
      toast.success("Barcode scanned: " + mockBarcode);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Products" 
        description="Manage products across all shops."
        actions={<Button>Add New Product</Button>}
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={startScanning}
            disabled={isScanning}
          >
            <ScanBarcode className="h-4 w-4" /> 
            {isScanning ? "Scanning..." : "Scan Barcode"}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
        
        {isScanning && (
          <div className="p-4 text-center bg-muted rounded-md">
            <p className="text-muted-foreground">Scanning barcode... Please point your camera at a barcode.</p>
          </div>
        )}
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Shop</TableHead>
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
                  <TableCell>{product.shop}</TableCell>
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
      </div>
    </AdminLayout>
  );
};

export default Products;
