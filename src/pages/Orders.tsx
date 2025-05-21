
import React from "react";
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

const Orders = () => {
  const orders = [
    { id: "#ORD-1234", customer: "John Doe", date: "2023-05-20", total: "$45.20", status: "Delivered" },
    { id: "#ORD-1235", customer: "Jane Smith", date: "2023-05-20", total: "$22.50", status: "In Progress" },
    { id: "#ORD-1236", customer: "Mike Johnson", date: "2023-05-20", total: "$78.00", status: "Pending" },
    { id: "#ORD-1237", customer: "Sarah Williams", date: "2023-05-19", total: "$34.75", status: "Delivered" },
    { id: "#ORD-1238", customer: "Robert Brown", date: "2023-05-19", total: "$56.30", status: "Cancelled" },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Orders" 
        description="Manage and track all customer orders."
        action={<Button>Export Data</Button>}
      />
      
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
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.total}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "Delivered" ? "bg-green-100 text-green-800" :
                      order.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                      order.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
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

export default Orders;
