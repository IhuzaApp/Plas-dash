
import React from "react";
import { Link } from "react-router-dom";
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
import { Search, Filter } from "lucide-react";

const Shops = () => {
  const shops = [
    { id: 1, name: "Fresh Groceries", category: "Grocery", products: 156, orders: 532, rating: 4.8, status: "Active" },
    { id: 2, name: "Quick Mart", category: "Convenience", products: 89, orders: 324, rating: 4.6, status: "Active" },
    { id: 3, name: "Healthy Options", category: "Health Food", products: 210, orders: 287, rating: 4.9, status: "Active" },
    { id: 4, name: "City Pharmacy", category: "Pharmacy", products: 312, orders: 456, rating: 4.7, status: "Inactive" },
    { id: 5, name: "Pet Supplies Co.", category: "Pet Store", products: 178, orders: 201, rating: 4.5, status: "Active" },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Shops" 
        description="Manage partner shops and their products."
        action={<Button>Add New Shop</Button>}
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shops..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{shop.category}</TableCell>
                  <TableCell>{shop.products}</TableCell>
                  <TableCell>{shop.orders}</TableCell>
                  <TableCell>⭐ {shop.rating}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shop.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {shop.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/shops/${shop.id}`}>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </Link>
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

export default Shops;
