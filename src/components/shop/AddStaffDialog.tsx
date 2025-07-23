import React, { useState } from 'react';
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
import { DEFAULT_ROLES, getPermissionsForRole } from '@/hooks/useHasuraApi';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  fullnames: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  Address: z.string().min(1, 'Address is required'),
  gender: z.string().min(1, 'Gender is required'),
  position: z.string().min(1, 'Position is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  generatePassword: z.boolean().default(false),
  roleType: z.enum(['globalAdmin', 'systemAdmin', 'basicAdmin', 'custom']),
});

type FormData = z.infer<typeof formSchema>;

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    employee: {
      fullnames: string;
      email: string;
      phone: string;
      Address: string;
      gender: string;
      Position: string;
      password: string;
      roleType: string;
    };
    permissions: string[];
  }) => void;
  shopId: string;
}

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

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

const AddStaffDialog: React.FC<AddStaffDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  shopId,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullnames: '',
      email: '',
      phone: '',
      Address: '',
      gender: '',
      position: '',
      password: '',
      generatePassword: false,
      roleType: 'basicAdmin',
    },
  });

  const roleType = form.watch('roleType');
  const generatePassword = form.watch('generatePassword');

  // Generate password when toggle is enabled
  React.useEffect(() => {
    if (generatePassword) {
      const newPassword = generateRandomPassword();
      form.setValue('password', newPassword);
    }
  }, [generatePassword, form]);

  function handleSubmit(values: FormData) {
    const { position, ...employeeData } = values;

    // Get permissions based on role type
    const permissions = getPermissionsForRole(roleType);

    onSubmit({
      employee: {
        ...employeeData,
        Position: position,
      },
      permissions,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member and assign their role and permissions.
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                    name="generatePassword"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Generate Random Password</FormLabel>
                          <FormDescription>
                            Automatically generate a secure password
                          </FormDescription>
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

                {!generatePassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password*</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {generatePassword && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generated Password*</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Generated password"
                              {...field}
                              readOnly
                            />
                            <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-transparent"
                                onClick={() => {
                                  const newPassword = generateRandomPassword();
                                  form.setValue('password', newPassword);
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Click the refresh icon to generate a new password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
              <Button type="submit">Add Staff Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffDialog;
