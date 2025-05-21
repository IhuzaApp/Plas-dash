
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
import { Search, Filter, Plus } from "lucide-react";

const Promotions = () => {
  const promotions = [
    { 
      id: 1, 
      name: "New User Discount", 
      code: "WELCOME20", 
      type: "Percentage", 
      value: "20%", 
      startDate: "2023-05-01", 
      endDate: "2023-06-30", 
      usageLimit: 1000, 
      usageCount: 458, 
      status: "Active" 
    },
    { 
      id: 2, 
      name: "Free Delivery", 
      code: "FREEDEL", 
      type: "Fixed Amount", 
      value: "$4.99", 
      startDate: "2023-05-15", 
      endDate: "2023-05-31", 
      usageLimit: 500, 
      usageCount: 203, 
      status: "Active" 
    },
    { 
      id: 3, 
      name: "Summer Sale", 
      code: "SUMMER10", 
      type: "Percentage", 
      value: "10%", 
      startDate: "2023-06-01", 
      endDate: "2023-08-31", 
      usageLimit: 2000, 
      usageCount: 0, 
      status: "Scheduled" 
    },
    { 
      id: 4, 
      name: "Weekend Special", 
      code: "WEEKEND15", 
      type: "Percentage", 
      value: "15%", 
      startDate: "2023-04-01", 
      endDate: "2023-04-30", 
      usageLimit: 800, 
      usageCount: 732, 
      status: "Expired" 
    },
    { 
      id: 5, 
      name: "Loyalty Reward", 
      code: "LOYAL5", 
      type: "Fixed Amount", 
      value: "$5.00", 
      startDate: "2023-05-01", 
      endDate: "2023-12-31", 
      usageLimit: 10000, 
      usageCount: 289, 
      status: "Active" 
    },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Promotions" 
        description="Manage discounts, offers and promotional campaigns."
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Promotion
          </Button>
        }
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search promotions..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-medium">{promotion.name}</TableCell>
                  <TableCell>
                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                      {promotion.code}
                    </span>
                  </TableCell>
                  <TableCell>{promotion.value} {promotion.type === "Percentage" ? "off" : "discount"}</TableCell>
                  <TableCell>{promotion.startDate} to {promotion.endDate}</TableCell>
                  <TableCell>{promotion.usageCount} / {promotion.usageLimit}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      promotion.status === "Active" ? "bg-green-100 text-green-800" :
                      promotion.status === "Scheduled" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {promotion.status}
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

export default Promotions;
