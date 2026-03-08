'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Utensils, Search, Edit2, Play, Pause, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useUpdateRestaurantDish } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import EditDishDrawer from '../drawers/EditDishDrawer';

interface DishesTabProps {
    dishes: any[];
    onRefresh?: () => void;
}

const DishesTab: React.FC<DishesTabProps> = ({ dishes, onRefresh }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDish, setSelectedDish] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const updateDish = useUpdateRestaurantDish();

    const filteredDishes = useMemo(() => {
        if (!dishes) return [];
        return dishes.filter((rd: any) => {
            const name = rd.dishes?.name?.toLowerCase() || '';
            const sku = rd.SKU?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();
            return name.includes(query) || sku.includes(query);
        });
    }, [dishes, searchQuery]);

    const handleToggleStatus = async (rd: any) => {
        try {
            await updateDish.mutateAsync({
                id: rd.id,
                is_active: !rd.is_active,
                discount: rd.discount?.toString() || '0',
                quantity: rd.quantity?.toString() || '0',
                preparingTime: rd.preparingTime || '',
                price: rd.price || '0',
                promo: !!rd.promo,
                promo_type: rd.promo_type || '',
                dish_id: rd.dish_id,
                product_id: rd.product_id,
                updated_at: new Date().toISOString(),
            });
            toast.success(`Dish ${!rd.is_active ? 'enabled' : 'disabled'} successfully`);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error toggling dish status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleEdit = (rd: any) => {
        setSelectedDish(rd);
        setIsEditOpen(true);
    };

    return (
        <Card>
            <CardHeader className="pb-2 space-y-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center">
                            <Utensils className="h-5 w-5 mr-2 text-primary" /> Restaurant Dishes
                        </CardTitle>
                        <CardDescription>Total dishes: {dishes?.length || 0}</CardDescription>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or SKU..."
                        className="pl-9 bg-muted/50 focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md overflow-hidden bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Dish</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Pricing</TableHead>
                                <TableHead>Inventory</TableHead>
                                <TableHead>Prep Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDishes.length > 0 ? (
                                filteredDishes.map((rd: any) => (
                                    <TableRow key={rd.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                                                    <img
                                                        src={rd.dishes?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&h=100&auto=format&fit=crop'}
                                                        alt={rd.dishes?.name || 'Dish'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{rd.dishes?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">SKU: {rd.SKU || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                {rd.dishes?.category || 'General'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{rd.price}</span>
                                                {rd.discount > 0 && (
                                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1 rounded inline-block w-fit">
                                                        -{rd.discount}% OFF
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs">{rd.quantity || 0} in stock</span>
                                                {rd.promo && <span className="text-[10px] text-primary truncate max-w-[80px]">Promo: {rd.promo}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {rd.preparingTime || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={rd.is_active ? 'default' : 'secondary'}
                                                className={`h-6 text-[10px] uppercase font-bold tracking-wider ${rd.is_active ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                            >
                                                {rd.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={() => handleEdit(rd)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-8 w-8 ${rd.is_active ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
                                                    onClick={() => handleToggleStatus(rd)}
                                                    disabled={updateDish.isPending && updateDish.variables?.id === rd.id}
                                                >
                                                    {updateDish.isPending && updateDish.variables?.id === rd.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : rd.is_active ? (
                                                        <Pause className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Play className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-1">
                                            <p>No dishes found matching your search.</p>
                                            {searchQuery && (
                                                <Button variant="link" size="sm" onClick={() => setSearchQuery('')}>
                                                    Clear search
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {selectedDish && (
                <EditDishDrawer
                    dish={selectedDish}
                    isOpen={isEditOpen}
                    onClose={() => {
                        setIsEditOpen(false);
                        setSelectedDish(null);
                    }}
                    onSuccess={onRefresh}
                />
            )}
        </Card>
    );
};

export default DishesTab;
