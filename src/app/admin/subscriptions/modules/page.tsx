'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';
import { apiGet } from '@/lib/api';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ModuleDialog } from './_components/ModuleDialog';
import Pagination from '@/components/ui/pagination';

export interface ModuleData {
    id: string;
    name: string;
    slug: string;
    group_name: string | null;
    created_at: string;
}

export default function ModulesPage() {
    const { session } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<Partial<ModuleData> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Security Check: any user with the 'subscriptions.access' privilege can view this page.
    if (session && !hasPrivilege(session.privileges, 'subscriptions', 'access', session.role)) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
            </div>
        );
    }

    const { data, isLoading, refetch } = useQuery<{ modules: ModuleData[] }>({
        queryKey: ['modules'],
        queryFn: () => apiGet<{ modules: ModuleData[] }>('/api/queries/modules'),
    });

    const paginatedModules = useMemo(() => {
        if (!data?.modules) return [];
        const start = (currentPage - 1) * pageSize;
        return data.modules.slice(start, start + pageSize);
    }, [data?.modules, currentPage, pageSize]);

    const totalPages = Math.ceil((data?.modules?.length || 0) / pageSize);

    const handleOpenDialog = (mod?: ModuleData) => {
        setSelectedModule(mod || null);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedModule(null);
        setIsDialogOpen(false);
        refetch();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Modules</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage application features and group them for plan assignments.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Module
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Module Name</TableHead>
                            <TableHead>Slug Identifier</TableHead>
                            <TableHead>Group Category</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : !data?.modules?.length ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No modules found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedModules.map((mod) => (
                                <TableRow key={mod.id}>
                                    <TableCell className="font-medium">{mod.name}</TableCell>
                                    <TableCell>
                                        <code className="rounded bg-muted px-2 py-1 text-sm border font-mono">
                                            {mod.slug}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        {mod.group_name ? (
                                            <Badge variant="secondary">{mod.group_name}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground italic text-sm">Uncategorized</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(mod.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(mod)}>
                                                <Edit className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    toast({ title: 'Pending feature', description: 'Module deletion UI to be implemented.' });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {data?.modules && data.modules.length > pageSize && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={data.modules.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                )}
            </div>

            <ModuleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={handleCloseDialog}
                initialData={selectedModule}
            />
        </div>
    );
}
