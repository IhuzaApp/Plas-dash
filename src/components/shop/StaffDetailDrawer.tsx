import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Shield,
    Calendar,
    Activity,
    Store
} from 'lucide-react';

interface StaffDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: any | null;
}

const StaffDetailDrawer: React.FC<StaffDetailDrawerProps> = ({ open, onOpenChange, staff }) => {
    if (!staff) return null;

    const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | React.ReactNode }) => (
        <div className="flex items-start gap-3 py-3">
            <div className="mt-0.5 p-1.5 rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <div className="text-sm font-medium">{value || 'N/A'}</div>
            </div>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader className="pb-6">
                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                        Staff Details
                    </SheetTitle>
                    <SheetDescription>
                        Comprehensive information for {staff.fullnames || staff.name}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    <div className="space-y-6">
                        {/* Header/Status */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{staff.fullnames || staff.name}</h3>
                                    <p className="text-sm text-muted-foreground">{staff.Position || staff.position || 'Staff'}</p>
                                </div>
                            </div>
                            <Badge className={staff.active ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"}>
                                {staff.active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <h4 className="text-sm font-bold mt-4 mb-2 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                Contact Information
                            </h4>
                            <DetailItem icon={Mail} label="Email Address" value={staff.email} />
                            <DetailItem icon={Phone} label="Phone Number" value={staff.phone} />
                            <DetailItem icon={MapPin} label="Home Address" value={staff.Address || staff.address} />

                            <Separator className="my-4" />

                            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                Employment Details
                            </h4>
                            <DetailItem icon={Activity} label="Employee ID" value={staff.employeeID || staff.id.slice(0, 8)} />
                            <DetailItem icon={Store} label="Assigned Store" value={staff.Shops?.name || staff.store || 'Central Store'} />
                            <DetailItem icon={Shield} label="Role Type" value={<Badge variant="outline">{staff.roleType || 'N/A'}</Badge>} />

                            <Separator className="my-4" />

                            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Activity Log
                            </h4>
                            <DetailItem
                                icon={Calendar}
                                label="Joined Date"
                                value={staff.created_on ? format(new Date(staff.created_on), 'PPP') : 'N/A'}
                            />
                            <DetailItem
                                icon={Activity}
                                label="Last Login"
                                value={staff.last_login ? format(new Date(staff.last_login), 'PPP p') : 'Never'}
                            />
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default StaffDetailDrawer;
