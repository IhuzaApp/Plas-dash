'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DishesTabProps {
    dishes: any[];
}

const DishesTab: React.FC<DishesTabProps> = ({ dishes }) => {
    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center">
                        <Utensils className="h-5 w-5 mr-2" /> Restaurant Dishes
                    </CardTitle>
                    <CardDescription>Total dishes: {dishes?.length || 0}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dish</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dishes?.length > 0 ? (
                                dishes.map((rd: any) => (
                                    <TableRow key={rd.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                                                    <img
                                                        src={rd.dishes?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&h=100&auto=format&fit=crop'}
                                                        alt={rd.dishes?.name || 'Dish'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div>{rd.dishes?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground">SKU: {rd.SKU}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{rd.dishes?.category || 'N/A'}</TableCell>
                                        <TableCell className="font-medium">
                                            {rd.price}
                                            {rd.discount > 0 && <span className="ml-1 text-xs text-green-600">(-{rd.discount}%)</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={rd.is_active ? 'outline' : 'secondary'} className={rd.is_active ? 'border-green-600 text-green-600' : ''}>
                                                {rd.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No dishes found for this restaurant.
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

export default DishesTab;
