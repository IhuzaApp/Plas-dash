
import React from "react";
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
import { Tag, Plus, Edit, Trash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface Discount {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed" | "bogo";
  value: number;
  status: "active" | "inactive" | "scheduled";
  startDate: Date;
  endDate: Date;
}

const Discounts = () => {
  const discounts: Discount[] = [
    { id: "1", name: "Summer Sale", code: "SUMMER25", type: "percentage", value: 25, status: "active", startDate: new Date(2025, 4, 1), endDate: new Date(2025, 7, 31) },
    { id: "2", name: "New Customer", code: "WELCOME10", type: "percentage", value: 10, status: "active", startDate: new Date(2025, 0, 1), endDate: new Date(2025, 11, 31) },
    { id: "3", name: "$5 Off", code: "SAVE5", type: "fixed", value: 5, status: "active", startDate: new Date(2025, 4, 15), endDate: new Date(2025, 5, 15) },
    { id: "4", name: "Buy 1 Get 1 Free", code: "BOGO", type: "bogo", value: 100, status: "scheduled", startDate: new Date(2025, 5, 1), endDate: new Date(2025, 5, 30) },
    { id: "5", name: "Flash Sale", code: "FLASH30", type: "percentage", value: 30, status: "inactive", startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 7) },
    { id: "6", name: "Holiday Special", code: "HOLIDAY20", type: "percentage", value: 20, status: "scheduled", startDate: new Date(2025, 11, 1), endDate: new Date(2025, 11, 25) }
  ];

  const getDiscountValue = (discount: Discount) => {
    switch (discount.type) {
      case "percentage":
        return `${discount.value}%`;
      case "fixed":
        return `$${discount.value.toFixed(2)}`;
      case "bogo":
        return "Buy 1 Get 1";
      default:
        return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        heading="POS Discounts" 
        subheading="Manage promotional discounts and offers"
        icon={<Tag className="h-6 w-6" />}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Discount
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map(discount => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.name}</TableCell>
                    <TableCell className="font-mono uppercase">{discount.code}</TableCell>
                    <TableCell>{getDiscountValue(discount)}</TableCell>
                    <TableCell>{getStatusBadge(discount.status)}</TableCell>
                    <TableCell>{format(discount.startDate, "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(discount.endDate, "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Switch checked={discount.status === "active"} />
                    </TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default Discounts;
