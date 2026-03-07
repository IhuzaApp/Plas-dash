'use client';

import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
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
import { uploadVideoToFirebase } from '@/lib/firebaseStorage';

type PostType = 'restaurant' | 'supermarket' | 'chef';

// Categories for reference, but no longer strict bounds for upload types
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
  const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>('upload');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [youtubePreviewUrl, setYoutubePreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Helper function to check category types
  const isYouTubeCategory = (category: string) => {
    return YOUTUBE_CATEGORIES.includes(category.toLowerCase());
  };

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
      // Start upload to Firebase
      setIsUploading(true);
      setUploadProgress(0);

      uploadVideoToFirebase(file, (progress) => {
        setUploadProgress(progress);
      })
        .then((url) => {
          setFormData(prev => ({ ...prev, video_url: url }));
          setIsUploading(false);
          toast.success('Video uploaded successfully!');
        })
        .catch((error) => {
          setIsUploading(false);
          toast.error('Failed to upload video');
          removeUploadedVideo();
        });
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

  // Removed uploadVideoToServer as it is replaced by uploadVideoToFirebase

  const handleAddReel = async () => {
    try {
      let videoUrl = formData.video_url;

      // Transform short URLs on save
      if (videoUrl && videoUrl.includes('/shorts/')) {
        videoUrl = videoUrl.replace('/shorts/', '/watch?v=');
      }

      // Validate based on the selected video source
      if (videoSource === 'youtube') {
        if (!videoUrl || (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be'))) {
          toast.error('Please provide a valid YouTube URL');
          return;
        }
      } else if (videoSource === 'upload') {
        if (!uploadedVideo && !videoUrl) {
          toast.error('Please upload a video file or provide a video URL');
          return;
        }
      }

      // If there's an uploaded video, the URL should already be in formData.video_url from handleVideoUpload
      if (uploadedVideo && !formData.video_url) {
        toast.error('Please wait for the video to finish uploading');
        return;
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

      // Only set user_id if we have a valid UUID and no shop/restaurant context and the user is NOT a project user
      if (currentUser.user_id && !currentUser.shop_id && !currentUser.restaurant_id && !session?.isProjectUser) {
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
    setYoutubePreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90vw] !max-w-[1000px] sm:w-[600px] md:w-[800px] lg:w-[1000px] overflow-y-auto"
      >
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

          {/* Video Source Selection */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Video Source</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={videoSource === 'upload' ? 'default' : 'outline'}
                onClick={() => setVideoSource('upload')}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File or URL
              </Button>
              <Button
                type="button"
                variant={videoSource === 'youtube' ? 'default' : 'outline'}
                onClick={() => setVideoSource('youtube')}
                className="flex-1"
              >
                <Youtube className="mr-2 h-4 w-4" />
                YouTube URL
              </Button>
            </div>
          </div>

          {/* YouTube URL Input */}
          {videoSource === 'youtube' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="video_url" className="flex items-center gap-2 mb-2">
                  <Youtube className="h-4 w-4 text-red-500" />
                  YouTube URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={e => {
                      setFormData({ ...formData, video_url: e.target.value });
                      if (!e.target.value) setYoutubePreviewUrl(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      let url = formData.video_url;
                      if (url && url.includes('/shorts/')) {
                        url = url.replace('/shorts/', '/watch?v=');
                      }
                      setYoutubePreviewUrl(url);
                    }}
                  >
                    Pull Video
                  </Button>
                </div>
              </div>

              {youtubePreviewUrl && (youtubePreviewUrl.includes('youtube.com') || youtubePreviewUrl.includes('youtu.be')) && (
                <div className="border rounded-lg bg-black overflow-hidden relative aspect-video mt-4">
                  <ReactPlayer
                    src={youtubePreviewUrl}
                    width="100%"
                    height="100%"
                    controls
                  />
                </div>
              )}
            </div>
          )}

          {/* Video Upload input */}
          {videoSource === 'upload' && (
            <div>
              <Label className="flex items-center gap-2">
                <FileVideo className="h-4 w-4 text-blue-500" />
                Upload Video or URL
              </Label>
              <div className="mt-2">
                {!uploadedVideo ? (
                  <div className="space-y-4">
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
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="text-xs text-muted-foreground uppercase">or enter URL</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                    <div>
                      <Input
                        id="video_url_fallback"
                        value={formData.video_url}
                        onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                        placeholder="Enter direct video URL (e.g. .mp4 link)"
                      />
                    </div>
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
                    {videoPreview ? (
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
                    ) : (
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src="/placeholder.svg"
                          alt="No video"
                          className="w-full h-full object-cover opacity-50"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                          <Video className="h-10 w-10 mb-2 opacity-20" />
                          <p className="text-xs font-medium">Wait for video preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.category?.toLowerCase() !== 'recipe' && (
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
          )}

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
