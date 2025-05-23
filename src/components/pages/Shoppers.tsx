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
import { Search, Filter, CheckCircle, XCircle } from "lucide-react";

const Shoppers = () => {
  const shoppers = [
    { id: 1, name: "Alex Johnson", rating: 4.8, orders: 245, status: "Active", earnings: "$2,450", online: true },
    { id: 2, name: "Maria Garcia", rating: 4.9, orders: 189, status: "Active", earnings: "$1,980", online: true },
    { id: 3, name: "David Kim", rating: 4.7, orders: 156, status: "Inactive", earnings: "$1,720", online: false },
    { id: 4, name: "Lisa Chen", rating: 4.6, orders: 203, status: "Pending", earnings: "$2,150", online: false },
    { id: 5, name: "James Wilson", rating: 4.9, orders: 312, status: "Active", earnings: "$3,240", online: true },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Shoppers" 
        description="Manage your delivery personnel and track their performance."
        actions={<Button>Add New Shopper</Button>}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">48</div>
            <p className="text-muted-foreground">Total Shoppers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">23</div>
            <p className="text-muted-foreground">Active Now</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-muted-foreground">Avg. Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">5</div>
            <p className="text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shoppers..." className="pl-8" />
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
                <TableHead>Rating</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Online</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shoppers.map((shopper) => (
                <TableRow key={shopper.id}>
                  <TableCell className="font-medium">{shopper.name}</TableCell>
                  <TableCell>⭐ {shopper.rating}</TableCell>
                  <TableCell>{shopper.orders}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shopper.status === "Active" ? "bg-green-100 text-green-800" :
                      shopper.status === "Inactive" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {shopper.status}
                    </span>
                  </TableCell>
                  <TableCell>{shopper.earnings}</TableCell>
                  <TableCell>
                    {shopper.online ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <XCircle className="h-5 w-5 text-gray-300" />
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View Profile</Button>
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

export default Shoppers;
