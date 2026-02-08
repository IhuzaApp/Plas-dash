'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Filter,
  Loader2,
  Plus,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRestaurants } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePrivilege } from '@/hooks/usePrivilege';

const Restaurants = () => {
  const { data, isLoading, isError, error } = useRestaurants();
  const restaurants = data?.Restaurants || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { hasAction } = usePrivilege();

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const activeRestaurants = restaurants.filter(restaurant => restaurant.is_active);
  const inactiveRestaurants = restaurants.filter(restaurant => !restaurant.is_active);
  const verifiedRestaurants = restaurants.filter(restaurant => restaurant.verified);

  // Filter restaurants based on search term
  const filteredRestaurants = restaurants.filter(restaurant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      restaurant.name?.toLowerCase().includes(searchLower) ||
      restaurant.email?.toLowerCase().includes(searchLower) ||
      restaurant.phone?.toLowerCase().includes(searchLower) ||
      restaurant.location?.toLowerCase().includes(searchLower) ||
      restaurant.tin?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination
  const totalItems = filteredRestaurants.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRestaurants = filteredRestaurants.slice(startIndex, endIndex);

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
          <p className="text-red-500">Error loading restaurants.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Restaurants"
        description="Manage restaurant information and settings."
        actions={
          <div className="flex gap-2">
            {hasAction('restaurants', 'add_restaurants') && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            )}
            {hasAction('restaurants', 'export_restaurants') && (
              <Button variant="outline">Export</Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{restaurants.length}</div>
            <p className="text-muted-foreground">Total Restaurants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeRestaurants.length}</div>
            <p className="text-muted-foreground">Active Restaurants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{verifiedRestaurants.length}</div>
            <p className="text-muted-foreground">Verified Restaurants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inactiveRestaurants.length}</div>
            <p className="text-muted-foreground">Inactive Restaurants</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, location, or TIN..."
              className="pl-8"
              value={searchTerm}
              onChange={e => {
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
                <TableHead>Restaurant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No restaurants found.
                  </TableCell>
                </TableRow>
              ) : (
                currentRestaurants.map(restaurant => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={restaurant.logo} alt={restaurant.name} />
                          <AvatarFallback>
                            {restaurant.name
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            TIN: {restaurant.tin || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          {restaurant.email || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                          {restaurant.phone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                        {restaurant.location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                        {restaurant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {restaurant.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className="text-sm">
                          {restaurant.verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(restaurant.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {hasAction('restaurants', 'view_restaurant_details') && (
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        )}
                        {hasAction('restaurants', 'edit_restaurants') && (
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Restaurants;
