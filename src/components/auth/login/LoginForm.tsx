import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Lock, Loader2 } from 'lucide-react';

interface LoginFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  loading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ form, onSubmit, loading }) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="identifier"
            rules={{ required: 'Email or Username is required' }}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 ml-1">
                  Email or Username
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                      placeholder="name@example.com"
                      className="pl-11 h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all duration-300 rounded-xl"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] font-medium ml-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            rules={{ required: 'Password is required' }}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 ml-1">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-11 h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all duration-300 rounded-xl"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[11px] font-medium ml-1" />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 active:scale-[0.98]"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            "Continue to Dashboard"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
