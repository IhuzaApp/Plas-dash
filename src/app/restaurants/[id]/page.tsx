'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import RestaurantDetails from '@/components/Restaurants/RestaurantDetails';
import { useUpdateRestaurant } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const RestaurantDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const queryClient = useQueryClient();
    const updateRestaurantMutation = useUpdateRestaurant();

    const handleApprove = async (restaurantId: string) => {
        try {
            await updateRestaurantMutation.mutateAsync({
                id: restaurantId,
                is_active: true,
                verified: true,
            });
            toast.success('Restaurant approved successfully');
            queryClient.invalidateQueries({ queryKey: ['api', 'restaurants', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['restaurants'] });
        } catch (err: any) {
            toast.error('Failed to approve restaurant');
            console.error(err);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Restaurant Details"
                    description="View and manage detailed restaurant information."
                    actions={
                        <Button variant="outline" onClick={() => router.back()}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back to List
                        </Button>
                    }
                />

                <RestaurantDetails id={id} onApprove={handleApprove} />
            </div>
        </AdminLayout>
    );
};

export default RestaurantDetailsPage;
