import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const PageHeader = ({ title, description, icon, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4">
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
