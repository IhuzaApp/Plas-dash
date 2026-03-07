import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  UserPrivileges,
  PrivilegeKey,
  getDefaultPrivilegesForRole,
  permissionGroups as allPermissionGroups,
  convertCustomPermissionsToPrivileges,
} from '@/lib/privileges';
import { DEFAULT_PRIVILEGES } from '@/types/privileges';
import { useShopSubscriptionModules } from '@/hooks/useShopSubscriptionModules';
import { RoleModulePreview } from '@/components/shop/RoleModulePreview';

// Generate random password
// ... (omitted for brevity in replace_file_content, but I will include it in the actual call)

const formSchema = z.object({
  fullnames: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  Address: z.string().min(1, 'Address is required'),
  gender: z.string().min(1, 'Gender is required'),
  position: z.string().min(1, 'Position is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  generatePassword: z.boolean().default(false),
  roleType: z.enum([
    'globalAdmin',
    'systemAdmin',
    'storeAdministrator',
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
    'customer',
    'custom',
  ]),
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
    privileges: UserPrivileges;
  }) => void;
  shopId: string;
  /** Module slugs from the shop's active subscription plan — passed directly to avoid extra API calls */
  planModuleSlugs?: string[];
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

// Helper functions for the new privilege system
// Note: getDefaultPrivilegesForRole is now imported from @/lib/privileges

// Note: convertCustomPermissionsToPrivileges is now imported from @/lib/privileges

// Note: permissionGroups is now imported from @/lib/privileges

const PermissionDisplay = ({
  privileges,
  permissionGroups,
}: {
  privileges: UserPrivileges;
  permissionGroups: any[];
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Accordion type="multiple" className="w-full">
          {permissionGroups.map(group => (
            <AccordionItem key={group.title} value={group.title}>
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                {group.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {group.permissions.map((permission: any) => {
                    const hasAccess = privileges[group.module as PrivilegeKey]?.[permission.key] || false;
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

const AddStaffDialog: React.FC<AddStaffDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  shopId,
  planModuleSlugs,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  // Only use hook when planModuleSlugs isn't provided directly
  const { availableModules: hookModules, isLoading: isLoadingModules } = useShopSubscriptionModules(
    planModuleSlugs !== undefined ? undefined : shopId
  );

  // undefined planModuleSlugs = subscription data not available yet; [] = no modules in plan
  const resolvedModules: string[] | undefined =
    planModuleSlugs !== undefined ? planModuleSlugs
      : hookModules.length > 0 ? hookModules
        : undefined;

  const isLoading = planModuleSlugs !== undefined ? false : isLoadingModules;

  const filteredPermissionGroups = React.useMemo(() => {
    if (isLoading) return [];
    // Subscription data available — strict filter to subscribed modules only
    if (resolvedModules !== undefined) {
      return allPermissionGroups.filter(group => resolvedModules.includes(group.module));
    }
    // No subscription data at all — show everything so user isn't blocked
    return allPermissionGroups;
  }, [resolvedModules, isLoading]);

  const [customPrivileges, setCustomPrivileges] = useState<UserPrivileges>({
    ...DEFAULT_PRIVILEGES,
  });

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
      roleType: 'cashier',
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

  // Update custom privileges when role type changes
  React.useEffect(() => {
    if (roleType !== 'custom') {
      const defaultPrivileges = getDefaultPrivilegesForRole(roleType);
      setCustomPrivileges(defaultPrivileges);
    }
  }, [roleType]);

  function handlePrivilegeToggle(module: PrivilegeKey, action: string) {
    setCustomPrivileges(prev => {
      const newValue = !prev[module]?.[action];
      const updatedModule = {
        ...prev[module],
        [action]: newValue,
      };

      // If we enabled an action, ensure module access is also true
      if (newValue && action !== 'access') {
        (updatedModule as any).access = true;
      }

      const newPrivs = {
        ...prev,
        [module]: updatedModule,
      };

      // Sync with pages module
      if (!newPrivs.pages) {
        newPrivs.pages = { access: false };
      }

      const pages = newPrivs.pages as any;
      const updatedAccess = (newPrivs[module] as any).access;
      pages[`access_${module}`] = updatedAccess;

      // Re-evaluate overall pages.access
      pages.access = Object.keys(newPrivs).some(
        m => m !== 'pages' && (newPrivs[m as PrivilegeKey] as any)?.access === true
      );

      return newPrivs;
    });
  }

  function handleSubmit(values: FormData) {
    const { position, generatePassword, ...employeeData } = values;
    // Use custom privileges if custom role, otherwise use default
    let privileges =
      roleType === 'custom' ? customPrivileges : getDefaultPrivilegesForRole(roleType);

    // STRICT FILTERING: Only include modules that are in the subscription
    const strictlyFilteredPrivileges: UserPrivileges = { ...DEFAULT_PRIVILEGES };

    // Always preserve 'pages' group as it's required for routing
    if (privileges.pages) {
      strictlyFilteredPrivileges.pages = privileges.pages;
    }

    // Only copy over modules that are in the subscription. If no subscription data, save all.
    (resolvedModules ?? Object.keys(privileges)).forEach((modSlug: string) => {
      const slug = modSlug as PrivilegeKey;
      if (privileges[slug]) {
        strictlyFilteredPrivileges[slug] = privileges[slug];
      }
    });

    // Hash the password before submitting
    const hashedPassword = bcrypt.hashSync(employeeData.password, 10);

    onSubmit({
      employee: {
        ...employeeData,
        password: hashedPassword,
        Position: position,
      },
      privileges: strictlyFilteredPrivileges,
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
                          <SelectItem value="storeAdministrator">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="default"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                Store Administrator
                              </Badge>
                              <span>Full store oversight and administration</span>
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
                          <SelectItem value="customer">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-sky-400 text-sky-600">Customer</Badge>
                              <span>Read-only access to orders & wallet</span>
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
                        Choose a predefined role with preset permissions or select custom to pick
                        specific permissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role Module Preview — shows module coverage for preset roles */}
                {roleType !== 'custom' && !isLoadingModules && filteredPermissionGroups.length > 0 && (
                  <RoleModulePreview
                    privileges={customPrivileges}
                    filteredPermissionGroups={filteredPermissionGroups}
                    roleLabel={{
                      globalAdmin: 'Global Admin',
                      systemAdmin: 'System Admin',
                      storeAdministrator: 'Store Administrator',
                      storeManager: 'Store Manager',
                      assistantManager: 'Assistant Manager',
                      cashier: 'Cashier',
                      salesAssociate: 'Sales Associate',
                      inventorySpecialist: 'Inventory Specialist',
                      financeManager: 'Finance Manager',
                      accountant: 'Accountant',
                      kitchenManager: 'Kitchen Manager',
                      chef: 'Chef',
                      waiter: 'Waiter',
                      bartender: 'Bartender',
                      deliveryDriver: 'Delivery Driver',
                      securityGuard: 'Security Guard',
                      maintenanceStaff: 'Maintenance Staff',
                      customer: 'Customer',
                    }[roleType] ?? roleType}
                  />
                )}

                {/* Unified Permissions Section */}
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">
                        {roleType === 'custom' ? (
                          'Select Custom Permissions'
                        ) : (
                          <>
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
                          </>
                        )}
                      </h4>
                      {isLoadingModules && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {isLoadingModules ? (
                      <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Checking subscription modules...</p>
                      </div>
                    ) : filteredPermissionGroups.length === 0 ? (
                      <div className="p-8 text-center border rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                          No modules available for this shop's subscription plan.
                        </p>
                      </div>
                    ) : roleType === 'custom' ? (
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <Accordion type="multiple" className="w-full">
                            {filteredPermissionGroups.map(group => (
                              <AccordionItem key={group.title} value={group.title}>
                                <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                                  {group.title}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="grid grid-cols-1 gap-2 pt-1">
                                    {group.permissions.map((permission: any) => (
                                      <div
                                        key={permission.key}
                                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                                      >
                                        <span className="text-sm text-muted-foreground">
                                          {permission.label}
                                        </span>
                                        <Switch
                                          checked={
                                            customPrivileges[group.module as PrivilegeKey]?.[
                                            permission.key
                                            ] || false
                                          }
                                          onCheckedChange={() =>
                                            handlePrivilegeToggle(
                                              group.module as PrivilegeKey,
                                              permission.key
                                            )
                                          }
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </div>
                    ) : (
                      <PermissionDisplay
                        privileges={customPrivileges}
                        permissionGroups={filteredPermissionGroups}
                      />
                    )}
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
