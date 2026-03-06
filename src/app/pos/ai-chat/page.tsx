'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AiChat from '@/components/pages/pos/AiChat';
import { useAuth } from '@/components/layout/RootLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function AiChatPage() {
    const { session } = useAuth();

    // Deny access if they explicitly lack the ai_chat privilege
    if (!session?.privileges?.ai_chat?.access) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Alert className="max-w-md">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        You do not have permission to access the AI Chat.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredPrivilege="ai_chat">
            <AiChat />
        </ProtectedRoute>
    );
}
