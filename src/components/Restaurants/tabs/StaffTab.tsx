'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface StaffTabProps {
    staff: any[];
}

const StaffTab: React.FC<StaffTabProps> = ({ staff }) => {
    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center">
                        <Users className="h-5 w-5 mr-2" /> Organization Employees
                    </CardTitle>
                    <CardDescription>Total employees: {staff?.length || 0}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff?.length > 0 ? (
                                staff.map((emp: any) => (
                                    <TableRow key={emp.id}>
                                        <TableCell className="font-medium">{emp.fullnames}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">{emp.Position}</div>
                                            <div className="text-xs text-muted-foreground">{emp.roleType}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">{emp.email}</div>
                                            <div className="text-xs text-muted-foreground">{emp.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={emp.active ? 'outline' : 'secondary'} className={emp.active ? 'border-green-600 text-green-600' : ''}>
                                                {emp.active ? 'Online' : 'Offline'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No employees registered for this restaurant.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default StaffTab;
