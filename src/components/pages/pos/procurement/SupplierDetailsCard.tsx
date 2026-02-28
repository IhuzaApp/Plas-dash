import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Supplier } from '@/lib/data/dummy-procurement';

interface SupplierDetailsCardProps {
    supplier: Supplier | undefined;
}

export function SupplierDetailsCard({ supplier }: SupplierDetailsCardProps) {
    return (
        <Card>
            <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Supplier Information
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {supplier ? (
                    <>
                        <div>
                            <h3 className="font-bold text-lg">{supplier.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{supplier.category} Supplier</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-muted-foreground">Contact:</span>
                                <span className="font-medium">{supplier.contactPerson}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-muted-foreground">Email:</span>
                                <span>{supplier.email}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr]">
                                <span className="text-muted-foreground">Phone:</span>
                                <span>{supplier.phone}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">Supplier details not available.</p>
                )}
            </CardContent>
        </Card>
    );
}
