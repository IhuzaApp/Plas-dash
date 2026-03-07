'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserPrivileges, PrivilegeKey } from '@/types/privileges';
import { PermissionGroup } from '@/lib/privileges/permissionGroups';

interface RoleModulePreviewProps {
    /** Privileges computed for the selected role */
    privileges: UserPrivileges;
    /** Permission groups already filtered to the shop's subscription */
    filteredPermissionGroups: PermissionGroup[];
    /** Human-readable role label */
    roleLabel: string;
}

/**
 * Shows which modules (from the shop's subscription) a role grants access to,
 * and lets the user expand each module to see individual privilege details.
 */
export const RoleModulePreview: React.FC<RoleModulePreviewProps> = ({
    privileges,
    filteredPermissionGroups,
    roleLabel,
}) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggleExpand = (module: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(module) ? next.delete(module) : next.add(module);
            return next;
        });
    };

    const { accessible, restricted } = useMemo(() => {
        const accessible: PermissionGroup[] = [];
        const restricted: PermissionGroup[] = [];
        for (const group of filteredPermissionGroups) {
            const moduleKey = group.module as PrivilegeKey;
            const modulePrivileges = privileges[moduleKey];
            if (modulePrivileges?.access) {
                accessible.push(group);
            } else {
                restricted.push(group);
            }
        }
        return { accessible, restricted };
    }, [filteredPermissionGroups, privileges]);

    if (filteredPermissionGroups.length === 0) return null;

    return (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            {/* Summary bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-medium text-foreground">
                    Module Access for <span className="text-primary">{roleLabel}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        {accessible.length} accessible
                    </Badge>
                    {restricted.length > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                            <Lock className="h-3 w-3" />
                            {restricted.length} restricted
                        </Badge>
                    )}
                </div>
            </div>

            {/* Accessible modules */}
            {accessible.length > 0 && (
                <div className="space-y-1.5">
                    {accessible.map(group => {
                        const moduleKey = group.module as PrivilegeKey;
                        const modulePrivileges = privileges[moduleKey] ?? {};
                        const isOpen = expanded.has(group.module);

                        // Count active permissions (excluding 'access' itself)
                        const activeActions = group.permissions.filter(
                            p => p.key !== 'access' && (modulePrivileges as any)[p.key] === true
                        );

                        return (
                            <div key={group.module} className="rounded-md border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-900/20 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(group.module)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                        <span className="text-sm font-medium text-green-800 dark:text-green-200 truncate">{group.title}</span>
                                        <Badge variant="secondary" className="text-[0.65rem] px-1.5 py-0 h-4 bg-green-200/70 text-green-800 dark:bg-green-800 dark:text-green-200 shrink-0">
                                            {activeActions.length + 1} privilege{activeActions.length !== 0 ? 's' : ''}
                                        </Badge>
                                    </div>
                                    {isOpen ? (
                                        <ChevronDown className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    )}
                                </button>

                                {isOpen && (
                                    <div className="px-3 pb-2.5 pt-0.5 border-t border-green-200/60 dark:border-green-800/60">
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {group.permissions.map(permission => {
                                                const hasIt = (modulePrivileges as any)[permission.key] === true;
                                                return (
                                                    <span
                                                        key={permission.key}
                                                        className={`inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded-full font-medium border
                              ${hasIt
                                                                ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
                                                                : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 line-through'
                                                            }`}
                                                    >
                                                        {permission.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Restricted modules (in subscription, but role doesn't grant access) */}
            {restricted.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[0.72rem] text-muted-foreground font-medium uppercase tracking-wide">
                        In subscription — not granted by this role
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {restricted.map(group => (
                            <span
                                key={group.module}
                                className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-1 rounded-md border bg-muted/40 text-muted-foreground border-muted"
                            >
                                <Lock className="h-2.5 w-2.5 shrink-0" />
                                {group.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {accessible.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    This role has no access to any module in this shop's subscription plan.
                </div>
            )}
        </div>
    );
};

export default RoleModulePreview;
