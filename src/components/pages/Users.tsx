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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useUsers, useActiveUsersCount } from '@/hooks/useHasuraApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserDetailsDrawer from '@/components/drawers/UserDetailsDrawer';
import { usePrivilege } from '@/hooks/usePrivilege';
import UsersTrendChart from '@/components/dashboard/UsersTrendChart';

type CategoryTab = 'user' | 'shopper' | 'all';

// Add styles for the highlight effect
const styles = `
  .bg-green-100 {
    background-color: rgba(167, 243, 208, 0.5) !important;
    transition: background-color 1s ease-in-out;
  }
`;

const Users = () => {
  const { data, isLoading, isError, error } = useUsers();
  const { data: activeData, isLoading: isLoadingActive } = useActiveUsersCount();
  const users = data?.Users || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('user');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hasAction } = usePrivilege();

  // By role for table and stats
  const usersWithRoleUser = users.filter(
    user => (user.role?.toLowerCase() ?? '') === 'user'
  );
  const usersWithRoleShopper = users.filter(
    user => (user.role?.toLowerCase() ?? '') === 'shopper'
  );

  // Stats: total, guest, customers from users list; active = from API (activity in last 3 months)
  const totalUsers = users.length;
  const activeUsers = activeData?.activeUsers ?? (isLoadingActive ? null : 0);
  const guestUsers = users.filter(user => user.is_guest).length;
  const customerUsers = usersWithRoleUser.filter(
    user =>
      user.is_active && // User is active
      (!user.shopper || !user.shopper.active) // Either no shopper record or shopper.active is false
  ).length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Table source by category tab (user | shopper | all)
  const tableSourceUsers =
    categoryTab === 'user'
      ? usersWithRoleUser
      : categoryTab === 'shopper'
        ? usersWithRoleShopper
        : users;

  // Filter table by category then by search term
  const filteredUsers = tableSourceUsers.filter(
    user =>
      searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUserId(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader
          title="Users"
          description="View and manage user accounts."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" disabled>Export</Button>
              <Button disabled>Add User</Button>
            </div>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Error loading users.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <style>{styles}</style>
      <PageHeader
        title="Users"
        description="View and manage user accounts."
        actions={
          <div className="flex gap-2">
            {hasAction('users', 'export_users') && <Button variant="outline">Export</Button>}
            {hasAction('users', 'add_users') && <Button>Add User</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {activeUsers === null ? '—' : activeUsers}
            </div>
            <p className="text-muted-foreground">Active Users</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              With activity in last 3 months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{guestUsers}</div>
            <p className="text-muted-foreground">Guest Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{customerUsers}</div>
            <p className="text-muted-foreground">Customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <UsersTrendChart />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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

        <Tabs
          value={categoryTab}
          onValueChange={value => {
            setCategoryTab(value as CategoryTab);
            setCurrentPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="user">
              Users ({usersWithRoleUser.length})
            </TabsTrigger>
            <TabsTrigger value="shopper">
              Shoppers ({usersWithRoleShopper.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({users.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map(user => (
                  <TableRow
                    key={user.id}
                    id={`user-${user.id}`}
                    className="transition-all duration-1000 hover:bg-muted/50"
                  >
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.profile_picture || undefined} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{user.role || 'User'}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewProfile(user.id)}>
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
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
          </div>
        )}
      </div>

      <UserDetailsDrawer userId={selectedUserId} open={isDrawerOpen} onClose={handleCloseDrawer} />
    </AdminLayout>
  );
};

export default Users;
