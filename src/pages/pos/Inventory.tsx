
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Filter, Plus, Edit, Trash, Import, Download } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import AddProductDialog from "@/components/shop/AddProductDialog";
import ImportProductsDialog from "@/components/shop/ImportProductsDialog";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  stock: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([
    { id: "1", name: "Milk 1L", barcode: "5901234123457", category: "Dairy", price: 2.99, stock: 25, status: "in-stock" },
    { id: "2", name: "Bread", barcode: "4003994155486", category: "Bakery", price: 1.50, stock: 12, status: "in-stock" },
    { id: "3", name: "Eggs (12)", barcode: "0012000811331", category: "Dairy", price: 3.49, stock: 6, status: "low-stock" },
    { id: "4", name: "Apples (1kg)", barcode: "7622210101266", category: "Produce", price: 4.99, stock: 18, status: "in-stock" },
    { id: "5", name: "Chicken Breast (500g)", barcode: "5449000000996", category: "Meat", price: 6.75, stock: 0, status: "out-of-stock" },
    { id: "6", name: "Rice (2kg)", barcode: "7318690102205", category: "Grocery", price: 5.25, stock: 8, status: "low-stock" },
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [stockStatus, setStockStatus] = useState<string | undefined>(undefined);
  
  // Dialog states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  const filteredItems = items.filter(item => {
    return (
      (searchTerm === "" || 
       item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.barcode.includes(searchTerm)) &&
      (category === undefined || item.category === category) &&
      (stockStatus === undefined || item.status === stockStatus)
    );
  });
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "in-stock":
        return <Badge className="bg-green-500">In Stock</Badge>;
      case "low-stock":
        return <Badge className="bg-yellow-500">Low Stock</Badge>;
      case "out-of-stock":
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
      status: parseInt(values.stock) > 10 ? "in-stock" : parseInt(values.stock) > 0 ? "low-stock" : "out-of-stock"
    };
    
    setItems([...items, newItem]);
    setIsAddProductOpen(false);
    toast.success("Product added successfully");
  };
  
  const handleImportFile = (file: File) => {
    // In a real application, this would process the Excel/CSV file
    console.log("Importing file:", file.name);
    
    // Simulate processing delay
    setTimeout(() => {
      toast.success(`Successfully imported products from ${file.name}`);
      setIsImportOpen(false);
    }, 1500);
  };
  
  const handleExportTemplate = () => {
    // In a real application, this would generate and download an Excel template
    toast.success("Template downloaded successfully");
  };
  
  return (
    <AdminLayout>
      <PageHeader 
        title="POS Inventory" 
        description="Manage inventory levels and product information"
        icon={<ShoppingBag className="h-6 w-6" />}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Import className="mr-2 h-4 w-4" />
              Import Products
            </Button>
            <Button variant="outline" onClick={handleExportTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Export Template
            </Button>
            <Button onClick={() => setIsAddProductOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All Status</SelectItem>
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
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.stock}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </AdminLayout>
  );
};

export default Inventory;
