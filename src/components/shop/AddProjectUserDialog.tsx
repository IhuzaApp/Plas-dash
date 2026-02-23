'use client';

import React, { useState, useRef } from 'react';
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
import {
  Loader2,
  User,
  Mail,
  Shield,
  Lock,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  X,
} from 'lucide-react';
import {
  PROJECT_ROLE_TYPES,
  getDefaultProjectPrivilegesForRole,
} from '@/lib/privileges/projectRolePrivileges';
import { useAddProjectUser } from '@/hooks/useHasuraApi';
import {
  ProjectUserPrivileges,
  ProjectPrivilegeKey,
  ProjectModulePrivileges,
} from '@/types/projectPrivileges';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MODULE_DESCRIPTIONS } from '@/lib/privileges/moduleDescriptions';
import { Card } from '@/components/ui/card';

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

// Password verification function (for login validation)
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    // Split salt and hash
    const [saltHex, storedHash] = hashedPassword.split(':');
    if (!saltHex || !storedHash) {
      return false;
    }

    // Combine password with salt
    const passwordWithSalt = password + saltHex;

    // Hash with same iterations
    let hash = passwordWithSalt;
    for (let i = 0; i < 10000; i++) {
      const encoder = new TextEncoder();
      const data = encoder.encode(hash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Compare hashes
    return hash === storedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

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

// Form validation schema
const formSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(PROJECT_ROLE_TYPES),
    is_active: z.boolean().default(true),
    TwoAuth_enabled: z.boolean().default(false),
    gender: z.string().optional(),
  })
  .refine(
    data => {
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface AddProjectUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Password generation function
const generateRandomPassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

const AddProjectUserDialog: React.FC<AddProjectUserDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'custom' | 'generated'>('generated');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    username: string;
    email: string;
    password: string;
  } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [privileges, setPrivileges] = useState<ProjectUserPrivileges | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addProjectUserMutation = useAddProjectUser();

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

  // Generate initial password and privileges when dialog opens
  React.useEffect(() => {
    if (open) {
      if (passwordMode === 'generated' && !form.getValues('password')) {
        const newPassword = generateRandomPassword();
        setGeneratedPassword(newPassword);
        form.setValue('password', newPassword);
        form.setValue('confirmPassword', newPassword);
        // Clear validation errors
        form.clearErrors(['password', 'confirmPassword']);
      }

      if (!privileges) {
        const defaultPrivs = getDefaultProjectPrivilegesForRole(form.getValues('role'));
        setPrivileges(defaultPrivs);
      }
    }
  }, [open, passwordMode, form, privileges]);

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    form.setValue('password', newPassword);
    form.setValue('confirmPassword', newPassword);
    // Clear validation errors
    form.clearErrors(['password', 'confirmPassword']);
    toast.success('New password generated');
  };

  const handlePasswordModeChange = (mode: 'custom' | 'generated') => {
    setPasswordMode(mode);
    if (mode === 'generated') {
      const newPassword = generateRandomPassword();
      setGeneratedPassword(newPassword);
      form.setValue('password', newPassword);
      form.setValue('confirmPassword', newPassword);
      // Clear validation errors
      form.clearErrors(['password', 'confirmPassword']);
    } else {
      form.setValue('password', '');
      form.setValue('confirmPassword', '');
      // Clear validation errors
      form.clearErrors(['password', 'confirmPassword']);
    }
  };

  const handleRoleChange = (role: string) => {
    form.setValue('role', role as any);
    const defaultPrivs = getDefaultProjectPrivilegesForRole(role);
    setPrivileges(defaultPrivs);
    form.clearErrors('role');
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

    // If we enabled an action, ensure module access is also true
    if (value && action !== 'access') {
      newPrivileges[module]!.access = true;
    }

    // Sync with pages module
    if (!newPrivileges.pages) {
      newPrivileges.pages = { access: false };
    }

    const pages = newPrivileges.pages as any;
    const updatedAccess = newPrivileges[module]!.access;
    pages[`access_${module}`] = updatedAccess;

    // Re-evaluate overall pages.access
    pages.access = Object.keys(newPrivileges).some(m =>
      m !== 'pages' && (newPrivileges[m as ProjectPrivilegeKey] as any)?.access === true
    );

    setPrivileges(newPrivileges);
  };

  const toggleAllInModule = (module: ProjectPrivilegeKey, value: boolean) => {
    if (!privileges) return;

    const newPrivileges = { ...privileges };
    if (!newPrivileges[module]) {
      newPrivileges[module] = { access: false };
    }

    const currentModule = newPrivileges[module]!;
    Object.keys(currentModule).forEach(action => {
      currentModule[action] = value;
    });

    // Sync with pages module
    if (!newPrivileges.pages) {
      newPrivileges.pages = { access: false };
    }

    const pages = newPrivileges.pages as any;
    pages[`access_${module}`] = value;

    // Re-evaluate overall pages.access
    pages.access = Object.keys(newPrivileges).some(m =>
      m !== 'pages' && (newPrivileges[m as ProjectPrivilegeKey] as any)?.access === true
    );

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

  const handleCopyPassword = async () => {
    const passwordToCopy =
      passwordMode === 'generated' ? generatedPassword : form.getValues('password');
    try {
      await navigator.clipboard.writeText(passwordToCopy);
      toast.success('Password copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = passwordToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Password copied to clipboard');
    }
  };

  const handleCopyLoginInfo = async () => {
    const loginInfo = `Username: ${form.getValues('username')}\nEmail: ${form.getValues('email')}\nPassword: ${passwordMode === 'generated' ? generatedPassword : form.getValues('password')}\n\nLogin URL: ${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(loginInfo);
      toast.success('Login information copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = loginInfo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Login information copied to clipboard');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      // Generate privileges based on the selected role
      const privileges = getDefaultProjectPrivilegesForRole(data.role);

      // Prepare the mutation data
      const mutationData = {
        username: data.username,
        email: data.email,
        password: await hashPassword(data.password),
        role: data.role,
        is_active: data.is_active,
        TwoAuth_enabled: data.TwoAuth_enabled,
        gender: data.gender || '', // Use empty string for optional field
        device_details: '', // Use empty string for optional field
        profile: profileImage || '', // Include profile image
        privileges: privileges || getDefaultProjectPrivilegesForRole(data.role),
      };

      // Call the mutation
      await addProjectUserMutation.mutateAsync(mutationData);

      // Store user info for success dialog (use original password, not hashed)
      setCreatedUser({
        username: data.username,
        email: data.email,
        password: data.password, // Store original password for display
      });

      // Show success dialog instead of closing immediately
      setShowSuccessDialog(true);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error('Failed to create project user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setPasswordMode('generated');
    setGeneratedPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setProfileImage(null);
    setImageFile(null);
    form.clearErrors();
    onOpenChange(false);
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setPasswordMode('generated');
      setGeneratedPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setProfileImage(null);
      setImageFile(null);
      form.clearErrors();
    }
  }, [open, form]);

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setCreatedUser(null);
    form.reset();
    setPasswordMode('generated');
    setGeneratedPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    form.clearErrors();
    onOpenChange(false);
  };

  const handleCopyLoginInfoFromSuccess = async () => {
    if (!createdUser) return;

    const loginInfo = `Username: ${createdUser.username}\nEmail: ${createdUser.email}\nPassword: ${createdUser.password}\n\nLogin URL: ${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(loginInfo);
      toast.success('Login information copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = loginInfo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Login information copied to clipboard');
    }
  };

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
      toast.success('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Profile image removed');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add Project User
          </DialogTitle>
          <DialogDescription>
            Create a new project user with specific role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault();

            // Manual validation
            const formData = form.getValues();
            console.log('Form data:', formData);

            // Check required fields
            if (!formData.username || formData.username.length < 3) {
              toast.error('Username must be at least 3 characters');
              return;
            }

            if (!formData.email || !formData.email.includes('@')) {
              toast.error('Please enter a valid email address');
              return;
            }

            if (!formData.password || formData.password.length < 8) {
              toast.error('Password must be at least 8 characters');
              return;
            }

            if (formData.password !== formData.confirmPassword) {
              toast.error('Passwords do not match');
              return;
            }

            // If validation passes, call onSubmit
            onSubmit(formData);
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Profile Image Upload */}
              <div className="space-y-4">
                <Label>Profile Image (Optional)</Label>
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

              <div className="space-y-4">
                {/* Password Mode Selection */}
                <div className="space-y-2">
                  <Label>Password Type</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={passwordMode === 'generated' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePasswordModeChange('generated')}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Random
                    </Button>
                    <Button
                      type="button"
                      variant={passwordMode === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePasswordModeChange('custom')}
                      className="flex-1"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Type Custom
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={
                          passwordMode === 'generated' ? 'Generated password' : 'Enter password'
                        }
                        {...form.register('password')}
                        className={
                          form.formState.errors.password ? 'border-red-500 pr-20' : 'pr-20'
                        }
                        readOnly={passwordMode === 'generated'}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                        {passwordMode === 'generated' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleGeneratePassword}
                            className="h-6 w-6 p-0"
                            title="Generate new password"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-6 w-6 p-0"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyPassword}
                          className="h-6 w-6 p-0"
                          title="Copy password"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                    {passwordMode === 'generated' && (
                      <p className="text-xs text-muted-foreground">
                        Password automatically generated with 12 characters including uppercase,
                        lowercase, numbers, and special characters.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        {...form.register('confirmPassword')}
                        className={
                          form.formState.errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'
                        }
                        readOnly={passwordMode === 'generated'}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="h-6 w-6 p-0"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Copy Login Info Button */}
                {form.watch('username') && form.watch('email') && form.watch('password') && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLoginInfo}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Login Information
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={form.watch('role')} onValueChange={handleRoleChange}>
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
                    <p className="text-sm text-muted-foreground">
                      Enable or disable the user account
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Enable 2FA for enhanced security
                    </p>
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
                  {privileges &&
                    Object.entries(MODULE_DESCRIPTIONS).map(([moduleKey, moduleInfo]) => {
                      const mod = moduleKey as ProjectPrivilegeKey;
                      if (!privileges[mod]) return null;

                      const modulePrivileges = privileges[mod] as ProjectModulePrivileges;
                      const accessCount = getModuleAccessCount(mod);
                      const totalActions = moduleInfo.actions.length;
                      const isExpanded = expandedModules.has(mod);
                      const hasAccess = modulePrivileges.access || false;

                      return (
                        <Card key={mod} className="overflow-hidden border shadow-sm">
                          <Collapsible open={isExpanded} onOpenChange={() => toggleModule(mod)}>
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
                                        toggleAllInModule(mod, !hasAccess);
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
                                            htmlFor={`${mod}-${action.key}`}
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
                                        id={`${mod}-${action.key}`}
                                        checked={isEnabled}
                                        onCheckedChange={checked =>
                                          updatePrivilege(mod, action.key, checked)
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
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <User className="h-5 w-5" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              The project user has been created successfully. Here are the login credentials:
            </DialogDescription>
          </DialogHeader>

          {createdUser && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Username:</span>
                    <span className="text-green-700 font-mono">{createdUser.username}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Email:</span>
                    <span className="text-green-700">{createdUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Password:</span>
                    <span className="text-green-700 font-mono">{createdUser.password}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Login URL:</span>
                    <span className="text-green-700 text-sm">{window.location.origin}/login</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p>
                      Please share these credentials securely with the user. They should change
                      their password upon first login.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLoginInfoFromSuccess}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Login Info
            </Button>
            <Button type="button" onClick={handleSuccessDialogClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AddProjectUserDialog;
