import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface LoginHeaderProps {
  businessName?: string;
  businessLogo?: string | null;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ businessName, businessLogo }) => {
  return (
    <DialogHeader className="mb-6">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group transition-all duration-500 hover:scale-110 overflow-hidden">
          <img
            src={
              businessLogo
                ? businessLogo.startsWith('http') || businessLogo.startsWith('data:')
                  ? businessLogo
                  : `data:image/png;base64,${businessLogo}`
                : '/Assets/logo/Plas Icon.png'
            }
            alt={businessName || 'Plas Logo'}
            className="w-10 h-10 object-contain"
          />
        </div>
        <div className="space-y-1.5 text-center">
          <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            {businessName || 'Welcome back'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-medium">
            {businessName ? `Log in to your ${businessName} portal` : 'Log in to your account'}
          </p>
        </div>
      </div>
      <DialogDescription className="sr-only">
        Enter your credentials to access the dashboard.
      </DialogDescription>
    </DialogHeader>
  );
};

export default LoginHeader;
