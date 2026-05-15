import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationsTabProps {
  handleSaveChanges: () => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  handleSaveChanges,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure how and when you receive notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Email Notifications</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-orders">New Orders</Label>
              <Switch id="email-orders" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-refunds">Refund Requests</Label>
              <Switch id="email-refunds" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-support">Support Tickets</Label>
              <Switch id="email-support" defaultChecked />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Push Notifications</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-orders">New Orders</Label>
              <Switch id="push-orders" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-offers">New Offers</Label>
              <Switch id="push-offers" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-messages">Direct Messages</Label>
              <Switch id="push-messages" defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-zinc-50/50 dark:bg-zinc-900/50 pt-6">
        <Button onClick={handleSaveChanges} className="rounded-xl px-8">
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationsTab;
