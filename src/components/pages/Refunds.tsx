
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
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

const Refunds = () => {
  const refunds = [
    { id: "REF-1234", order: "#ORD-5678", customer: "John Smith", amount: "$24.50", reason: "Damaged Product", status: "Pending", date: "2023-05-20" },
    { id: "REF-1235", order: "#ORD-5679", customer: "Sarah Johnson", amount: "$18.75", reason: "Wrong Item", status: "Approved", date: "2023-05-19" },
    { id: "REF-1236", order: "#ORD-5680", customer: "Michael Brown", amount: "$42.00", reason: "Missing Items", status: "Approved", date: "2023-05-18" },
    { id: "REF-1237", order: "#ORD-5681", customer: "Emily Wilson", amount: "$15.25", reason: "Late Delivery", status: "Rejected", date: "2023-05-18" },
    { id: "REF-1238", order: "#ORD-5682", customer: "Robert Lee", amount: "$32.99", reason: "Damaged Product", status: "Pending", date: "2023-05-17" },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Refund Claims" 
        description="Manage and process customer refund requests."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">12</div>
            <p className="text-muted-foreground">Pending Refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">45</div>
            <p className="text-muted-foreground">Approved This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">8</div>
            <p className="text-muted-foreground">Rejected This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$1,245.50</div>
            <p className="text-muted-foreground">Total Refunded</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search refunds..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-medium">{refund.id}</TableCell>
                  <TableCell>{refund.order}</TableCell>
                  <TableCell>{refund.customer}</TableCell>
                  <TableCell>{refund.amount}</TableCell>
                  <TableCell>{refund.reason}</TableCell>
                  <TableCell>{refund.date}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      refund.status === "Approved" ? "bg-green-100 text-green-800" :
                      refund.status === "Rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {refund.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Details</Button>
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

export default Refunds;
