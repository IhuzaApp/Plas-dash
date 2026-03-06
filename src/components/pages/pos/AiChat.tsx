import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MessageSquare,
    Plus,
    Send,
    Bot,
    User,
    MoreVertical,
    Database,
    BarChart,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/layout/RootLayout';

// Mock data structures - in a real app this would come from an API/Backend
interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    lastUpdated: Date;
    messages: ChatMessage[];
}

const mockSessions: ChatSession[] = [
    {
        id: '1',
        title: 'Monthly Revenue Report Analysis',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        messages: [
            {
                id: 'm1',
                role: 'user',
                content: 'Can you show me the revenue breakdown for this month?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
            },
            {
                id: 'm2',
                role: 'ai',
                content: 'Certainly! Here is a summary of the revenue for this month. The total revenue across all branches sits at $54,320, which is up 12% from last month. The highest performing category is "Fresh Produce". Would you like me to generate a detailed CSV report?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 30) // 30s later
            }
        ]
    },
    {
        id: '2',
        title: 'Top Selling Products Inquiry',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        messages: [
            {
                id: 'm3',
                role: 'user',
                content: 'What were the top 5 selling items yesterday?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
            },
            {
                id: 'm4',
                role: 'ai',
                content: 'Based on the sales data from yesterday, the top 5 selling items were:\n1. Whole Milk (2L)\n2. Sliced Bread\n3. Bananas\n4. Free Range Eggs (Dozen)\n5. Avocado',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 45)
            }
        ]
    }
];

const AiChat = () => {
    const { session } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId, isTyping]);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const handleNewChat = () => {
        setActiveSessionId(null);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        let targetSessionId = activeSessionId;

        if (!targetSessionId) {
            // Create a new session
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: inputValue.substring(0, 30) + (inputValue.length > 30 ? '...' : ''),
                lastUpdated: new Date(),
                messages: [newMessage]
            };
            setSessions([newSession, ...sessions]);
            targetSessionId = newSession.id;
            setActiveSessionId(newSession.id);
        } else {
            // Add to existing session
            setSessions(prev => prev.map(s => {
                if (s.id === targetSessionId) {
                    return {
                        ...s,
                        lastUpdated: new Date(),
                        messages: [...s.messages, newMessage]
                    };
                }
                return s;
            }).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())); // Push active to top
        }

        setInputValue('');
        setIsTyping(true);

        // Mock AI Response
        setTimeout(() => {
            const aiResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: `I've received your query about "${newMessage.content.substring(0, 20)}...". I am accessing the pos database to generate the requested reports. This is a mocked AI response for demonstration purposes.`,
                timestamp: new Date()
            };

            setSessions(prev => prev.map(s => {
                if (s.id === targetSessionId) {
                    return {
                        ...s,
                        lastUpdated: new Date(),
                        messages: [...s.messages, aiResponse]
                    };
                }
                return s;
            }));
            setIsTyping(false);
        }, 1500);
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <AdminLayout>
            <PageHeader
                title="AI Assistant"
                description="Query database, generate reports, and get insights using natural language"
                icon={<Bot className="h-6 w-6" />}
            />

            <div className="flex h-[calc(100vh-12rem)] min-h-[500px] mt-4 gap-4">
                {/* Sidebar - Chat History */}
                <Card className="w-1/4 max-w-[300px] hidden md:flex flex-col overflow-hidden border-r bg-card">
                    <div className="p-4 border-b">
                        <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant="default">
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">
                                Recent Chats
                            </div>
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setActiveSessionId(session.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-3 rounded-lg flex flex-col gap-1 transition-colors hover:bg-muted/80",
                                        activeSessionId === session.id ? "bg-muted" : "transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start w-full gap-2">
                                        <span className="font-medium text-sm truncate flex-1">{session.title}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(session.lastUpdated)}
                                    </span>
                                </button>
                            ))}

                            {sessions.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground pt-4">
                                    No previous chats
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Main Chat Area */}
                <Card className="flex-1 flex flex-col overflow-hidden relative border shadow-sm">
                    {/* Chat Headers/Empty State */}
                    {!activeSessionId && sessions.length > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-background/50 z-10">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <Bot className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2 text-center text-foreground">How can I help you today?</h2>
                            <p className="text-muted-foreground text-center max-w-md mb-8">
                                Ask me anything about your POS data, inventory, sales trends, or staff performance. I can generate real-time reports.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                <Button variant="outline" className="justify-start gap-3 h-auto py-3 text-left whitespace-normal h-full" onClick={() => setInputValue("Show me the total revenue for all branches this week.")}>
                                    <BarChart className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span>Show me the total revenue for all branches this week.</span>
                                </Button>
                                <Button variant="outline" className="justify-start gap-3 h-auto py-3 text-left whitespace-normal h-full" onClick={() => setInputValue("Which products are running low on stock?")}>
                                    <Database className="h-5 w-5 text-orange-500 shrink-0" />
                                    <span>Which products are running low on stock?</span>
                                </Button>
                                <Button variant="outline" className="justify-start gap-3 h-auto py-3 text-left whitespace-normal h-full" onClick={() => setInputValue("Generate a daily summary report for yesterday.")}>
                                    <FileText className="h-5 w-5 text-green-500 shrink-0" />
                                    <span>Generate a daily summary report for yesterday.</span>
                                </Button>
                                <Button variant="outline" className="justify-start gap-3 h-auto py-3 text-left whitespace-normal h-full" onClick={() => setInputValue("Who were the most active staff members today?")}>
                                    <User className="h-5 w-5 text-purple-500 shrink-0" />
                                    <span>Who were the most active staff members today?</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                        {activeSession?.messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-4 max-w-3xl",
                                    message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>

                                <div className={cn(
                                    "px-4 py-3 rounded-2xl whitespace-pre-wrap break-words text-sm",
                                    message.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                                )}>
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-4 max-w-3xl mr-auto">
                                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-muted text-foreground rounded-tl-sm flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" />
                                    <span className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <span className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background relative z-20">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask for reports, sales data, or general queries..."
                                className="flex-1 shadow-sm focus-visible:ring-1 bg-muted/30"
                                autoFocus
                            />
                            <Button type="submit" disabled={!inputValue.trim() || isTyping} size="icon">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send message</span>
                            </Button>
                        </form>
                        <div className="text-center mt-2 text-xs text-muted-foreground">
                            AI Assistant can access live database metrics and generate POS reports.
                        </div>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AiChat;
