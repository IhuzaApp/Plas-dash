import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

export const FloatingChatButton = () => {
    const router = useRouter();

    const handleChatClick = () => {
        router.push('/pos/ai-chat');
    };

    return (
        <Button
            onClick={handleChatClick}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 p-0"
            aria-label="Open AI Chat"
        >
            <MessageSquarePlus className="h-6 w-6" />
        </Button>
    );
};
