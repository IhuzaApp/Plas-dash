'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Mail, Shield, Lock } from 'lucide-react';
import { PROJECT_ROLE_TYPES } from '@/lib/privileges/projectRolePrivileges';
import { ProjectUser } from '@/hooks/useHasuraApi';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(PROJECT_ROLE_TYPES),
  is_active: z.boolean().default(true),
  TwoAuth_enabled: z.boolean().default(false),
  gender: z.string().optional(),
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface EditProjectUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  user: ProjectUser | null;
}

const EditProjectUserDialog: React.FC<EditProjectUserDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'customerSupport',
      is_active: true,
      TwoAuth_enabled: false,
      gender: '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: (user.role as any) || 'customerSupport',
        is_active: user.is_active || true,
        TwoAuth_enabled: user.TwoAuth_enabled || false,
        gender: user.gender || '',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement the actual API call to update project user
      console.log('Updating project user:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Project user updated successfully');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating project user:', error);
      toast.error('Failed to update project user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Project User
          </DialogTitle>
          <DialogDescription>
            Update project user information and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Enter username"
                {...form.register('username')}
                className={form.formState.errors.username ? 'border-red-500' : ''}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-red-500' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                {...form.register('password')}
                className={form.formState.errors.password ? 'border-red-500' : ''}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                {...form.register('confirmPassword')}
                className={form.formState.errors.confirmPassword ? 'border-red-500' : ''}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(value) => form.setValue('role', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customerSupport">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Customer Support
                    </div>
                  </SelectItem>
                  <SelectItem value="systemAdmin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      System Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="projectManager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Project Manager
                    </div>
                  </SelectItem>
                  <SelectItem value="projectAdmin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Global System Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.watch('gender')}
                onValueChange={(value) => form.setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable the user account
                </p>
              </div>
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="TwoAuth_enabled">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Enable 2FA for enhanced security
                </p>
              </div>
              <Switch
                id="TwoAuth_enabled"
                checked={form.watch('TwoAuth_enabled')}
                onCheckedChange={(checked) => form.setValue('TwoAuth_enabled', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Update User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectUserDialog; 