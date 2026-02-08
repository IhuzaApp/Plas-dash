'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Loader2,
  Video,
  Upload,
  X,
  Youtube,
  FileVideo,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAddReel } from '@/hooks/useHasuraApi';
import { useAuth } from '@/components/layout/RootLayout';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';

type PostType = 'restaurant' | 'supermarket' | 'chef';

// Category types for video handling
const YOUTUBE_CATEGORIES = ['tutorial', 'recipe', 'cooking'];
const UPLOAD_CATEGORIES = ['shopping', 'organic', 'food', 'delivery'];

interface AddReelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddReelModal: React.FC<AddReelModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const addReelMutation = useAddReel();
  const { session } = useAuth();
  const { orgEmployee } = useCurrentOrgEmployee();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for adding reels
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: '',
    type: 'restaurant' as PostType,
    Price: '',
    delivery_time: '',
    shop_id: '',
    restaurant_id: '',
    is_active: true,
  });

  // Upload state
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Check if category allows YouTube URLs
  const isYouTubeCategory = (category: string) => {
    return YOUTUBE_CATEGORIES.includes(category.toLowerCase());
  };

  // Check if category requires video upload
  const isUploadCategory = (category: string) => {
    return UPLOAD_CATEGORIES.includes(category.toLowerCase());
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }

      // Check file size (max 50MB for base64 storage)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video file size must be less than 50MB for database storage');
        return;
      }

      setUploadedVideo(file);
      setIsUploading(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // Start base64 conversion progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 10; // Simulate conversion progress
        });
      }, 200);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        clearInterval(interval);
        setUploadProgress(100);
        setIsUploading(false);
        toast.success('Video processed successfully!');
      };
      reader.onerror = () => {
        clearInterval(interval);
        setIsUploading(false);
        toast.error('Failed to process video');
        removeUploadedVideo();
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedVideo = () => {
    setUploadedVideo(null);
    setVideoPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadVideoToServer = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Store the base64 video data directly in the database
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert video to base64'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read video file'));

      // Convert video to base64
      reader.readAsDataURL(file);
    });
  };

  const handleAddReel = async () => {
    try {
      let videoUrl = formData.video_url;

      // Validate based on category
      if (isYouTubeCategory(formData.category)) {
        if (!videoUrl || (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be'))) {
          toast.error(
            'Please provide a valid YouTube URL for tutorial, recipe, or cooking categories'
          );
          return;
        }
      } else if (isUploadCategory(formData.category)) {
        if (!uploadedVideo && !videoUrl) {
          toast.error('Please upload a video file for this category');
          return;
        }
      }

      // If there's an uploaded video, convert it to base64
      if (uploadedVideo) {
        setUploadProgress(90);
        try {
          videoUrl = await uploadVideoToServer(uploadedVideo);
          setUploadProgress(100);
        } catch (error) {
          toast.error('Failed to process video file');
          return;
        }
      }

      if (!videoUrl) {
        toast.error('Please provide a video URL or upload a video file');
        return;
      }

      // Get the current user's shop or restaurant context
      const currentUser = {
        shop_id: session?.shop_id || null,
        restaurant_id: orgEmployee?.restaurant_id || null,
        user_id: session?.id || null,
      };

      // Prepare mutation variables, handling empty strings
      const mutationVariables: any = {
        title: formData.title || '',
        description: formData.description || '',
        video_url: videoUrl, // This will be either YouTube URL or base64 data
        category: formData.category || '',
        type: formData.type || 'restaurant',
        Price: formData.Price || '0',
        delivery_time: formData.delivery_time || '',
        user_id: null, // Set to null by default for shop/restaurant users
        likes: '0',
        is_active: formData.is_active,
      };

      // Set shop_id or restaurant_id based on the current user's context
      if (currentUser.shop_id) {
        mutationVariables.shop_id = currentUser.shop_id;
      }

      if (currentUser.restaurant_id) {
        mutationVariables.restaurant_id = currentUser.restaurant_id;
      }

      // Only set user_id if we have a valid UUID and no shop/restaurant context
      if (currentUser.user_id && !currentUser.shop_id && !currentUser.restaurant_id) {
        mutationVariables.user_id = currentUser.user_id;
      }

      // Validate required fields
      if (!mutationVariables.title || !mutationVariables.video_url || !mutationVariables.category) {
        toast.error('Please fill in all required fields (title, video, category)');
        return;
      }

      await addReelMutation.mutateAsync(mutationVariables);

      toast.success('Reel added successfully!');
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error('Failed to add reel');
      console.error('Error adding reel:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      category: '',
      type: 'restaurant' as PostType,
      Price: '',
      delivery_time: '',
      shop_id: '',
      restaurant_id: '',
      is_active: true,
    });
    setUploadedVideo(null);
    setVideoPreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Reel</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Create a new video reel with category-specific content requirements.
          </p>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter reel title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter reel description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Post Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: PostType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="supermarket">Supermarket</SelectItem>
                <SelectItem value="chef">Chef</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="recipe">Recipe</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="cooking">Cooking</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* YouTube URL Input - Only for tutorial, recipe, cooking */}
          {isYouTubeCategory(formData.category) && (
            <div>
              <Label htmlFor="video_url" className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                YouTube URL
              </Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only YouTube URLs are allowed for {formData.category} category
              </p>
            </div>
          )}

          {/* Video Upload - Only for shopping, organic, food, delivery */}
          {isUploadCategory(formData.category) && (
            <div>
              <Label className="flex items-center gap-2">
                <FileVideo className="h-4 w-4 text-blue-500" />
                Upload Video
              </Label>
              <div className="mt-2">
                {!uploadedVideo ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload video</p>
                    <p className="text-xs text-gray-500">MP4, MOV, AVI up to 50MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{uploadedVideo.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeUploadedVideo}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Video Preview - TikTok-like experience */}
                    {videoPreview && (
                      <div className="relative">
                        <video
                          src={videoPreview}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                          autoPlay
                          muted
                          loop
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <div className="text-center text-white">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Processing video...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regular URL Input - For other categories */}
          {!isYouTubeCategory(formData.category) && !isUploadCategory(formData.category) && (
            <div>
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="Enter video URL"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={formData.Price}
                onChange={e => setFormData({ ...formData, Price: e.target.value })}
                placeholder="Enter price"
              />
            </div>
            <div>
              <Label htmlFor="delivery_time">Delivery Time</Label>
              <Input
                id="delivery_time"
                value={formData.delivery_time}
                onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                placeholder="e.g., 30-45 min"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active" className="text-sm font-medium">
              Active Status
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {formData.is_active ? 'Active' : 'Inactive'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={
                  formData.is_active
                    ? 'text-green-600 border-green-600'
                    : 'text-gray-400 border-gray-400'
                }
              >
                {formData.is_active ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAddReel}
              disabled={addReelMutation.isPending || isUploading}
              className="flex-1"
            >
              {addReelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Reel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddReelModal;
