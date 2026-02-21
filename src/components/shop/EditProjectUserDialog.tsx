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
import { Card } from '@/components/ui/card';
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
import { Loader2, User, Mail, Shield, Lock, Upload, X } from 'lucide-react';
import { PROJECT_ROLE_TYPES, getDefaultProjectPrivilegesForRole } from '@/lib/privileges/projectRolePrivileges';
import { ProjectUser, useUpdateProjectUser } from '@/hooks/useHasuraApi';
import { ProjectUserPrivileges, ProjectPrivilegeKey, ProjectModulePrivileges } from '@/types/projectPrivileges';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MODULE_DESCRIPTIONS } from '@/lib/privileges/moduleDescriptions';

// Password hashing function with salt and multiple iterations
// Note: In production, consider using a dedicated password hashing library like bcrypt
// This implementation uses Web Crypto API with salt and iterations for security
const hashPassword = async (password: string): Promise<string> => {
  // Generate a random salt (16 bytes = 128 bits)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Combine password with salt
  const passwordWithSalt = password + saltHex;

  // Hash with multiple iterations (10,000 iterations for security)
  // This simulates bcrypt-like behavior to slow down brute force attacks
  let hash = passwordWithSalt;
  for (let i = 0; i < 10000; i++) {
    const encoder = new TextEncoder();
    const data = encoder.encode(hash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Return salt:hash format (salt is needed for password verification)
  return saltHex + ':' + hash;
};

type FormData = {
  username: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  role: string;
  is_active: boolean;
  TwoAuth_enabled: boolean;
  gender?: string;
  profile?: string;
};

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
  const [privileges, setPrivileges] = useState<ProjectUserPrivileges | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the update mutation hook
  const updateProjectUserMutation = useUpdateProjectUser();

  const form = useForm<FormData>({
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

      // Merge user privileges with defaults to ensure all system modules are visible
      // This ensures that new modules like "referrals" show up even for old user records
      const userPrivs = user.privileges || {};
      const defaultPrivs = getDefaultProjectPrivilegesForRole(user.role || 'customerSupport');

      // Start with defaults, then override with user's specific settings
      const mergedPrivs = { ...defaultPrivs };
      Object.keys(userPrivs).forEach(key => {
        const k = key as ProjectPrivilegeKey;
        if (userPrivs[k]) {
          // Deep merge for each module
          mergedPrivs[k] = {
            ...(mergedPrivs[k] || {}),
            ...(userPrivs[k] as ProjectModulePrivileges)
          };
        }
      });

      setPrivileges(mergedPrivs);
    }
  }, [user, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setProfileImage(null);
      setImageFile(null);
      setPrivileges(null);
      setExpandedModules(new Set());
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

  const handleRoleChange = (role: string) => {
    form.setValue('role', role);
    const defaultPrivs = getDefaultProjectPrivilegesForRole(role);
    setPrivileges(defaultPrivs);
  };

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const updatePrivilege = (module: ProjectPrivilegeKey, action: string, value: boolean) => {
    if (!privileges) return;

    const newPrivileges = { ...privileges };
    if (!newPrivileges[module]) {
      newPrivileges[module] = { access: false };
    }
    newPrivileges[module]![action] = value;
    setPrivileges(newPrivileges);
  };

  const toggleAllInModule = (module: ProjectPrivilegeKey, value: boolean) => {
    if (!privileges) return;

    const newPrivileges = { ...privileges };
    if (!newPrivileges[module]) {
      newPrivileges[module] = { access: false };
    }

    // Get all keys (actions) for this module from the current state or default
    const currentModule = newPrivileges[module]!;
    Object.keys(currentModule).forEach(action => {
      currentModule[action] = value;
    });

    setPrivileges(newPrivileges);
  };

  const getModuleAccessCount = (module: ProjectPrivilegeKey) => {
    const modulePrivileges = privileges?.[module];
    if (!modulePrivileges) return 0;

    return Object.values(modulePrivileges).filter(Boolean).length;
  };

  const getTotalAccessCount = () => {
    if (!privileges) return 0;
    return Object.keys(privileges).reduce((total, module) => {
      return total + getModuleAccessCount(module as ProjectPrivilegeKey);
    }, 0);
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

      // Only include password if it's provided (new password) - hash it before storing
      if (data.password && data.password.trim()) {
        updateData.password = await hashPassword(data.password);
      }

      // Include profile image if available
      if (profileImage) {
        updateData.profile = profileImage;
      }

      // Include privileges if available
      if (privileges) {
        updateData.privileges = privileges;
      }

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
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Project User
          </DialogTitle>
          <DialogDescription>Update project user information and permissions.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = form.getValues();

            // Manual validation
            if (!formData.username || formData.username.length < 3) {
              toast.error('Username must be at least 3 characters');
              return;
            }

            if (!formData.email || !formData.email.includes('@')) {
              toast.error('Please enter a valid email address');
              return;
            }

            if (formData.password && formData.password.length < 8) {
              toast.error('Password must be at least 8 characters');
              return;
            }

            if (formData.password && formData.password !== formData.confirmPassword) {
              toast.error('Passwords do not match');
              return;
            }

            onSubmit(formData);
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
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
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF up to 5MB</p>
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
                  <Input id="username" placeholder="Enter username" {...form.register('username')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    {...form.register('email')}
                  />
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep current password. For security, current password is not
                    displayed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    {...form.register('confirmPassword')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={form.watch('role')}
                    onValueChange={handleRoleChange}
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

              <Separator />

              {/* Privilege Management Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privilege Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure fine-grained permissions for this project user
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getTotalAccessCount()} permissions granted</Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  {privileges && Object.entries(MODULE_DESCRIPTIONS).map(([moduleKey, moduleInfo]) => {
                    const module = moduleKey as ProjectPrivilegeKey;
                    // Only show modules that are relevant to project users as defined in the state or default
                    if (!privileges[module]) return null;

                    const modulePrivileges = privileges[module] as ProjectModulePrivileges;
                    const accessCount = getModuleAccessCount(module);
                    const totalActions = moduleInfo.actions.length;
                    const isExpanded = expandedModules.has(module);
                    const hasAccess = modulePrivileges.access || false;

                    return (
                      <Card key={module} className="overflow-hidden border shadow-sm">
                        <Collapsible open={isExpanded} onOpenChange={() => toggleModule(module)}>
                          <CollapsibleTrigger asChild>
                            <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <div className="flex items-center gap-2">
                                      {hasAccess ? (
                                        <Shield className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <h4 className="font-medium">{moduleInfo.title}</h4>
                                    </div>
                                  </div>
                                  <Badge variant={hasAccess ? 'default' : 'secondary'}>
                                    {accessCount}/{totalActions}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      toggleAllInModule(module, !hasAccess);
                                    }}
                                  >
                                    {hasAccess ? 'Revoke All' : 'Grant All'}
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 ml-6">
                                {moduleInfo.description}
                              </p>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {moduleInfo.actions.map(action => {
                                const isEnabled = modulePrivileges[action.key] || false;

                                return (
                                  <div
                                    key={action.key}
                                    className="flex items-center justify-between p-2 rounded-md border bg-muted/20"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Label
                                          htmlFor={`${module}-${action.key}`}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {action.label}
                                        </Label>
                                        {isEnabled && (
                                          <Check className="h-3 w-3 text-green-600" />
                                        )}
                                      </div>
                                    </div>
                                    <Switch
                                      id={`${module}-${action.key}`}
                                      checked={isEnabled}
                                      onCheckedChange={checked =>
                                        updatePrivilege(module, action.key, checked)
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t p-6">
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProjectUserMutation.isPending}
              >
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectUserDialog;
