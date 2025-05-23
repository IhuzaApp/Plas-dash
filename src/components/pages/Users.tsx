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

const Users = () => {
  const users = [
    { id: 1, name: "Emma Wilson", email: "emma@example.com", orders: 12, joined: "Jan 15, 2023", status: "Active" },
    { id: 2, name: "Oliver Martin", email: "oliver@example.com", orders: 5, joined: "Feb 3, 2023", status: "Active" },
    { id: 3, name: "Sophia Taylor", email: "sophia@example.com", orders: 8, joined: "Dec 10, 2022", status: "Inactive" },
    { id: 4, name: "Noah Johnson", email: "noah@example.com", orders: 20, joined: "Mar 22, 2023", status: "Active" },
    { id: 5, name: "Isabella Brown", email: "isabella@example.com", orders: 3, joined: "Apr 5, 2023", status: "Active" },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Customers" 
        description="View and manage customer accounts."
        actions={<Button>Export Data</Button>}
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-8" />
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
                <TableHead>Email</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.orders}</TableCell>
                  <TableCell>{user.joined}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View Details</Button>
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

export default Users;
