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
import { Loader2 } from 'lucide-react';
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
import { OrgEmployee } from '@/hooks/useHasuraApi';
import {
  UserPrivileges,
  PrivilegeKey,
  getDefaultPrivilegesForRole,
  permissionGroups as allPermissionGroups,
} from '@/lib/privileges';
import { DEFAULT_PRIVILEGES } from '@/types/privileges';
import { useShopSubscriptionModules } from '@/hooks/useShopSubscriptionModules';
import { RoleModulePreview } from '@/components/shop/RoleModulePreview';

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

export interface EditStaffDialogProps {
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
  employee: any;
  /** Module slugs from the shop's active subscription plan — passed directly to avoid extra API calls */
  planModuleSlugs?: string[];
}

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
                    const hasAccess =
                      privileges[group.module as PrivilegeKey]?.[permission.key] || false;
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

const EditStaffDialog: React.FC<EditStaffDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  employee,
  planModuleSlugs,
}) => {
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
      position: '',
      active: true,
      roleType: 'cashier',
    },
  });

  // Populate form when dialog opens with employee data
  React.useEffect(() => {
    if (open && employee) {
      const formData = {
        fullnames: employee.fullnames || '',
        email: employee.email || '',
        phone: employee.phone || '',
        Address: employee.Address || '',
        position: employee.Position || '',
        active: employee.active ?? true,
        roleType: (employee.roleType as any) || 'cashier',
      };
      form.reset(formData);

      // Load existing privileges
      const existingPrivs = (employee as any).orgEmployeeRoles?.[0]?.privillages;
      if (existingPrivs && typeof existingPrivs === 'object' && !Array.isArray(existingPrivs)) {
        setCustomPrivileges(existingPrivs as UserPrivileges);
      } else {
        setCustomPrivileges(getDefaultPrivilegesForRole(formData.roleType));
      }
    }
  }, [open, employee, form]);

  const roleType = form.watch('roleType');

  // Update privileges when a preset role is selected
  React.useEffect(() => {
    if (roleType !== 'custom' && open) {
      setCustomPrivileges(getDefaultPrivilegesForRole(roleType));
    }
  }, [roleType, open]);

  const shopId = employee?.shop_id as string;
  const restaurantId = employee?.restaurant_id as string;
  // Only use hook when planModuleSlugs isn't provided directly
  const { availableModules: hookModules, isLoading: isLoadingModules } = useShopSubscriptionModules(
    planModuleSlugs !== undefined ? undefined : shopId,
    planModuleSlugs !== undefined ? undefined : restaurantId
  );

  // undefined = subscription data not available; [] = plan has no modules assigned
  const resolvedModules: string[] | undefined =
    planModuleSlugs !== undefined
      ? planModuleSlugs
      : hookModules.length > 0
        ? hookModules
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

  function handlePrivilegeToggle(module: PrivilegeKey, action: string) {
    setCustomPrivileges(prev => {
      const newValue = !prev[module]?.[action];
      const updatedModule = {
        ...prev[module],
        [action]: newValue,
      };

      if (newValue && action !== 'access') {
        (updatedModule as any).access = true;
      }

      const newPrivs = {
        ...prev,
        [module]: updatedModule,
      };

      if (!newPrivs.pages) {
        newPrivs.pages = { access: false };
      }

      const pages = newPrivs.pages as any;
      const updatedAccess = (newPrivs[module] as any).access;
      pages[`access_${module}`] = updatedAccess;

      pages.access = Object.keys(newPrivs).some(
        m => m !== 'pages' && (newPrivs[m as PrivilegeKey] as any)?.access === true
      );

      return newPrivs;
    });

    if (roleType !== 'custom') {
      form.setValue('roleType', 'custom');
    }
  }

  function handleSubmit(values: FormData) {
    if (!employee) return;

    const { position, ..._ } = values;

    // Smart update: only send changed fields
    const changes: any = {};
    if (values.fullnames !== employee.fullnames) changes.fullnames = values.fullnames;
    if (values.email !== employee.email) changes.email = values.email;
    if (values.phone !== employee.phone) changes.phone = values.phone;
    if (values.Address !== employee.Address) changes.Address = values.Address;
    if (values.position !== employee.Position) changes.Position = values.position;
    if (values.active !== employee.active) changes.active = values.active;
    if (values.roleType !== employee.roleType) changes.roleType = values.roleType;

    const finalChanges = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        return true;
      })
    );

    // Use custom privileges (already synced with pages group)
    const privileges =
      values.roleType === 'custom'
        ? customPrivileges
        : getDefaultPrivilegesForRole(values.roleType);

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

    onSubmit({
      id: employee.id,
      employee: finalChanges,
      privileges: strictlyFilteredPrivileges,
    });
  }

  if (!employee) return null;

  const roleLabel: Record<string, string> = {
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
    custom: 'Custom Role',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update staff member information and role permissions.
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
                        <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Role & Permissions — identical layout to AddStaffDialog */}
            <Card>
              <CardHeader>
                <CardTitle>Role &amp; Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="roleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Type*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                              <span>Full store operations &amp; staff management</span>
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
                              <span>POS operations &amp; customer service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="salesAssociate">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Sales Associate</Badge>
                              <span>Product sales &amp; customer assistance</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inventorySpecialist">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Inventory Specialist</Badge>
                              <span>Stock management &amp; product updates</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="financeManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Finance Manager</Badge>
                              <span>Financial oversight &amp; accounting</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="accountant">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Accountant</Badge>
                              <span>Financial records &amp; reports</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="kitchenManager">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Kitchen Manager</Badge>
                              <span>Food preparation &amp; kitchen operations</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="chef">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Chef</Badge>
                              <span>Food preparation &amp; order management</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="waiter">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Waiter</Badge>
                              <span>Order taking &amp; customer service</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bartender">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Bartender</Badge>
                              <span>Drink orders &amp; inventory</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="deliveryDriver">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Delivery Driver</Badge>
                              <span>Order delivery &amp; basic viewing</span>
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
                              <Badge variant="outline" className="border-sky-400 text-sky-600">
                                Customer
                              </Badge>
                              <span>Read-only access to orders &amp; wallet</span>
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
                {roleType !== 'custom' &&
                  !isLoadingModules &&
                  filteredPermissionGroups.length > 0 && (
                    <RoleModulePreview
                      privileges={customPrivileges}
                      filteredPermissionGroups={filteredPermissionGroups}
                      roleLabel={roleLabel[roleType] ?? roleType}
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
                          <>Permissions for {roleLabel[roleType] ?? roleType}</>
                        )}
                      </h4>
                      {isLoadingModules && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {isLoadingModules ? (
                      <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Checking subscription modules...
                        </p>
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
              <Button type="submit">Update Staff Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;
