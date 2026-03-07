'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Layers, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';
import { apiGet, apiPost } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import Pagination from '@/components/ui/pagination';
import { ModulePreviewDialog } from './_components/ModulePreviewDialog';
import React from 'react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Preview Dialog State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);

  const handleOpenPreview = (mod: ModuleData) => {
    setSelectedModule(mod);
    setIsPreviewOpen(true);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

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

  const filteredModules = useMemo(() => {
    if (!data?.modules) return [];
    return data.modules.filter(
      mod =>
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mod.group_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.modules, searchQuery]);

  const groupedModules = useMemo(() => {
    const groups: Record<string, ModuleData[]> = {};

    // Paginate the filtered list first if we want pagination within categories
    // Otherwise, just show all filtered results
    const start = (currentPage - 1) * pageSize;
    const paged = filteredModules.slice(start, start + pageSize);

    paged.forEach(mod => {
      const group = mod.group_name || 'Uncategorized';
      if (!groups[group]) groups[group] = [];
      groups[group].push(mod);
    });
    return groups;
  }, [filteredModules, currentPage, pageSize]);

  const totalPages = Math.ceil((filteredModules.length || 0) / pageSize);
  const handleSyncModules = async () => {
    setIsSyncing(true);
    try {
      const res = await apiPost<{ message: string; count: number }>(
        '/api/subscriptions/sync-modules',
        {}
      );
      toast({
        title: 'Sync Successful',
        description: `Successfully synchronized ${res.count} modules from the codebase.`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to synchronize modules.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">System Modules</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Synchronized application features grouped by categories.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncModules}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync with Code'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search modules by name, slug, or category..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Module Name</TableHead>
              <TableHead>Slug Identifier</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : Object.keys(groupedModules).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No modules found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedModules).map(([category, modules]) => {
                const isExpanded = expandedCategories.has(category);
                return (
                  <React.Fragment key={category}>
                    <TableRow
                      className="bg-muted/30 hover:bg-muted/50 border-y cursor-pointer transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <TableCell colSpan={5} className="py-2">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            {category}
                          </span>
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 px-1.5 py-0 text-[10px] font-medium"
                          >
                            {modules.length}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded &&
                      modules.map(mod => (
                        <TableRow
                          key={mod.id}
                          className="animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                          <TableCell className="font-medium pl-10">{mod.name}</TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-xs border font-mono">
                              {mod.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {mod.group_name || 'Uncategorized'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground font-mono tabular-nums">
                            {format(new Date(mod.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-2"
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenPreview(mod);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        {filteredModules.length > pageSize && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredModules.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      <ModulePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        module={selectedModule}
      />
    </div>
  );
}
