import React, { useState } from "react";
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
import { Search, Filter, Loader2 } from "lucide-react";
import { useShops } from "@/hooks/useHasuraApi";
import Pagination from "@/components/ui/pagination";

interface Shop {
  id: string;
  name: string;
  category_id: string;
  category: {
    id: string;
    name: string;
  } | null;
  Products_aggregate: {
    aggregate: {
      count: number;
    };
  };
  Orders_aggregate: {
    aggregate: {
      count: number;
    };
  };
  is_active: boolean;
}

const Shops = () => {
  const { data, isLoading, isError, error } = useShops();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter shops based on search term
  const filteredShops = data?.Shops.filter(shop => 
    searchTerm === "" || 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate pagination
  const totalItems = filteredShops.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentShops = filteredShops.slice(startIndex, endIndex);
  
  return (
    <AdminLayout>
      <PageHeader 
        title="Shops" 
        description="Manage partner shops and their products."
        actions={<Button>Add New Shop</Button>}
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search shops..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="text-red-500">
                      Error loading shops. Please try again.
                      {error && (
                        <div className="text-sm mt-2">
                          Error details: {error.message}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentShops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No shops found.
                  </TableCell>
                </TableRow>
              ) : (
                currentShops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>
                      {shop.category?.name || 'Uncategorized'}
                    </TableCell>
                    <TableCell>{shop.Products_aggregate.aggregate.count}</TableCell>
                    <TableCell>{shop.Orders_aggregate.aggregate.count}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shop.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {shop.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/shops/${shop.id}`}>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && !isError && currentShops.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1); // Reset to first page when changing page size
              }}
              totalItems={totalItems}
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Shops;
