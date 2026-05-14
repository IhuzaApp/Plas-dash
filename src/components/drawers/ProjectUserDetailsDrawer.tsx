import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ProjectUser } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Smartphone, 
  Clock, 
  Settings,
  Activity,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react';

interface ProjectUserDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ProjectUser | null;
}

const ProjectUserDetailsDrawer: React.FC<ProjectUserDetailsDrawerProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  if (!user) return null;

  const DetailItem = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | React.ReactNode, color?: string }) => (
    <div className="flex items-start space-x-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
      <div className={`p-2.5 rounded-xl ${color || 'bg-primary/10 text-primary'} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</p>
        <div className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
          {value || <span className="text-zinc-400 font-normal italic">Not provided</span>}
        </div>
      </div>
    </div>
  );

  const safeFormatDate = (dateStr: string | null | undefined, formatStr: string, fallback: string = 'Not available') => {
    if (!dateStr) return fallback;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatStr);
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0">
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
          <div className="absolute -bottom-12 left-6">
            {user.profile ? (
              <img
                src={user.profile.startsWith('data:') || user.profile.startsWith('http') ? user.profile : `data:image/jpeg;base64,${user.profile}`}
                alt={user.username}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-zinc-950 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-950 shadow-xl flex items-center justify-center">
                <User className="w-12 h-12 text-zinc-400" />
              </div>
            )}
          </div>
          <div className="absolute top-6 right-6">
            <Badge variant={user.is_active ? 'default' : 'destructive'} className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {user.is_active ? (
                <span className="flex items-center gap-1.5"><UserCheck className="w-3 h-3" /> Active</span>
              ) : (
                <span className="flex items-center gap-1.5"><UserX className="w-3 h-3" /> Inactive</span>
              )}
            </Badge>
          </div>
        </div>

        <div className="mt-16 px-6 pb-6 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{user.username}</h2>
            <p className="text-zinc-500 font-medium">Project User Profile</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <DetailItem 
              icon={Shield} 
              label="Role & Access" 
              value={user.role} 
            />
            <DetailItem 
              icon={Mail} 
              label="Email Address" 
              value={user.email} 
              color="bg-blue-500/10 text-blue-500"
            />
            <DetailItem 
              icon={Settings} 
              label="Membership ID" 
              value={user.MembershipId} 
              color="bg-zinc-500/10 text-zinc-500"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Security Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-2xl border ${user.TwoAuth_enabled ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-800'}`}>
                <Activity className={`w-5 h-5 mb-2 ${user.TwoAuth_enabled ? 'text-blue-500' : 'text-zinc-400'}`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Authenticator</p>
                <p className={`text-xs font-bold ${user.TwoAuth_enabled ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-500'}`}>
                  {user.TwoAuth_enabled ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
              <div className={`p-4 rounded-2xl border ${user.sms_auth ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/20' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-800'}`}>
                <Smartphone className={`w-5 h-5 mb-2 ${user.sms_auth ? 'text-orange-500' : 'text-zinc-400'}`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">SMS Auth</p>
                <p className={`text-xs font-bold ${user.sms_auth ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-500'}`}>
                  {user.sms_auth ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Activity Log</h3>
            <div className="space-y-3">
              <DetailItem 
                icon={Clock} 
                label="Last Sign In" 
                value={safeFormatDate(user.last_Login, 'PPP p', 'Never logged in')} 
                color="bg-purple-500/10 text-purple-500"
              />
              <DetailItem 
                icon={Calendar} 
                label="Account Created" 
                value={safeFormatDate(user.created_at, 'PPP')} 
                color="bg-emerald-500/10 text-emerald-500"
              />
              <DetailItem 
                icon={Activity} 
                label="Last Updated" 
                value={safeFormatDate(user.updated_at, 'PPP')} 
                color="bg-amber-500/10 text-amber-500"
              />
            </div>
          </div>

          {user.device_details && (
            <div className="space-y-3 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Device Information</h3>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-start space-x-3">
                <FileText className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {typeof user.device_details === 'string' ? user.device_details : JSON.stringify(user.device_details)}
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectUserDetailsDrawer;
