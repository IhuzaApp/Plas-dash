'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Mail, Shield, Lock, Upload, X } from 'lucide-react';
import { PROJECT_ROLE_TYPES } from '@/lib/privileges/projectRolePrivileges';
import { ProjectUser, useUpdateProjectUser } from '@/hooks/useHasuraApi';

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
  profile: z.string().optional(),
}).refine((data) => {
  // Only validate password matching if password is provided
  if (data.password && data.password.trim()) {
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

// Image upload and conversion to base64
const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const EditProjectUserDialog: React.FC<EditProjectUserDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  user,
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the update mutation hook
  const updateProjectUserMutation = useUpdateProjectUser();

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
      profile: '',
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
        profile: user.profile || '',
      });
      setProfileImage(user.profile || null);
    }
  }, [user, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setProfileImage(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open, form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      const base64 = await convertImageToBase64(file);
      setProfileImage(base64);
      setImageFile(file);
      form.setValue('profile', base64);
      toast.success('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImageFile(null);
    form.setValue('profile', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Profile image removed');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    try {
      // Prepare the update data - only include fields that are actually being updated
      const updateData: any = {
        id: user.id,
        username: data.username,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
        TwoAuth_enabled: data.TwoAuth_enabled,
      };

      // Only include optional fields if they have values
      if (data.gender && data.gender.trim()) {
        updateData.gender = data.gender;
      }

      if (user.device_details && user.device_details.trim()) {
        updateData.device_details = user.device_details;
      }

      // Only include password if it's provided (new password)
      if (data.password && data.password.trim()) {
        updateData.password = data.password;
      }

      // Include profile image if available
      if (profileImage) {
        updateData.profile = profileImage;
      }

      // Include privileges if available
      if (user.privileges) {
        updateData.privileges = user.privileges;
      }

      console.log('Updating project user with data:', updateData);
      
      // Call the mutation
      await updateProjectUserMutation.mutateAsync(updateData);
      
      toast.success('Project user updated successfully');
      form.reset();
      setProfileImage(null);
      setImageFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating project user:', error);
      toast.error('Failed to update project user');
    }
  };

  const handleCancel = () => {
    form.reset();
    setProfileImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <DialogDescription>Update project user information and permissions.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile Image Upload */}
          <div className="space-y-4">
            <Label>Profile Image</Label>
            <div className="flex items-center space-x-4">
              {/* Current Profile Image */}
              <div className="relative">
                {profileImage ? (
                  <div className="relative">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImageClick}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {profileImage ? 'Change Image' : 'Upload Image'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

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
              <p className="text-xs text-muted-foreground">
                Leave empty to keep current password. For security, current password is not displayed.
              </p>
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
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={form.watch('role')}
                onValueChange={value => form.setValue('role', value as any)}
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
                onValueChange={value => form.setValue('gender', value)}
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
                <p className="text-sm text-muted-foreground">Enable or disable the user account</p>
              </div>
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={checked => form.setValue('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="TwoAuth_enabled">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
              </div>
              <Switch
                id="TwoAuth_enabled"
                checked={form.watch('TwoAuth_enabled')}
                onCheckedChange={checked => form.setValue('TwoAuth_enabled', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={updateProjectUserMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProjectUserMutation.isPending}>
              {updateProjectUserMutation.isPending ? (
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
