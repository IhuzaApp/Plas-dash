
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, Filter, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import OrderDetailDialog, { OrderDetails, OrderItem } from "@/components/order/OrderDetailDialog";

interface Transaction {
  id: string;
  transactionId: string;
  datetime: Date;
  amount: number;
  items: number;
  paymentMethod: "cash" | "card" | "wallet";
  status: "completed" | "refunded" | "pending";
  cashier: string;
}

const Transactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const transactions: Transaction[] = [
    { id: "1", transactionId: "TRX-20250522-001", datetime: new Date(2025, 4, 22, 9, 30), amount: 24.98, items: 5, paymentMethod: "card", status: "completed", cashier: "John Smith" },
    { id: "2", transactionId: "TRX-20250522-002", datetime: new Date(2025, 4, 22, 10, 15), amount: 12.75, items: 2, paymentMethod: "cash", status: "completed", cashier: "John Smith" },
    { id: "3", transactionId: "TRX-20250522-003", datetime: new Date(2025, 4, 22, 11, 45), amount: 47.32, items: 8, paymentMethod: "card", status: "completed", cashier: "Emma Johnson" },
    { id: "4", transactionId: "TRX-20250522-004", datetime: new Date(2025, 4, 22, 13, 20), amount: 34.50, items: 3, paymentMethod: "cash", status: "completed", cashier: "Emma Johnson" },
    { id: "5", transactionId: "TRX-20250522-005", datetime: new Date(2025, 4, 22, 14, 5), amount: 18.99, items: 1, paymentMethod: "wallet", status: "completed", cashier: "David Wilson" },
    { id: "6", transactionId: "TRX-20250522-006", datetime: new Date(2025, 4, 22, 15, 30), amount: 53.85, items: 7, paymentMethod: "card", status: "refunded", cashier: "David Wilson" },
    { id: "7", transactionId: "TRX-20250522-007", datetime: new Date(2025, 4, 22, 16, 40), amount: 29.99, items: 4, paymentMethod: "cash", status: "completed", cashier: "John Smith" },
    { id: "8", transactionId: "TRX-20250522-008", datetime: new Date(2025, 4, 22, 17, 55), amount: 42.15, items: 6, paymentMethod: "card", status: "pending", cashier: "Emma Johnson" },
  ];

  const getPaymentMethodBadge = (method: string) => {
    switch(method) {
      case "card":
        return <Badge className="bg-blue-500">Card</Badge>;
      case "cash":
        return <Badge className="bg-green-500">Cash</Badge>;
      case "wallet":
        return <Badge className="bg-purple-500">Wallet</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "refunded":
        return <Badge className="bg-red-500">Refunded</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return null;
    }
  };

  // Mock transaction details for the dialog
  const transactionDetailsMap: Record<string, OrderDetails> = {
    "1": {
      id: "TRX-20250522-001",
      customer: "Walk-in Customer",
      date: format(new Date(2025, 4, 22, 9, 30), "MMM dd, yyyy HH:mm"),
      total: "$24.98",
      status: "Completed",
      address: "In-store purchase",
      phone: "N/A",
      email: "N/A",
      paymentMethod: "Credit Card (Visa ****4512)",
      items: [
        { id: "item1", name: "Whole Milk 1L", quantity: 2, price: "$2.99" },
        { id: "item2", name: "White Bread", quantity: 1, price: "$3.50" },
        { id: "item3", name: "Eggs (12)", quantity: 1, price: "$4.99" },
        { id: "item4", name: "Bananas", quantity: 1, price: "$2.99" },
      ]
    },
    "2": {
      id: "TRX-20250522-002",
      customer: "Walk-in Customer",
      date: format(new Date(2025, 4, 22, 10, 15), "MMM dd, yyyy HH:mm"),
      total: "$12.75",
      status: "Completed",
      address: "In-store purchase",
      phone: "N/A",
      email: "N/A",
      paymentMethod: "Cash",
      items: [
        { id: "item1", name: "Potato Chips", quantity: 1, price: "$3.99" },
        { id: "item2", name: "Soda (2L)", quantity: 1, price: "$2.49" },
        { id: "item3", name: "Chocolate Bar", quantity: 3, price: "$2.09" },
      ]
    },
    "3": {
      id: "TRX-20250522-003",
      customer: "James Brown",
      date: format(new Date(2025, 4, 22, 11, 45), "MMM dd, yyyy HH:mm"),
      total: "$47.32",
      status: "Completed",
      address: "In-store purchase",
      phone: "555-123-4567",
      email: "james@example.com",
      paymentMethod: "Credit Card (Mastercard ****8821)",
      items: [
        { id: "item1", name: "Ground Beef (1lb)", quantity: 2, price: "$8.99" },
        { id: "item2", name: "Pasta Sauce", quantity: 1, price: "$3.49" },
        { id: "item3", name: "Spaghetti", quantity: 1, price: "$1.99" },
        { id: "item4", name: "Garlic Bread", quantity: 1, price: "$4.50" },
        { id: "item5", name: "Parmesan Cheese", quantity: 1, price: "$5.99" },
        { id: "item6", name: "Mixed Salad", quantity: 1, price: "$3.99" },
        { id: "item7", name: "Salad Dressing", quantity: 1, price: "$2.89" },
        { id: "item8", name: "Ice Cream", quantity: 1, price: "$6.49" },
      ]
    },
    // Add more transaction details as needed for other transactions
  };

  const handleViewTransaction = (id: string) => {
    setSelectedTransaction(id);
    setIsDetailOpen(true);
  };

  const selectedTransactionDetails = selectedTransaction ? transactionDetailsMap[selectedTransaction] || null : null;

  return (
    <AdminLayout>
      <PageHeader 
        title="POS Transactions" 
        description="View and manage all point of sale transactions"
        icon={<Receipt className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-10" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.transactionId}</TableCell>
                    <TableCell>{format(transaction.datetime, "MMM dd, yyyy HH:mm")}</TableCell>
                    <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{transaction.items}</TableCell>
                    <TableCell>{getPaymentMethodBadge(transaction.paymentMethod)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{transaction.cashier}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewTransaction(transaction.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <OrderDetailDialog
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen}
        order={selectedTransactionDetails}
      />
    </AdminLayout>
  );
};

export default Transactions;

