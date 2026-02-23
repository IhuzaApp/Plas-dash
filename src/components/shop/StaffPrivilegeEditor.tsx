import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, Loader2, Info } from 'lucide-react';
import { permissionGroups } from '@/lib/privileges/permissionGroups';
import { UserPrivileges, PrivilegeKey } from '@/types/privileges';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getDefaultPrivilegesForRole } from '@/lib/privileges';

interface StaffPrivilegeEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: any | null;
    onSave: (privileges: UserPrivileges, roleType: string) => Promise<void>;
}

// List of modules related to POS only
const POS_MODULE_TITLES = [
    'Checkout & POS',
    'Staff Management',
    'Inventory Management',
    'Transactions',
    'Discounts',
    'Dashboards', // Both Shop and Company (if restricted later, can adjust)
    'POS Terminal',
    'Products'
];

const StaffPrivilegeEditor: React.FC<StaffPrivilegeEditorProps> = ({
    open,
    onOpenChange,
    staff,
    onSave,
}) => {
    const [privileges, setPrivileges] = useState<UserPrivileges>({});
    const [roleType, setRoleType] = useState<string>('custom');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && staff) {
            setRoleType(staff.roleType || 'custom');

            let parsedPrivs = staff.privileges;
            if (typeof staff.privileges === 'string') {
                try {
                    parsedPrivs = JSON.parse(staff.privileges);
                } catch (e) {
                    console.error('Failed to parse privileges:', e);
                    parsedPrivs = {};
                }
            }
            setPrivileges(parsedPrivs || {});
        } else if (open) {
            setRoleType('cashier');
            setPrivileges(getDefaultPrivilegesForRole('cashier'));
        }
    }, [open, staff]);

    const handleRoleChange = (newRole: string) => {
        setRoleType(newRole);
        if (newRole !== 'custom') {
            const defaultPrivs = getDefaultPrivilegesForRole(newRole);
            setPrivileges(defaultPrivs);
        }
    };

    const togglePermission = (moduleKey: string, permissionKey: string) => {
        setRoleType('custom');
        setPrivileges(prev => {
            const modulePrivs = prev[moduleKey as keyof UserPrivileges] || { access: false };
            const newValue = !modulePrivs[permissionKey as keyof typeof modulePrivs];

            const updatedModule = {
                ...modulePrivs,
                [permissionKey]: newValue,
            };

            // Automatically enable/disable module access if a sub-permission is toggled
            // AND Sync with pages module for sidebar visibility
            const newPrivs = {
                ...prev,
                [moduleKey]: updatedModule,
            };

            // If we enabled an action, ensure module access is also true
            if (newValue && permissionKey !== 'access') {
                (newPrivs[moduleKey as keyof UserPrivileges] as any).access = true;
            }

            // Sync with pages module
            if (!newPrivs.pages) {
                newPrivs.pages = { access: false };
            }

            const pages = newPrivs.pages as any;
            const updatedAccess = (newPrivs[moduleKey as keyof UserPrivileges] as any).access;
            pages[`access_${moduleKey}`] = updatedAccess;

            // Re-evaluate overall pages.access
            pages.access = Object.keys(newPrivs).some(m =>
                m !== 'pages' && (newPrivs[m as keyof UserPrivileges] as any)?.access === true
            );

            return newPrivs;
        });
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await onSave(privileges, roleType);
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || 'Failed to update privileges');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter permission groups to POS relevant ones
    const filteredGroups = permissionGroups.filter(group =>
        POS_MODULE_TITLES.includes(group.title) ||
        group.title.includes('Dashboard') ||
        group.title.toLowerCase().includes('pos')
    );

    if (!staff) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Shield className="h-5 w-5 text-primary" />
                        Edit Staff Privileges
                    </DialogTitle>
                    <DialogDescription>
                        Manage Point of Sale permissions for {staff.fullnames || staff.name}
                    </DialogDescription>
                </DialogHeader>

                <Alert className="bg-blue-50/50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-700">
                        These privileges strictly control POS-related activities. Changes take effect on next login.
                    </AlertDescription>
                </Alert>

                <div className="mt-6 space-y-4 px-1">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="role-type" className="text-sm font-semibold">User Role</Label>
                        <Select value={roleType} onValueChange={handleRoleChange}>
                            <SelectTrigger id="role-type" className="w-full">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="globalAdmin">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive">Global Admin</Badge>
                                        <span className="text-xs text-muted-foreground">Full system access</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="systemAdmin">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default">System Admin</Badge>
                                        <span className="text-xs text-muted-foreground">Limited system access</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="storeManager">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default">Store Manager</Badge>
                                        <span className="text-xs text-muted-foreground">Full store operations</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="assistantManager">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Assistant Manager</Badge>
                                        <span className="text-xs text-muted-foreground">Limited staff access</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="cashier">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Cashier</Badge>
                                        <span className="text-xs text-muted-foreground">POS operations</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="salesAssociate">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Sales Associate</Badge>
                                        <span className="text-xs text-muted-foreground">Sales & service</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="inventorySpecialist">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Inventory Specialist</Badge>
                                        <span className="text-xs text-muted-foreground">Stock management</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="custom">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Custom</Badge>
                                        <span className="text-xs text-muted-foreground">Custom permissions</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground px-1">
                            Changing the role will reset permissions to that role's default values.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-2 px-1">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                        Detailed Permissions
                    </span>
                    <Separator className="flex-1" />
                </div>

                <ScrollArea className="flex-1 mt-4 pr-4">
                    <div className="space-y-8">
                        {filteredGroups.map((group, groupIdx) => (
                            <div key={group.module} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-base">{group.title}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-2">
                                    {group.permissions.map(permission => {
                                        const id = `${group.module}-${permission.key}`;
                                        const isChecked = privileges[group.module as keyof UserPrivileges]?.[permission.key as any] || false;

                                        return (
                                            <div key={id} className="flex items-center space-x-3 space-y-0">
                                                <Checkbox
                                                    id={id}
                                                    checked={isChecked}
                                                    onCheckedChange={() => togglePermission(group.module, permission.key)}
                                                />
                                                <Label
                                                    htmlFor={id}
                                                    className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {permission.label}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {groupIdx < filteredGroups.length - 1 && <Separator className="mt-6" />}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {error && (
                    <div className="mt-4 text-sm font-medium text-destructive">
                        {error}
                    </div>
                )}

                <DialogFooter className="mt-6 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Privileges
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StaffPrivilegeEditor;
