'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MODULE_DESCRIPTIONS } from '@/lib/privileges/moduleDescriptions';
import { permissionGroups } from '@/lib/privileges/permissionGroups';
import { PrivilegeKey } from '@/types/privileges';
import { Info, Shield, Zap } from 'lucide-react';
import { ModuleData } from '../page';

interface ModulePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleData | null;
}

export function ModulePreviewDialog({ open, onOpenChange, module }: ModulePreviewDialogProps) {
  if (!module) return null;

  const slug = module.slug as PrivilegeKey;
  const description = MODULE_DESCRIPTIONS[slug];
  const group = permissionGroups.find(g => g.module === slug);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{module.name}</DialogTitle>
              <DialogDescription className="font-mono text-xs mt-1">
                SLUG: {module.slug} | CATEGORY: {module.group_name || 'Uncategorized'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-6 mt-4">
            {/* Summary Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Info className="h-4 w-4" />
                Description
              </h3>
              <div className="bg-muted/40 rounded-lg p-4 border italic text-sm text-foreground/80 leading-relaxed">
                {description?.description ||
                  'No detailed description available in codebase for this module.'}
              </div>
            </div>

            {/* Actions & Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <Zap className="h-4 w-4" />
                  Actions & Permissions
                </h3>
                <Badge variant="outline" className="font-medium">
                  {description?.actions.length || group?.permissions.length || 0} Total
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {description?.actions ? (
                  description.actions.map(action => (
                    <div
                      key={action.key}
                      className="p-3 bg-card border rounded-md shadow-sm hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">
                          {action.label}
                        </span>
                        <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                          {action.key}
                        </code>
                        <p className="text-xs text-muted-foreground leading-snug mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : group?.permissions ? (
                  group.permissions.map(perm => (
                    <div key={perm.key} className="p-3 bg-card border rounded-md shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{perm.label}</span>
                        <code className="text-[10px] text-muted-foreground font-mono">
                          {perm.key}
                        </code>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No explicit permissions defined for this module.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/10 flex justify-end">
          <Badge
            variant="secondary"
            className="font-normal text-[10px] text-muted-foreground uppercase"
          >
            Source: Codebase Definitions
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
