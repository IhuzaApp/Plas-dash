import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrgEmployee, getPermissionsForRole } from '@/hooks/useHasuraApi';

const formSchema = z.object({
  fullnames: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  Address: z.string().min(1, 'Address is required'),
  position: z.string().min(1, 'Position is required'),
  active: z.boolean(),
  roleType: z.enum(['globalAdmin', 'systemAdmin', 'basicAdmin', 'custom']),
});

type FormData = z.infer<typeof formSchema>;

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    id: string;
    employee: Partial<{
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      Position: string;
      roleType: string;
      active: boolean;
    }>;
    permissions: string[];
  }) => void;
  employee: OrgEmployee | null;
}

// Permission display component
const PermissionDisplay = ({ permissions }: { permissions: string[] }) => {
  const permissionGroups = [
    {
      title: 'Dashboard',
      permissions: [
        { key: 'dashboard:view', label: 'View Dashboard' },
        { key: 'dashboard:edit', label: 'Edit Dashboard' },
      ],
    },
    {
      title: 'Point of Sale',
      permissions: [
        { key: 'pos:view', label: 'View POS' },
        { key: 'pos:create', label: 'Create POS' },
        { key: 'pos:edit', label: 'Edit POS' },
        { key: 'pos:delete', label: 'Delete POS' },
        { key: 'pos:checkout', label: 'Checkout' },
        { key: 'pos:refund', label: 'Refund' },
      ],
    },
    {
      title: 'Product Management',
      permissions: [
        { key: 'products:view', label: 'View Products' },
        { key: 'products:create', label: 'Create Products' },
        { key: 'products:edit', label: 'Edit Products' },
        { key: 'products:delete', label: 'Delete Products' },
      ],
    },
    {
      title: 'Order Management',
      permissions: [
        { key: 'orders:view', label: 'View Orders' },
        { key: 'orders:edit', label: 'Edit Orders' },
        { key: 'orders:delete', label: 'Delete Orders' },
      ],
    },
    {
      title: 'Customer Management',
      permissions: [
        { key: 'customers:view', label: 'View Customers' },
        { key: 'customers:create', label: 'Create Customers' },
        { key: 'customers:edit', label: 'Edit Customers' },
        { key: 'customers:delete', label: 'Delete Customers' },
      ],
    },
    {
      title: 'Inventory Management',
      permissions: [
        { key: 'inventory:view', label: 'View Inventory' },
        { key: 'inventory:edit', label: 'Edit Inventory' },
        { key: 'inventory:stock', label: 'Manage Stock' },
      ],
    },
    {
      title: 'Reports',
      permissions: [
        { key: 'reports:view', label: 'View Reports' },
        { key: 'reports:export', label: 'Export Reports' },
      ],
    },
    {
      title: 'Settings',
      permissions: [
        { key: 'settings:view', label: 'View Settings' },
        { key: 'settings:edit', label: 'Edit Settings' },
      ],
    },
    {
      title: 'Staff Management',
      permissions: [
        { key: 'staff:view', label: 'View Staff' },
        { key: 'staff:create', label: 'Create Staff' },
        { key: 'staff:edit', label: 'Edit Staff' },
        { key: 'staff:delete', label: 'Delete Staff' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {permissionGroups.map(group => (
          <div key={group.title} className="space-y-2">
            <h4 className="font-medium text-sm">{group.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              {group.permissions.map(permission => (
                <div key={permission.key} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${permissions.includes(permission.key) ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <span className="text-xs text-muted-foreground">{permission.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">System Permissions</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${permissions.includes('systemAdmin') ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className="text-xs text-muted-foreground">System Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${permissions.includes('globalAdmin') ? 'bg-green-500' : 'bg-gray-300'}`}
              />
              <span className="text-xs text-muted-foreground">Global Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditStaffDialog: React.FC<EditStaffDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  employee,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullnames: '',
      email: '',
      phone: '',
      Address: '',
      position: '',
      active: true,
      roleType: 'basicAdmin',
    },
  });

  React.useEffect(() => {
    if (open && employee) {
      const formData = {
        fullnames: employee.fullnames || '',
        email: employee.email || '',
        phone: employee.phone || '',
        Address: employee.Address || '',
        position: employee.Position || '',
        active: employee.active ?? true,
        roleType:
          (employee.roleType as 'globalAdmin' | 'systemAdmin' | 'basicAdmin' | 'custom') ||
          'basicAdmin',
      };

      form.reset(formData);
    }
  }, [open, employee, form]);

  const roleType = form.watch('roleType');

  function handleSubmit(values: FormData) {
    if (!employee) {
      return;
    }

    const { position, ...employeeData } = values;

    // Smart update: Only include fields that have changed
    const changes: any = {};

    // Check each field and only include if it changed
    if (values.fullnames !== employee.fullnames) changes.fullnames = values.fullnames;
    if (values.email !== employee.email) changes.email = values.email;
    if (values.phone !== employee.phone) changes.phone = values.phone;
    if (values.Address !== employee.Address) changes.Address = values.Address;
    if (values.position !== employee.Position) changes.Position = values.position;
    if (values.active !== employee.active) changes.active = values.active;
    if (values.roleType !== employee.roleType) changes.roleType = values.roleType;

    // Filter out null and undefined values
    const filteredChanges = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== null && value !== undefined)
    );

    // Also filter out empty strings to prevent null value errors
    const finalChanges = Object.fromEntries(
      Object.entries(filteredChanges).filter(([_, value]) => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        return true;
      })
    );

    // Get permissions based on role type
    const permissions = getPermissionsForRole(roleType);

    onSubmit({
      id: employee.id,
      employee: finalChanges,
      permissions,
    });
  }

  if (!employee) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>Update staff member information and role.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullnames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                            <SelectItem value="salesperson">Salesperson</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>Enable or disable this staff member</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Role Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Role & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="roleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="globalAdmin">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">Global Admin</Badge>
                              <span>Full system access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="systemAdmin">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">System Admin</Badge>
                              <span>Limited system access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="basicAdmin">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Basic Admin</Badge>
                              <span>Basic operations</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a predefined role with preset permissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show permissions for selected role */}
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">
                      Permissions for{' '}
                      {roleType === 'globalAdmin'
                        ? 'Global Admin'
                        : roleType === 'systemAdmin'
                          ? 'System Admin'
                          : 'Basic Admin'}
                    </h4>
                    <PermissionDisplay permissions={getPermissionsForRole(roleType)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Staff Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;
