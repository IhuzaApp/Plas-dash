'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import RecipeManagement from '@/components/pages/pos/production/RecipeManagement';
import { ChefHat } from 'lucide-react';

export default function RecipesPage() {
    return (
        <ProtectedRoute requiredPrivilege="inventory">
            <ProtectedShopRoute>
                <AdminLayout>
                    <PageHeader
                        title="Recipe Management"
                        description="Create and manage production recipes with ingredient costing."
                        icon={<ChefHat className="h-6 w-6" />}
                    />
                    <div className="p-6">
                        <RecipeManagement />
                    </div>
                </AdminLayout>
            </ProtectedShopRoute>
        </ProtectedRoute>
    );
}
