import React, { useState, useEffect } from 'react';
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
import { apiGet } from '@/lib/api';
import { Loader2 } from 'lucide-react';

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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        const data = await apiGet<{ orgEmployees: any[] }>('/api/queries/org-employees');

        const mappedStaff: StaffMember[] = data.orgEmployees.map(emp => ({
          id: emp.id,
          name: emp.fullnames || 'N/A',
          position: emp.Position || emp.roleType || 'Staff',
          email: emp.email,
          store: emp.Shops?.name || 'Central Store',
          status: emp.active ? 'active' : 'inactive',
          lastLogin: emp.last_login ? new Date(emp.last_login) : null,
        }));

        setStaff(mappedStaff);
      } catch (err: any) {
        console.error('Error fetching staff:', err);
        setError(err.message || 'Failed to fetch staff accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  // Placeholder onSubmit handler
  const handleAddStaff = (data: any) => {
    // TODO: Implement actual add staff logic (API call, etc.)
    setIsAddStaffOpen(false);
  };

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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Loading staff members...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-destructive">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map(member => (
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
                    ))
                  )}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentLogins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent login activity
                </p>
              ) : (
                recentLogins.map(member => (
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
                ))
              )}
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
