import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface AddRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        ussd: '',
        tin: '',
        profile: '',
        lat: '',
        long: '',
        logo: '',
    });

    const profileInputRef = React.useRef<HTMLInputElement>(null);
    const logoInputRef = React.useRef<HTMLInputElement>(null);

    const [uploadedProfile, setUploadedProfile] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);

    const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'logo') => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image file size must be less than 5MB');
                return;
            }

            const previewUrl = URL.createObjectURL(file);
            if (type === 'profile') {
                setUploadedProfile(file);
                setProfilePreview(previewUrl);
                setFormData(prev => ({ ...prev, profile: '' })); // clear url if file selected
            } else {
                setUploadedLogo(file);
                setLogoPreview(previewUrl);
                setFormData(prev => ({ ...prev, logo: '' })); // clear url if file selected
            }
        }
    };

    const removeImage = (type: 'profile' | 'logo') => {
        if (type === 'profile') {
            setUploadedProfile(null);
            setProfilePreview(null);
            if (profileInputRef.current) profileInputRef.current.value = '';
        } else {
            setUploadedLogo(null);
            setLogoPreview(null);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert image to base64'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Basic validation
            if (!formData.name || !formData.email || !formData.phone) {
                throw new Error('Please fill in all required fields.');
            }

            let profilePayload = formData.profile;
            let logoPayload = formData.logo;

            if (uploadedProfile) {
                profilePayload = await convertToBase64(uploadedProfile);
            }
            if (uploadedLogo) {
                logoPayload = await convertToBase64(uploadedLogo);
            }

            const variables = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                location: formData.location,
                ussd: formData.ussd,
                tin: formData.tin,
                profile: profilePayload,
                lat: formData.lat,
                long: formData.long,
                logo: logoPayload,
                is_active: false,
            };

            const response = await fetch('/api/mutations/add-restaurant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variables }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create restaurant');
            }

            toast.success('Restaurant created successfully!', {
                description: `${formData.name} has been added and is pending verification.`,
            });

            setFormData({
                name: '', email: '', phone: '', location: '',
                ussd: '', tin: '', profile: '', lat: '', long: '', logo: ''
            });
            removeImage('profile');
            removeImage('logo');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating restaurant:', error);
            toast.error('Failed to create restaurant', {
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Restaurant</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new restaurant. It will require approval before going live.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Restaurant Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. The Golden Grill"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Public Email <span className="text-red-500">*</span></Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="e.g. contact@goldengrill.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="e.g. +1 234 567 890"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Physical Location</Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g. 123 Main St, Springfield"
                            value={formData.location}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lat">Latitude (lat)</Label>
                            <Input
                                id="lat"
                                name="lat"
                                placeholder="-1.286389"
                                value={formData.lat}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="long">Longitude (long)</Label>
                            <Input
                                id="long"
                                name="long"
                                placeholder="36.817223"
                                value={formData.long}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ussd">USSD</Label>
                            <Input
                                id="ussd"
                                name="ussd"
                                placeholder="*123#"
                                value={formData.ussd}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tin">TIN</Label>
                            <Input
                                id="tin"
                                name="tin"
                                placeholder="Tax ID"
                                value={formData.tin}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Profile Image</Label>
                            {!uploadedProfile ? (
                                <div className="space-y-2">
                                    <Input
                                        name="profile"
                                        placeholder="Image URL..."
                                        value={formData.profile}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">or upload</span>
                                        </div>
                                    </div>
                                    <div className="border border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                                        <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <span className="text-xs text-muted-foreground">Click to upload</span>
                                        <input
                                            ref={profileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'profile')}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-2 relative h-[120px]">
                                    <img src={profilePreview || ''} alt="Profile Preview" className="w-full h-full object-cover rounded-md" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={() => removeImage('profile')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded truncate max-w-[90%]">
                                        {uploadedProfile.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            {!uploadedLogo ? (
                                <div className="space-y-2">
                                    <Input
                                        name="logo"
                                        placeholder="Logo URL..."
                                        value={formData.logo}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">or upload</span>
                                        </div>
                                    </div>
                                    <div className="border border-dashed rounded-lg p-4 text-center hover:bg-muted/50 cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                        <ImageIcon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                                        <span className="text-xs text-muted-foreground">Click to upload</span>
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-lg p-2 relative h-[120px]">
                                    <img src={logoPreview || ''} alt="Logo Preview" className="w-full h-full object-contain rounded-md bg-muted/20" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={() => removeImage('logo')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded truncate max-w-[90%]">
                                        {uploadedLogo.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Adding...' : 'Add Restaurant'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddRestaurantModal;
