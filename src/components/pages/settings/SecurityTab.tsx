import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface SecurityTabProps {
  passwordState: { current: string; new: string; confirm: string };
  setPasswordState: React.Dispatch<
    React.SetStateAction<{ current: string; new: string; confirm: string }>
  >;
  handleChangePassword: () => Promise<void>;
  isUpdatingPassword: boolean;
  isTwoFactorEnabled: boolean;
  handleToggle2FA: (enabled: boolean) => Promise<void>;
  handleReset2FA: () => Promise<void>;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  passwordState,
  setPasswordState,
  handleChangePassword,
  isUpdatingPassword,
  isTwoFactorEnabled,
  handleToggle2FA,
  handleReset2FA,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage your password and account security options.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                className="rounded-xl"
                value={passwordState.current}
                onChange={e => setPasswordState(prev => ({ ...prev, current: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                className="rounded-xl"
                value={passwordState.new}
                onChange={e => setPasswordState(prev => ({ ...prev, new: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                className="rounded-xl"
                value={passwordState.confirm}
                onChange={e => setPasswordState(prev => ({ ...prev, confirm: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isUpdatingPassword}
            className="rounded-xl"
          >
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>

        <div className="pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                {isTwoFactorEnabled && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                    Enabled
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isTwoFactorEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs h-8 border-red-500/20 text-red-600 hover:bg-red-500/10"
                  onClick={handleReset2FA}
                >
                  Reset & Setup New
                </Button>
              )}
              <Switch
                checked={isTwoFactorEnabled}
                onCheckedChange={handleToggle2FA}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityTab;
