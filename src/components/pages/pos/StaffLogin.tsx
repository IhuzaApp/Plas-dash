import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  Search,
  Plus,
  Eye,
  Key,
  Clock,
  Loader2,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import bcrypt from 'bcryptjs';
import AddStaffDialog from '@/components/shop/AddStaffDialog';
import StaffDetailDrawer from '@/components/shop/StaffDetailDrawer';
import ResetPasswordModal from '@/components/shop/ResetPasswordModal';
import EditStaffDialog from '@/components/shop/EditStaffDialog';
import { apiGet, apiPost } from '@/lib/api';
import { hasuraRequest } from '@/lib/hasura';
import {
  UPDATE_ORG_EMPLOYEE_ROLE,
  UPDATE_ORG_EMPLOYEE_PASSWORD,
  UPDATE_ORG_EMPLOYEE,
} from '@/lib/graphql/mutations';
import { toast } from 'sonner';
import { UserPrivileges } from '@/types/privileges';
import { convertCustomPermissionsToPrivileges } from '@/lib/privileges/privilegeConverters';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useAddEmployee, useAddEmployeeRole } from '@/hooks/useHasuraApi';

interface StaffMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone?: string;
  address?: string;
  store: string;
  status: 'active' | 'inactive';
  lastLogin: Date | null;
  roleType?: string;
  privileges?: any;
  created_at?: string;
  active: boolean;
  Address?: string;
  Position?: string;
  fullnames?: string;
  Shops?: { name: string; relatedTo?: string | null };
  Restaurants?: { name: string; relatedTo?: string | null };
}

const StaffLogin = () => {
  const { session } = useAuth();
  const { shopSession, activeBusiness } = useShopSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const { mutateAsync: addEmployee } = useAddEmployee();
  const { mutateAsync: addEmployeeRole } = useAddEmployeeRole();

  const currentBusinessId =
    shopSession?.shopId ||
    session?.restaurant_id ||
    session?.shop_id ||
    activeBusiness?.id;

  const currentBusinessName =
    shopSession?.shopName ||
    session?.restaurant_name ||
    session?.shop_name ||
    activeBusiness?.name;

  // Dialog & Drawer States
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        const data = await apiGet<{ orgEmployees: any[] }>('/api/queries/org-employees');

        let filteredEmployees = data.orgEmployees;

        if (currentBusinessId || currentBusinessName) {
          // Find the store object for the current business to get its relatedTo field
          let currentStoreObj: any = null;
          for (const emp of data.orgEmployees) {
            const s = emp.Shops || emp.Restaurants;
            if (s && (s.id === currentBusinessId || s.name === currentBusinessName)) {
              currentStoreObj = s;
              break;
            }
          }

          const mainName = currentStoreObj?.name || currentBusinessName;
          const mainRelatedTo = currentStoreObj?.relatedTo;

          filteredEmployees = data.orgEmployees.filter(emp => {
            const s = emp.Shops || emp.Restaurants;
            if (!s) {
              // If employee has no shop/restaurant attached but matches the ID directly
              return (
                emp.shop_id === currentBusinessId ||
                emp.restaurant_id === currentBusinessId
              );
            }

            const isSameId = currentBusinessId && s.id === currentBusinessId;
            const isSameName = mainName && s.name === mainName;
            const isChildBranch = mainName && s.relatedTo === mainName;
            const isParentBranch = mainRelatedTo && s.name === mainRelatedTo;
            const isSiblingBranch = mainRelatedTo && s.relatedTo === mainRelatedTo;

            return isSameId || isSameName || isChildBranch || isParentBranch || isSiblingBranch;
          });
        }

        const mappedStaff: StaffMember[] = filteredEmployees.map(emp => {
          const rawPrivs = emp.orgEmployeeRoles?.[0]?.privillages;
          let mappedPrivs = rawPrivs;

          if (Array.isArray(rawPrivs)) {
            mappedPrivs = convertCustomPermissionsToPrivileges(rawPrivs);
          } else if (typeof rawPrivs === 'string') {
            try {
              const parsed = JSON.parse(rawPrivs);
              if (Array.isArray(parsed)) {
                mappedPrivs = convertCustomPermissionsToPrivileges(parsed);
              } else {
                mappedPrivs = parsed;
              }
            } catch (e) {
              mappedPrivs = {};
            }
          }

          return {
            ...emp,
            id: emp.id,
            name: emp.fullnames || 'N/A',
            position: emp.Position || emp.roleType || 'Staff',
            email: emp.email,
            store: emp.Shops?.name || emp.Restaurants?.name || 'Central Store',
            status: emp.active ? 'active' : 'inactive',
            lastLogin: emp.last_login ? new Date(emp.last_login) : null,
            privileges: mappedPrivs,
          };
        });

        setStaff(mappedStaff);
      } catch (err: any) {
        console.error('Error fetching staff:', err);
        setError(err.message || 'Failed to fetch staff accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [session, shopSession, activeBusiness]);

  const handleResetPassword = async (newPassword: string) => {
    if (!selectedStaff) return;
    try {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await hasuraRequest(UPDATE_ORG_EMPLOYEE_PASSWORD, {
        id: selectedStaff.id,
        password: hashedPassword,
      });
      toast.success(`Password reset for ${selectedStaff.name}`);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error('Failed to reset password');
      throw err;
    }
  };

  const handleSavePrivileges = async (newPrivileges: UserPrivileges, newRoleType: string) => {
    if (!selectedStaff) return;
    try {
      await apiPost('/api/mutations/update-employee', {
        id: selectedStaff.id,
        roleType: newRoleType,
        privileges: newPrivileges,
      });

      // Update local state
      setStaff(prev =>
        prev.map(s =>
          s.id === selectedStaff.id ? { ...s, privileges: newPrivileges, roleType: newRoleType } : s
        )
      );

      toast.success(`Role and privileges updated for ${selectedStaff.name}`);
    } catch (err: any) {
      console.error('Error updating role/privileges:', err);
      toast.error(err.message || 'Failed to update role/privileges');
      throw err;
    }
  };

  const openDetails = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsDetailOpen(true);
  };

  const openPasswordReset = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsPasswordModalOpen(true);
  };

  const openPrivilegeEditor = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsEditStaffOpen(true);
  };

  const handleUpdateStaff = async (data: { id: string; employee: any; privileges: any }) => {
    if (!selectedStaff) return;
    setIsSubmittingEdit(true);
    try {
      await apiPost('/api/mutations/update-employee', {
        id: data.id,
        roleType: data.employee.roleType || selectedStaff.roleType,
        privileges: data.privileges,
      });

      // Update local state
      setStaff(prev =>
        prev.map(s =>
          s.id === data.id ? { ...s, ...data.employee, privileges: data.privileges } : s
        )
      );

      toast.success(`Staff member updated for ${selectedStaff.name}`);
      setIsEditStaffOpen(false);
    } catch (err: any) {
      console.error('Error updating staff:', err);
      toast.error(err.message || 'Failed to update staff');
      throw err;
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleAddStaff = async (data: any) => {
    setIsSubmittingAdd(true);
    try {
      const isRestaurant = !!session?.restaurant_id;
      const res = await addEmployee({
        fullnames: data.employee.fullnames,
        email: data.employee.email,
        phone: data.employee.phone,
        Address: data.employee.Address,
        Position: data.employee.Position,
        password: data.employee.password,
        roleType: data.employee.roleType,
        gender: data.employee.gender || 'other',
        shop_id: isRestaurant ? (session?.shop_id || '00000000-0000-0000-0000-000000000000') : (currentBusinessId || '00000000-0000-0000-0000-000000000000'),
        restaurant_id: isRestaurant ? session?.restaurant_id : null,
      });

      if (res?.insert_orgEmployees?.returning?.[0]) {
        const newEmp = res.insert_orgEmployees.returning[0];
        await addEmployeeRole({
          orgEmployeeID: newEmp.id,
          privillages: data.privileges,
        });

        setStaff(prev => [
          {
            ...newEmp,
            id: newEmp.id,
            name: newEmp.fullnames || 'N/A',
            position: newEmp.Position || newEmp.roleType || 'Staff',
            email: newEmp.email,
            store: newEmp.Shops?.name || currentBusinessName || 'Central Store',
            status: newEmp.active ? 'active' : 'inactive',
            lastLogin: null,
            privileges: data.privileges,
          },
          ...prev,
        ]);
      }

      toast.success('Staff member successfully added');
      setIsAddStaffOpen(false);
    } catch (err: any) {
      console.error('Error adding staff:', err);
      toast.error(err.message || 'Failed to add staff member');
    } finally {
      setIsSubmittingAdd(false);
    }
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
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetails(member)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.position}</TableCell>
                        <TableCell>{member.store}</TableCell>
                        <TableCell>
                          <Badge
                            variant={member.status === 'active' ? 'outline' : 'secondary'}
                            className={
                              member.status === 'active'
                                ? 'bg-green-500 text-white hover:bg-green-600 border-none'
                                : ''
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.lastLogin
                            ? format(member.lastLogin, 'MMM dd, yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openDetails(member)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPrivilegeEditor(member)}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Edit Privileges
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPasswordReset(member)}>
                                <Key className="mr-2 h-4 w-4" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        shopId={currentBusinessId || ''}
        loading={isSubmittingAdd}
      />

      <StaffDetailDrawer open={isDetailOpen} onOpenChange={setIsDetailOpen} staff={selectedStaff} />

      <ResetPasswordModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        staff={selectedStaff}
        onReset={handleResetPassword}
      />

      <EditStaffDialog
        open={isEditStaffOpen}
        onOpenChange={setIsEditStaffOpen}
        onSubmit={handleUpdateStaff}
        loading={isSubmittingEdit}
        employee={
          selectedStaff
            ? {
                id: selectedStaff.id,
                employeeID: (selectedStaff as any).employeeID || '',
                fullnames: selectedStaff.fullnames || selectedStaff.name,
                email: selectedStaff.email,
                phone: selectedStaff.phone || '',
                Address: selectedStaff.Address || selectedStaff.address || '',
                Position: selectedStaff.Position || selectedStaff.position || '',
                roleType: selectedStaff.roleType || 'cashier',
                active: selectedStaff.active,
                shop_id: '',
                restaurant_id: null,
                created_on: (selectedStaff as any).created_at || '',
                updated_on: '',
                dob: '',
                gender: '',
                multAuthEnabled: false,
                orgEmployeeRoles: [
                  {
                    id: '',
                    orgEmployeeID: selectedStaff.id,
                    privillages: selectedStaff.privileges || {},
                    created_on: '',
                    update_on: '',
                  },
                ],
                Shops: { id: '', name: selectedStaff.store || '' },
              }
            : null
        }
      />
    </AdminLayout>
  );
};

export default StaffLogin;
