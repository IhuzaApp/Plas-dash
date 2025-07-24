'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/components/layout/RootLayout';
import { PrivilegeKey } from '@/types/privileges';

export function PrivilegeDebug() {
  const { getAllPrivileges, hasModuleAccess, isSuperUser } = usePrivilege();
  const { session } = useAuth();

  const privileges = getAllPrivileges();
  const oldPrivileges = (session as any)?.orgEmployeeRoles?.privillages || [];

  const modules: PrivilegeKey[] = [
    'checkout',
    'staff_management',
    'inventory',
    'transactions',
    'discounts',
    'company_dashboard',
    'shop_dashboard',
    'financial_overview',
    'pos_terminal',
    'orders',
    'products',
    'users',
    'shops',
    'shoppers',
    'settings',
    'refunds',
    'tickets',
    'help',
    'wallet',
    'promotions',
    'delivery_settings',
  ];

  const fixPrivileges = () => {
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('orgEmployeeSession');
      if (sessionStr) {
        try {
          const sessionData = JSON.parse(sessionStr);

          // Create a new privileges object with all access set to true
          const newPrivileges: any = {};
          modules.forEach(module => {
            newPrivileges[module] = { access: true };
          });

          // Update the session
          const updatedSession = {
            ...sessionData,
            privileges: newPrivileges,
          };

          localStorage.setItem('orgEmployeeSession', JSON.stringify(updatedSession));
          window.location.reload();
        } catch (error) {
          console.error('Error fixing privileges:', error);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privilege Debug Information</CardTitle>
          <CardDescription>Current privilege state and debugging information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Module Access Status */}
          <div>
            <h3 className="font-semibold mb-2">Module Access Status:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {modules.map(module => (
                <div key={module} className="flex items-center gap-2 p-2 rounded border">
                  <Badge variant={hasModuleAccess(module) ? 'default' : 'secondary'}>
                    {hasModuleAccess(module) ? '✓' : '✗'}
                  </Badge>
                  <span className="text-sm">{module}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Old Privileges */}
          <div>
            <h3 className="font-semibold mb-2">Old Privileges Array:</h3>
            <div className="bg-muted p-3 rounded text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(oldPrivileges, null, 2)}</pre>
            </div>
          </div>

          {/* New Privileges */}
          <div>
            <h3 className="font-semibold mb-2">New Privileges Object:</h3>
            <div className="bg-muted p-3 rounded text-sm max-h-96 overflow-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(privileges, null, 2)}</pre>
            </div>
          </div>

          {/* Fix Button */}
          <div>
            <Button onClick={fixPrivileges} variant="destructive">
              Fix Privileges (Set All Access to True)
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
              This will set all module access to true and reload the page
            </p>
          </div>

          {/* Session Info */}
          <div>
            <h3 className="font-semibold mb-2">Session Information:</h3>
            <div className="bg-muted p-3 rounded text-sm">
              <p>
                <strong>User ID:</strong> {session?.id}
              </p>
              <p>
                <strong>Email:</strong> {session?.email}
              </p>
              <p>
                <strong>Is Super User:</strong> {isSuperUser() ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Old Privileges Count:</strong> {oldPrivileges.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
