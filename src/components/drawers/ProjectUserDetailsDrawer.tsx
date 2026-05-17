import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  FileText,
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
  const [showAllModules, setShowAllModules] = React.useState(false);

  // Helper to format privilege keys into readable module names
  const formatPrivilegeKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get list of modules user has access to
  const accessibleModules = React.useMemo(() => {
    if (!user?.privileges) return [];
    return Object.entries(user.privileges)
      .filter(([module, permissions]) => {
        if (
          !permissions ||
          typeof permissions !== 'object' ||
          module === 'twoFactorRequired' ||
          module === 'smsAuthRequired'
        )
          return false;
        return Object.values(permissions).some(v => v === true);
      })
      .map(([module]) => module);
  }, [user?.privileges]);

  if (!user) return null;

  const DetailItem = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: string | React.ReactNode;
    color?: string;
  }) => (
    <div className="flex items-start space-x-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
      <div
        className={`p-2.5 rounded-xl ${color || 'bg-primary/10 text-primary'} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
          {label}
        </p>
        <div className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
          {value || <span className="text-zinc-400 font-normal italic">Not provided</span>}
        </div>
      </div>
    </div>
  );

  const safeFormatDate = (
    dateStr: string | null | undefined,
    formatStr: string,
    fallback: string = 'Not available'
  ) => {
    if (!dateStr) return fallback;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatStr);
    } catch (e) {
      return 'Invalid date';
    }
  };

  const displayedModules = showAllModules ? accessibleModules : accessibleModules.slice(0, 12);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0">
        <SheetHeader>
          <SheetTitle className="sr-only">{user.username}&apos;s Detailed Profile</SheetTitle>
          <p className="sr-only">
            Comprehensive view of project user details including roles, contact information, and
            module-specific permissions.
          </p>
        </SheetHeader>

        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
          <div className="absolute -bottom-12 left-8">
            {user.profile ? (
              <img
                src={
                  user.profile.startsWith('data:') || user.profile.startsWith('http')
                    ? user.profile
                    : `data:image/jpeg;base64,${user.profile}`
                }
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
            <Badge
              variant={user.is_active ? 'default' : 'destructive'}
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            >
              {user.is_active ? (
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UserX className="w-3 h-3" /> Inactive
                </span>
              )}
            </Badge>
          </div>
        </div>

        <div className="mt-16 px-8 pb-8 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {user.username}
            </h2>
            <p className="text-zinc-500 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Project {user.role || 'User'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <DetailItem
                icon={Mail}
                label="Email Address"
                value={user.email}
                color="bg-blue-500/10 text-blue-500"
              />
            </div>
            <DetailItem
              icon={Smartphone}
              label="Phone Number"
              value={user.phone}
              color="bg-emerald-500/10 text-emerald-500"
            />
            <DetailItem
              icon={Settings}
              label="Membership ID"
              value={user.MembershipId}
              color="bg-zinc-500/10 text-zinc-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Modal Access
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold">
                {accessibleModules.length} Modules
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {accessibleModules.length > 0 ? (
                displayedModules.map(module => (
                  <div
                    key={module}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                      {formatPrivilegeKey(module)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs text-zinc-400 font-medium italic">
                    No specific modal access configured
                  </p>
                </div>
              )}
            </div>

            {accessibleModules.length > 12 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary mt-2"
                onClick={() => setShowAllModules(!showAllModules)}
              >
                {showAllModules
                  ? 'Show Less'
                  : `View ${accessibleModules.length - 12} More Modules`}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
              Security Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-5 rounded-2xl border-2 ${user.TwoAuth_enabled ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-800'}`}
              >
                <Activity
                  className={`w-6 h-6 mb-3 ${user.TwoAuth_enabled ? 'text-blue-500' : 'text-zinc-400'}`}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                  Authenticator
                </p>
                <p
                  className={`text-sm font-black ${user.TwoAuth_enabled ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-500'}`}
                >
                  {user.TwoAuth_enabled ? 'SECURED' : 'UNSET'}
                </p>
              </div>
              <div
                className={`p-5 rounded-2xl border-2 ${user.sms_auth ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/20' : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-800'}`}
              >
                <Smartphone
                  className={`w-6 h-6 mb-3 ${user.sms_auth ? 'text-orange-500' : 'text-zinc-400'}`}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                  SMS Verification
                </p>
                <p
                  className={`text-sm font-black ${user.sms_auth ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-500'}`}
                >
                  {user.sms_auth ? 'ACTIVE' : 'UNSET'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
              System Audit Log
            </h3>
            <div className="space-y-3">
              <DetailItem
                icon={Clock}
                label="Last Identity Access"
                value={safeFormatDate(user.last_Login, 'PPP p', 'No login history record')}
                color="bg-purple-500/10 text-purple-500"
              />
              <DetailItem
                icon={Calendar}
                label="Onboarding Date"
                value={safeFormatDate(user.created_at, 'PPP')}
                color="bg-emerald-500/10 text-emerald-500"
              />
              <DetailItem
                icon={Activity}
                label="Profile Integrity Check"
                value={`Verified on ${safeFormatDate(user.updated_at, 'MMM dd, yyyy')}`}
                color="bg-amber-500/10 text-amber-500"
              />
            </div>
          </div>

          {user.device_details && (
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                Verified Device Fingerprint
              </h3>
              <div className="p-5 rounded-2xl bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-start space-x-3 shadow-inner">
                <FileText className="w-5 h-5 shrink-0 mt-0.5 opacity-50" />
                <p className="text-[11px] font-mono leading-relaxed break-all">
                  {typeof user.device_details === 'string'
                    ? user.device_details
                    : JSON.stringify(user.device_details)}
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
