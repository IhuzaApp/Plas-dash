import React from "react";
import Link from "next/link";
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
import { Search, Filter, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useShoppers } from "@/hooks/useHasuraApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Shoppers = () => {
  const { data, isLoading, isError, error } = useShoppers();
  const shoppers = data?.shoppers || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const activeShoppers = shoppers.filter(s => s.active && s.status === "approved");
  const pendingShoppers = shoppers.filter(s => s.status === "pending");
  const backgroundCheckedShoppers = shoppers.filter(s => s.background_check_completed);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Error loading shoppers.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

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
            <div className="text-2xl font-bold">{shoppers.length}</div>
            <p className="text-muted-foreground">Total Shoppers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeShoppers.length}</div>
            <p className="text-muted-foreground">Active Shoppers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{backgroundCheckedShoppers.length}</div>
            <p className="text-muted-foreground">Background Checked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingShoppers.length}</div>
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
                <TableHead>Shopper</TableHead>
                <TableHead>Employment ID</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Background Check</TableHead>
                <TableHead>Onboarding Step</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shoppers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No shoppers found.
                  </TableCell>
                </TableRow>
              ) : (
                shoppers.map((shopper) => (
                  <TableRow key={shopper.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={shopper.profile_photo || undefined} />
                        <AvatarFallback>{getInitials(shopper.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{shopper.full_name}</div>
                        <div className="text-sm text-muted-foreground">{shopper.phone_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>{shopper.Employment_id}</TableCell>
                    <TableCell>
                      <span className="capitalize">{shopper.transport_mode}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shopper.status === "approved" && shopper.active ? "bg-green-100 text-green-800" :
                        shopper.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {shopper.status === "approved" 
                          ? (shopper.active ? "Active" : "Inactive")
                          : shopper.status.charAt(0).toUpperCase() + shopper.status.slice(1)
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shopper.background_check_completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {shopper.background_check_completed ? "Completed" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{shopper.onboarding_step}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/shoppers/${shopper.id}`}>
                        <Button variant="ghost" size="sm">View Profile</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Shoppers;
