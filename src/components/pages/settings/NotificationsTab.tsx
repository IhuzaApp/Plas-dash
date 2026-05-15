import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Globe, 
  ShieldAlert, 
  BadgeDollarSign, 
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

interface NotificationsTabProps {
  handleSaveChanges: () => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  handleSaveChanges,
}) => {
  const notificationGroups = [
    {
      title: 'Alerts & Activity',
      description: 'System-wide events and account security alerts.',
      icon: Bell,
      items: [
        { id: 'security', label: 'Security Alerts', description: 'Logins from new devices or password changes.', icon: ShieldAlert, default: true },
        { id: 'updates', label: 'Product Updates', description: 'New features and improvements to the platform.', icon: Globe, default: true },
      ]
    },
    {
      title: 'Business & Finance',
      description: 'Notifications about transactions, payouts, and orders.',
      icon: BadgeDollarSign,
      items: [
        { id: 'payouts', label: 'Payout Confirmations', description: 'When a payout is successfully processed.', icon: BadgeDollarSign, default: true },
        { id: 'orders', label: 'New Orders', description: 'Instant alerts for every new order received.', icon: CheckCircle2, default: true },
      ]
    },
    {
      title: 'Communication',
      description: 'Stay connected with your customers and support.',
      icon: MessageSquare,
      items: [
        { id: 'messages', label: 'Direct Messages', description: 'New messages from customers in the chat hub.', icon: MessageSquare, default: true },
        { id: 'support', label: 'Support Tickets', description: 'Updates on your open support requests.', icon: Bell, default: false },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-none shadow-xl bg-gradient-to-br from-primary/5 to-background rounded-3xl overflow-hidden self-start">
          <CardHeader>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Bell className="h-6 w-6" />
            </div>
            <CardTitle>Delivery Channels</CardTitle>
            <CardDescription>How should we reach you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl border border-muted-foreground/10 bg-background">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Email</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl border border-muted-foreground/10 bg-background">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">SMS</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl border border-muted-foreground/10 bg-background">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Browser</span>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {notificationGroups.map((group, idx) => (
            <Card key={idx} className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/5">
                    <group.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all group">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-muted-foreground/10 group-hover:scale-110 transition-transform">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={item.id} className="text-sm font-bold cursor-pointer">{item.label}</Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                      <Switch id={item.id} defaultChecked={item.default} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveChanges} className="rounded-xl px-12 shadow-lg shadow-primary/20 h-12 gap-2 font-bold">
          <CheckCircle2 className="h-5 w-5" />
          Update Notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationsTab;
