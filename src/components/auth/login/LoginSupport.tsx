import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface LoginSupportProps {
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  supportData: { email: string; sharedId: string; description: string };
  setSupportData: (data: any) => void;
  onSubmitSupport: (e: React.FormEvent) => void;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const LoginSupport: React.FC<LoginSupportProps> = ({
  showHelp,
  setShowHelp,
  supportData,
  setSupportData,
  onSubmitSupport,
  loading,
  success,
  error,
}) => {
  if (!showHelp) {
    return (
      <div className="mt-8 pt-6 border-t border-muted-foreground/10 text-center">
        <button
          onClick={() => setShowHelp(true)}
          className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors duration-300"
        >
          Need help accessing your account?
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-bold tracking-tight">Technical Support</h3>
        <p className="text-sm text-muted-foreground">
          Fill out the form below and our team will get back to you.
        </p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center space-y-3 animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            Ticket submitted successfully! We'll contact you shortly.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => setShowHelp(false)}
          >
            Back to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmitSupport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 ml-1">
              Your Email
            </label>
            <Input
              required
              type="email"
              placeholder="name@example.com"
              className="h-11 bg-muted/30 border-muted-foreground/20 rounded-xl"
              value={supportData.email}
              onChange={(e) => setSupportData({ ...supportData, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 ml-1">
              Shop or Employee ID
            </label>
            <Input
              required
              placeholder="e.g. SHOP-123"
              className="h-11 bg-muted/30 border-muted-foreground/20 rounded-xl"
              value={supportData.sharedId}
              onChange={(e) => setSupportData({ ...supportData, sharedId: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 ml-1">
              Issue Description
            </label>
            <Textarea
              required
              placeholder="Tell us what's happening..."
              className="min-h-[100px] bg-muted/30 border-muted-foreground/20 rounded-xl resize-none"
              value={supportData.description}
              onChange={(e) => setSupportData({ ...supportData, description: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 ml-1">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-11 rounded-xl font-medium"
              onClick={() => setShowHelp(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2] h-11 rounded-xl font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginSupport;
