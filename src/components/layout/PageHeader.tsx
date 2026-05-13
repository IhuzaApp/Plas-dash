import React, { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const PageHeader = ({ title, description, icon, actions }: PageHeaderProps) => {
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) {
      const local = localStorage.getItem('orgEmployeeSession');
      if (local) {
        try {
          setLocalUser(JSON.parse(local));
        } catch (e) {}
      }
    }
  }, [session]);

  const displayUser = session?.user || localUser;
  const userImage = displayUser?.image || displayUser?.profile_picture || displayUser?.profile;
  const userName = displayUser?.name || displayUser?.username || 'User';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4">
        {displayUser && (
          <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={userImage} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary p-2 bg-primary/5 rounded-xl">{icon}</div>}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
