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
import {
  UserPrivileges,
  PrivilegeKey,
  getDefaultPrivilegesForRole,
  permissionGroups,
  convertCustomPermissionsToPrivileges,
} from '@/lib/privileges';
import { DEFAULT_PRIVILEGES } from '@/types/privileges';

const formSchema = z.object({
  fullnames: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  Address: z.string().min(1, 'Address is required'),
  position: z.string().min(1, 'Position is required'),
  active: z.boolean(),
  roleType: z.enum([
    'globalAdmin',
    'systemAdmin',
    'storeManager',
    'assistantManager',
    'cashier',
    'salesAssociate',
    'inventorySpecialist',
    'financeManager',
    'accountant',
    'kitchenManager',
    'chef',
    'waiter',
    'bartender',
    'deliveryDriver',
    'securityGuard',
    'maintenanceStaff',
    'custom',
  ]),
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
    privileges: UserPrivileges;
  }) => void;
  employee: OrgEmployee | null;
}

// Permission display component for the new privilege system
const PermissionDisplay = ({ privileges }: { privileges: UserPrivileges }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {permissionGroups.map(group => (
          <div key={group.title} className="space-y-2">
            <h4 className="font-medium text-sm">{group.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              {group.permissions.map(permission => {
                const hasAccess = privileges[group.module]?.[permission.key] || false;
                return (
                  <div key={permission.key} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-xs text-muted-foreground">{permission.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
      roleType: 'cashier',
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
          (employee.roleType as
            | 'globalAdmin'
            | 'systemAdmin'
            | 'storeManager'
            | 'assistantManager'
            | 'cashier'
            | 'salesAssociate'
            | 'inventorySpecialist'
            | 'financeManager'
            | 'accountant'
            | 'kitchenManager'
            | 'chef'
            | 'waiter'
            | 'bartender'
            | 'deliveryDriver'
            | 'securityGuard'
            | 'maintenanceStaff'
            | 'custom') || 'cashier',
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

    // Get privileges based on role type
    const privileges = getDefaultPrivilegesForRole(roleType);

    onSubmit({
      id: employee.id,
      employee: finalChanges,
      privileges,
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
                          <SelectItem value="storeManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Store Manager</Badge>
                              <span>Full store operations & staff management</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="assistantManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Assistant Manager</Badge>
                              <span>Store operations with limited staff access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cashier">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Cashier</Badge>
                              <span>POS operations & customer service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="salesAssociate">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Sales Associate</Badge>
                              <span>Product sales & customer assistance</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inventorySpecialist">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Inventory Specialist</Badge>
                              <span>Stock management & product updates</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="financeManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Finance Manager</Badge>
                              <span>Financial oversight & accounting</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="accountant">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Accountant</Badge>
                              <span>Financial records & reports</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="kitchenManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Kitchen Manager</Badge>
                              <span>Food preparation & kitchen operations</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="chef">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Chef</Badge>
                              <span>Food preparation & order management</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="waiter">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Waiter</Badge>
                              <span>Order taking & customer service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bartender">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Bartender</Badge>
                              <span>Drink orders & inventory</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="deliveryDriver">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Delivery Driver</Badge>
                              <span>Order delivery & basic viewing</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="securityGuard">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Security Guard</Badge>
                              <span>Basic monitoring access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="maintenanceStaff">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Maintenance Staff</Badge>
                              <span>System maintenance access</span>
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
                          : roleType === 'storeManager'
                            ? 'Store Manager'
                            : roleType === 'assistantManager'
                              ? 'Assistant Manager'
                              : roleType === 'cashier'
                                ? 'Cashier'
                                : roleType === 'salesAssociate'
                                  ? 'Sales Associate'
                                  : roleType === 'inventorySpecialist'
                                    ? 'Inventory Specialist'
                                    : roleType === 'financeManager'
                                      ? 'Finance Manager'
                                      : roleType === 'accountant'
                                        ? 'Accountant'
                                        : roleType === 'kitchenManager'
                                          ? 'Kitchen Manager'
                                          : roleType === 'chef'
                                            ? 'Chef'
                                            : roleType === 'waiter'
                                              ? 'Waiter'
                                              : roleType === 'bartender'
                                                ? 'Bartender'
                                                : roleType === 'deliveryDriver'
                                                  ? 'Delivery Driver'
                                                  : roleType === 'securityGuard'
                                                    ? 'Security Guard'
                                                    : roleType === 'maintenanceStaff'
                                                      ? 'Maintenance Staff'
                                                      : 'Custom Role'}
                    </h4>
                    <PermissionDisplay privileges={getDefaultPrivilegesForRole(roleType)} />
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
