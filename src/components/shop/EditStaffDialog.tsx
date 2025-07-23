import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { DEFAULT_ROLES, OrgEmployee, OrgEmployeeRole } from '@/hooks/useHasuraApi';

const formSchema = z.object({
  fullnames: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  Address: z.string().min(1, 'Address is required'),
  position: z.string().min(1, 'Position is required'),
  active: z.boolean(),
  roleType: z.enum(['globalAdmin', 'systemAdmin', 'basicAdmin', 'custom']),
  // Custom permissions
  permissions: z.object({
    dashboard: z.object({
      view: z.boolean(),
      edit: z.boolean(),
    }),
    pos: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
      checkout: z.boolean(),
      refund: z.boolean(),
    }),
    products: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    orders: z.object({
      view: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    customers: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    inventory: z.object({
      view: z.boolean(),
      edit: z.boolean(),
      stock: z.boolean(),
    }),
    reports: z.object({
      view: z.boolean(),
      export: z.boolean(),
    }),
    settings: z.object({
      view: z.boolean(),
      edit: z.boolean(),
    }),
    staff: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    systemAdmin: z.boolean(),
    globalAdmin: z.boolean(),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    id: string;
    employee: {
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      position: string;
      active: boolean;
    };
    permissions: OrgEmployeeRole['privillages'];
  }) => void;
  employee: OrgEmployee | null;
}

// Permission display component
const PermissionDisplay = ({ permissions }: { permissions: any }) => {
  const permissionGroups = [
    {
      title: 'Dashboard',
      permissions: [
        { key: 'view', label: 'View Dashboard' },
        { key: 'edit', label: 'Edit Dashboard' },
      ],
      section: 'dashboard'
    },
    {
      title: 'Point of Sale',
      permissions: [
        { key: 'view', label: 'View POS' },
        { key: 'create', label: 'Create POS' },
        { key: 'edit', label: 'Edit POS' },
        { key: 'delete', label: 'Delete POS' },
        { key: 'checkout', label: 'Checkout' },
        { key: 'refund', label: 'Refund' },
      ],
      section: 'pos'
    },
    {
      title: 'Product Management',
      permissions: [
        { key: 'view', label: 'View Products' },
        { key: 'create', label: 'Create Products' },
        { key: 'edit', label: 'Edit Products' },
        { key: 'delete', label: 'Delete Products' },
      ],
      section: 'products'
    },
    {
      title: 'Order Management',
      permissions: [
        { key: 'view', label: 'View Orders' },
        { key: 'edit', label: 'Edit Orders' },
        { key: 'delete', label: 'Delete Orders' },
      ],
      section: 'orders'
    },
    {
      title: 'Customer Management',
      permissions: [
        { key: 'view', label: 'View Customers' },
        { key: 'create', label: 'Create Customers' },
        { key: 'edit', label: 'Edit Customers' },
        { key: 'delete', label: 'Delete Customers' },
      ],
      section: 'customers'
    },
    {
      title: 'Inventory Management',
      permissions: [
        { key: 'view', label: 'View Inventory' },
        { key: 'edit', label: 'Edit Inventory' },
        { key: 'stock', label: 'Manage Stock' },
      ],
      section: 'inventory'
    },
    {
      title: 'Reports',
      permissions: [
        { key: 'view', label: 'View Reports' },
        { key: 'export', label: 'Export Reports' },
      ],
      section: 'reports'
    },
    {
      title: 'Settings',
      permissions: [
        { key: 'view', label: 'View Settings' },
        { key: 'edit', label: 'Edit Settings' },
      ],
      section: 'settings'
    },
    {
      title: 'Staff Management',
      permissions: [
        { key: 'view', label: 'View Staff' },
        { key: 'create', label: 'Create Staff' },
        { key: 'edit', label: 'Edit Staff' },
        { key: 'delete', label: 'Delete Staff' },
      ],
      section: 'staff'
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {permissionGroups.map((group) => (
          <div key={group.section} className="space-y-2">
            <h4 className="font-medium text-sm">{group.title}</h4>
            <div className="grid grid-cols-2 gap-2">
              {group.permissions.map((permission) => (
                <div key={permission.key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${permissions[group.section]?.[permission.key] ? 'bg-green-500' : 'bg-gray-300'}`} />
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
              <div className={`w-2 h-2 rounded-full ${permissions.systemAdmin ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-muted-foreground">System Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${permissions.globalAdmin ? 'bg-green-500' : 'bg-gray-300'}`} />
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
      permissions: DEFAULT_ROLES.basicAdmin,
    },
  });

  // Update form when employee changes
  useEffect(() => {
    if (employee) {
      const currentPermissions = employee.orgEmployeeRoles[0]?.privillages || DEFAULT_ROLES.basicAdmin;
      
      // Determine role type based on permissions
      let roleType: 'globalAdmin' | 'systemAdmin' | 'basicAdmin' | 'custom' = 'custom';
      if (JSON.stringify(currentPermissions) === JSON.stringify(DEFAULT_ROLES.globalAdmin)) {
        roleType = 'globalAdmin';
      } else if (JSON.stringify(currentPermissions) === JSON.stringify(DEFAULT_ROLES.systemAdmin)) {
        roleType = 'systemAdmin';
      } else if (JSON.stringify(currentPermissions) === JSON.stringify(DEFAULT_ROLES.basicAdmin)) {
        roleType = 'basicAdmin';
      }

      form.reset({
        fullnames: employee.fullnames,
        email: employee.email,
        phone: employee.phone,
        Address: employee.Address,
        position: employee.position || '',
        active: employee.active,
        roleType,
        permissions: currentPermissions,
      });
    }
  }, [employee, form]);

  const roleType = form.watch('roleType');

  // Update permissions when role type changes
  useEffect(() => {
    if (roleType !== 'custom') {
      form.setValue('permissions', DEFAULT_ROLES[roleType]);
    }
  }, [roleType, form]);

  function handleSubmit(values: FormData) {
    if (!employee) return;
    
    const { roleType, permissions, ...employeeData } = values;
    
    onSubmit({
      id: employee.id,
      employee: employeeData,
      permissions,
    });
  }

  const PermissionToggle = ({ 
    section, 
    permission, 
    label, 
    description 
  }: { 
    section: keyof FormData['permissions']; 
    permission: string; 
    label: string; 
    description?: string;
  }) => (
    <FormField
      control={form.control}
      name={`permissions.${section}.${permission}` as any}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={roleType !== 'custom'}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update staff member information and permissions.
          </DialogDescription>
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
                          <FormDescription>
                            Enable or disable this staff member
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Custom</Badge>
                              <span>Custom permissions</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a predefined role or create custom permissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show permissions for predefined roles */}
                {roleType !== 'custom' && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Permissions for {roleType === 'globalAdmin' ? 'Global Admin' : roleType === 'systemAdmin' ? 'System Admin' : 'Basic Admin'}</h4>
                      <PermissionDisplay permissions={DEFAULT_ROLES[roleType]} />
                    </div>
                  </div>
                )}

                {roleType === 'custom' && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Dashboard</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="dashboard"
                            permission="view"
                            label="View Dashboard"
                            description="Can view dashboard and analytics"
                          />
                          <PermissionToggle
                            section="dashboard"
                            permission="edit"
                            label="Edit Dashboard"
                            description="Can modify dashboard settings"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Point of Sale</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="pos"
                            permission="view"
                            label="View POS"
                          />
                          <PermissionToggle
                            section="pos"
                            permission="create"
                            label="Create POS"
                          />
                          <PermissionToggle
                            section="pos"
                            permission="edit"
                            label="Edit POS"
                          />
                          <PermissionToggle
                            section="pos"
                            permission="delete"
                            label="Delete POS"
                          />
                          <PermissionToggle
                            section="pos"
                            permission="checkout"
                            label="Checkout"
                          />
                          <PermissionToggle
                            section="pos"
                            permission="refund"
                            label="Refund"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Product Management</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="products"
                            permission="view"
                            label="View Products"
                          />
                          <PermissionToggle
                            section="products"
                            permission="create"
                            label="Create Products"
                          />
                          <PermissionToggle
                            section="products"
                            permission="edit"
                            label="Edit Products"
                          />
                          <PermissionToggle
                            section="products"
                            permission="delete"
                            label="Delete Products"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Order Management</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="orders"
                            permission="view"
                            label="View Orders"
                          />
                          <PermissionToggle
                            section="orders"
                            permission="edit"
                            label="Edit Orders"
                          />
                          <PermissionToggle
                            section="orders"
                            permission="delete"
                            label="Delete Orders"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Customer Management</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="customers"
                            permission="view"
                            label="View Customers"
                          />
                          <PermissionToggle
                            section="customers"
                            permission="create"
                            label="Create Customers"
                          />
                          <PermissionToggle
                            section="customers"
                            permission="edit"
                            label="Edit Customers"
                          />
                          <PermissionToggle
                            section="customers"
                            permission="delete"
                            label="Delete Customers"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Inventory Management</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="inventory"
                            permission="view"
                            label="View Inventory"
                          />
                          <PermissionToggle
                            section="inventory"
                            permission="edit"
                            label="Edit Inventory"
                          />
                          <PermissionToggle
                            section="inventory"
                            permission="stock"
                            label="Manage Stock"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Reports</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="reports"
                            permission="view"
                            label="View Reports"
                          />
                          <PermissionToggle
                            section="reports"
                            permission="export"
                            label="Export Reports"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Settings</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="settings"
                            permission="view"
                            label="View Settings"
                          />
                          <PermissionToggle
                            section="settings"
                            permission="edit"
                            label="Edit Settings"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Staff Management</h4>
                        <div className="space-y-2">
                          <PermissionToggle
                            section="staff"
                            permission="view"
                            label="View Staff"
                          />
                          <PermissionToggle
                            section="staff"
                            permission="create"
                            label="Create Staff"
                          />
                          <PermissionToggle
                            section="staff"
                            permission="edit"
                            label="Edit Staff"
                          />
                          <PermissionToggle
                            section="staff"
                            permission="delete"
                            label="Delete Staff"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">System Permissions</h4>
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="permissions.systemAdmin"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">System Admin</FormLabel>
                                  <FormDescription>
                                    Full system administration privileges
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="permissions.globalAdmin"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Global Admin</FormLabel>
                                  <FormDescription>
                                    Highest level of system access
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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