import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Search, Plus, Eye, Key, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import AddStaffDialog from '@/components/shop/AddStaffDialog';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  email: string;
  store: string;
  status: 'active' | 'inactive';
  lastLogin: Date | null;
}

const StaffLogin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // Placeholder onSubmit handler
  const handleAddStaff = (data: any) => {
    // TODO: Implement actual add staff logic (API call, etc.)
    setIsAddStaffOpen(false);
  };

  const staff: StaffMember[] = [
    {
      id: '1',
      name: 'John Smith',
      position: 'Cashier',
      email: 'john.smith@example.com',
      store: 'Central Store',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 8, 3),
    },
    {
      id: '2',
      name: 'Emma Johnson',
      position: 'Manager',
      email: 'emma.johnson@example.com',
      store: 'Central Store',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 7, 55),
    },
    {
      id: '3',
      name: 'David Wilson',
      position: 'Stock Clerk',
      email: 'david.wilson@example.com',
      store: 'Central Store',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 8, 10),
    },
    {
      id: '4',
      name: 'Sarah Martinez',
      position: 'Cashier',
      email: 'sarah.martinez@example.com',
      store: 'Central Store',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 9, 15),
    },
    {
      id: '5',
      name: 'Michael Brown',
      position: 'Cashier',
      email: 'michael.brown@example.com',
      store: 'Westside Market',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 8, 0),
    },
    {
      id: '6',
      name: 'Jessica Lee',
      position: 'Manager',
      email: 'jessica.lee@example.com',
      store: 'Westside Market',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 7, 45),
    },
    {
      id: '7',
      name: 'Robert Garcia',
      position: 'Stock Clerk',
      email: 'robert.garcia@example.com',
      store: 'Northgate Shop',
      status: 'inactive',
      lastLogin: new Date(2025, 4, 21, 17, 30),
    },
    {
      id: '8',
      name: 'Jennifer Lopez',
      position: 'Manager',
      email: 'jennifer.lopez@example.com',
      store: 'Northgate Shop',
      status: 'active',
      lastLogin: new Date(2025, 4, 22, 8, 5),
    },
  ];

  const filteredStaff = staff.filter(
    member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.store.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentLogins = staff
    .filter(member => member.lastLogin !== null)
    .sort((a, b) => b.lastLogin!.getTime() - a.lastLogin!.getTime())
    .slice(0, 5);

  return (
    <AdminLayout>
      <PageHeader
        title="POS Staff Management"
        description="Manage staff accounts and monitor login activity"
        icon={<Users className="h-6 w-6" />}
        actions={
          <Button onClick={() => setIsAddStaffOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Staff Accounts</CardTitle>
            <CardDescription>View and manage staff with POS access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or store..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>{member.store}</TableCell>
                      <TableCell>
                        {member.status === 'active' ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.lastLogin
                          ? format(member.lastLogin, 'MMM dd, yyyy HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Key className="h-4 w-4" />
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Staff login activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogins.map(member => (
                <div key={member.id} className="flex items-center p-2 border rounded-md">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.lastLogin && format(member.lastLogin, 'MMM dd, yyyy HH:mm')} at{' '}
                      {member.store}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <AddStaffDialog
        open={isAddStaffOpen}
        onOpenChange={setIsAddStaffOpen}
        onSubmit={handleAddStaff}
        shopId={''} // TODO: Pass correct shopId if needed
      />
    </AdminLayout>
  );
};

export default StaffLogin;
