
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
import { Search, Filter, Package } from "lucide-react";
import OrderDetailDialog, { OrderDetails } from "@/components/order/OrderDetailDialog";

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sample orders data with more supermarket-specific details
  const orders = [
    { 
      id: "#ORD-1234", 
      customer: "John Doe", 
      date: "2023-05-20", 
      total: "$45.20", 
      status: "Delivered",
      address: "123 Main St, New York, NY 10001",
      phone: "(555) 123-4567",
      email: "john.doe@example.com",
      paymentMethod: "Credit Card",
      items: [
        { id: "item-1", name: "Organic Apples (2kg)", quantity: 2, price: "$5.99" },
        { id: "item-2", name: "Whole Grain Bread", quantity: 1, price: "$3.49" },
        { id: "item-3", name: "Free Range Eggs (12pk)", quantity: 1, price: "$4.99" },
        { id: "item-4", name: "Fresh Orange Juice (1L)", quantity: 2, price: "$3.99" },
      ]
    },
    { 
      id: "#ORD-1235", 
      customer: "Jane Smith", 
      date: "2023-05-20", 
      total: "$22.50", 
      status: "In Progress",
      address: "456 Oak Ave, Boston, MA 02108",
      phone: "(555) 234-5678",
      email: "jane.smith@example.com",
      paymentMethod: "PayPal",
      items: [
        { id: "item-4", name: "Almond Milk (1L)", quantity: 2, price: "$3.99" },
        { id: "item-5", name: "Protein Bars (Box of 6)", quantity: 3, price: "$2.49" },
        { id: "item-6", name: "Baby Formula (900g)", quantity: 1, price: "$24.99" },
      ]
    },
    { 
      id: "#ORD-1236", 
      customer: "Mike Johnson", 
      date: "2023-05-20", 
      total: "$78.00", 
      status: "Pending",
      address: "789 Pine Rd, Chicago, IL 60007",
      phone: "(555) 345-6789",
      email: "mike.johnson@example.com",
      paymentMethod: "Cash on Delivery",
      items: [
        { id: "item-6", name: "Fresh Salmon Fillet (500g)", quantity: 1, price: "$15.99" },
        { id: "item-7", name: "Organic Vegetables Bundle", quantity: 1, price: "$12.50" },
        { id: "item-8", name: "Red Wine (Cabernet)", quantity: 2, price: "$24.99" },
        { id: "item-9", name: "Dishwashing Liquid", quantity: 1, price: "$3.49" },
      ]
    },
    { 
      id: "#ORD-1237", 
      customer: "Sarah Williams", 
      date: "2023-05-19", 
      total: "$34.75", 
      status: "Delivered",
      address: "101 Maple St, Austin, TX 78701",
      phone: "(555) 456-7890",
      email: "sarah.williams@example.com",
      paymentMethod: "Credit Card",
      items: [
        { id: "item-9", name: "Laundry Detergent (2L)", quantity: 1, price: "$12.99" },
        { id: "item-10", name: "Paper Towels (8 rolls)", quantity: 1, price: "$8.76" },
        { id: "item-11", name: "Toilet Paper (12 rolls)", quantity: 1, price: "$10.99" },
        { id: "item-12", name: "Hand Soap", quantity: 2, price: "$2.99" },
      ]
    },
    { 
      id: "#ORD-1238", 
      customer: "Robert Brown", 
      date: "2023-05-19", 
      total: "$56.30", 
      status: "Cancelled",
      address: "202 Elm Dr, Seattle, WA 98101",
      phone: "(555) 567-8901",
      email: "robert.brown@example.com",
      paymentMethod: "Debit Card",
      items: [
        { id: "item-11", name: "Coffee Beans (Premium, 500g)", quantity: 2, price: "$12.99" },
        { id: "item-12", name: "Coffee Grinder", quantity: 1, price: "$30.32" },
        { id: "item-13", name: "French Press", quantity: 1, price: "$15.99" },
      ]
    },
    { 
      id: "#ORD-1239", 
      customer: "Emily Johnson", 
      date: "2023-05-18", 
      total: "$125.60", 
      status: "Delivered",
      address: "303 Birch Blvd, Denver, CO 80201",
      phone: "(555) 678-9012",
      email: "emily.johnson@example.com",
      paymentMethod: "Credit Card",
      items: [
        { id: "item-14", name: "Rice Cooker", quantity: 1, price: "$49.99" },
        { id: "item-15", name: "Jasmine Rice (5kg)", quantity: 1, price: "$18.49" },
        { id: "item-16", name: "Soy Sauce (500ml)", quantity: 2, price: "$4.99" },
        { id: "item-17", name: "Mixed Spices Set", quantity: 1, price: "$22.99" },
        { id: "item-18", name: "Cooking Oil (2L)", quantity: 1, price: "$8.99" },
        { id: "item-19", name: "Coconut Milk (400ml)", quantity: 3, price: "$2.49" },
      ]
    },
  ];

  const handleViewOrder = (order: OrderDetails) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Orders" 
        description="Manage and track all supermarket orders and deliveries."
        icon={<Package className="h-6 w-6" />}
        actions={<Button>Export Data</Button>}
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders by ID, customer name or products..." className="pl-8" />
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <OrderDetailDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        order={selectedOrder}
      />
    </AdminLayout>
  );
};

export default Orders;
