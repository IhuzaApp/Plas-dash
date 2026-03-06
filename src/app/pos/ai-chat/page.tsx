'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProtectedShopRoute from '@/components/auth/ProtectedShopRoute';
import AiChat from '@/components/pages/pos/AiChat';
import { useAuth } from '@/components/layout/RootLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function AiChatPage() {
    const { session } = useAuth();

    // Prevent project users from accessing pos-specific tools if necessary, similar to dashboard.
    if (session?.isProjectUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Alert className="max-w-md">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        This page is for Organization Employees only. Project Users should use the main dashboard.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredPrivilege="company_dashboard">
            <ProtectedShopRoute>
                <AiChat />
            </ProtectedShopRoute>
        </ProtectedRoute>
    );
}
