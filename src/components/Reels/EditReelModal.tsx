'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Edit,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
  Youtube,
  FileVideo,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateReel } from '@/hooks/useHasuraApi';
import { useAuth } from '@/components/layout/RootLayout';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { uploadFileToFirebase, deleteVideoFromFirebase } from '@/lib/firebaseStorage';
import { compressVideo } from '@/lib/videoCompression';

type PostType = 'restaurant' | 'supermarket' | 'chef';

// Categories for reference
const YOUTUBE_CATEGORIES = ['tutorial', 'recipe', 'cooking'];
const UPLOAD_CATEGORIES = ['shopping', 'organic', 'food', 'delivery'];

interface Reel {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  type: PostType;
  Price: string;
  delivery_time: string;
  is_active: boolean;
  shop_id?: string | null;
  restaurant_id?: string | null;
  user_id?: string | null;
}

interface EditReelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  reel: Reel | null;
}

const EditReelModal: React.FC<EditReelModalProps> = ({ open, onOpenChange, onSuccess, reel }) => {
  const updateReelMutation = useUpdateReel();
  const { session } = useAuth();
  const { orgEmployee } = useCurrentOrgEmployee();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for editing reels
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: '',
    type: 'restaurant' as PostType,
    Price: '',
    delivery_time: '',
    is_active: true,
  });

  // Upload state
  const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [youtubePreviewUrl, setYoutubePreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [oldFileUrl, setOldFileUrl] = useState<string | null>(null);

  // Initialize form data when reel changes
  useEffect(() => {
    if (reel) {
      setFormData({
        title: reel.title || '',
        description: reel.description || '',
        video_url: reel.video_url || '',
        category: reel.category || '',
        type: reel.type || 'restaurant',
        Price: reel.Price || '',
        delivery_time: reel.delivery_time || '',
        is_active: reel.is_active,
      });
      setOldFileUrl(reel.video_url || null);
      if (reel.video_url?.includes('youtube.com') || reel.video_url?.includes('youtu.be')) {
        setVideoSource('youtube');
        setYoutubePreviewUrl(reel.video_url);
      } else {
        setVideoSource('upload');
      }
    }
  }, [reel]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        toast.error('Please select a valid video or image file');
        return;
      }

      setUploadedFile(file);
      setFilePreview(URL.createObjectURL(file));

      const startUpload = async (fileToUpload: File | Blob) => {
        setIsUploading(true);
        setUploadProgress(0);

        const folder = file.type.startsWith('image/') ? 'images' : 'videos';

        uploadFileToFirebase(fileToUpload as File, progress => {
          setUploadProgress(progress);
        }, folder)
          .then(url => {
            setFormData(prev => ({ ...prev, video_url: url }));
            setIsUploading(false);
            toast.success(`${file.type.startsWith('image/') ? 'Image' : 'Video'} uploaded successfully!`);
          })
          .catch(error => {
            setIsUploading(false);
            toast.error('Failed to upload file');
            removeUploadedFile();
          });
      };

      if (file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
        setIsCompressing(true);
        toast.info('Compressing video to reduce size...', { duration: 5000 });

        compressVideo(file)
          .then((compressedFile) => {
            setIsCompressing(false);
            startUpload(compressedFile);
          })
          .catch((error) => {
            console.error('Compression failed:', error);
            setIsCompressing(false);
            startUpload(file);
          });
      } else {
        startUpload(file);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Restore original file if we remove the new one
    setFormData(prev => ({ ...prev, video_url: oldFileUrl || '' }));
  };

  const handleUpdateReel = async () => {
    if (!reel) {
      toast.error('No reel selected for editing');
      return;
    }

    try {
      let videoUrl = formData.video_url;

      // We no longer strictly validate video URLs for Edits on category since the video is read-only
      // and changing category should not break the existing read-only video URL.

      // Prepare mutation variables
      const mutationVariables: any = {
        id: reel.id,
        title: formData.title || '',
        description: formData.description || '',
        video_url: videoUrl,
        category: formData.category || '',
        type: formData.type || 'restaurant',
        Price: formData.Price || '0',
        delivery_time: formData.delivery_time || '',
        is_active: formData.is_active,
      };

      // Validate required fields
      if (!mutationVariables.title || !mutationVariables.video_url || !mutationVariables.category) {
        toast.error('Please fill in all required fields (title, video, category)');
        return;
      }

      if (formData.video_url !== oldFileUrl && oldFileUrl?.includes('firebasestorage.googleapis.com')) {
        await deleteVideoFromFirebase(oldFileUrl);
      }

      await updateReelMutation.mutateAsync(mutationVariables);

      toast.success('Reel updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('Failed to update reel');
      console.error('Error updating reel:', error);
    }
  };

  const resetForm = () => {
    if (reel) {
      setFormData({
        title: reel.title || '',
        description: reel.description || '',
        video_url: reel.video_url || '',
        category: reel.category || '',
        type: reel.type || 'restaurant',
        Price: reel.Price || '',
        delivery_time: reel.delivery_time || '',
        is_active: reel.is_active,
      });
    }
  };

  if (!reel) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90vw] !max-w-[1000px] sm:w-[600px] md:w-[800px] lg:w-[1000px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Reel
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Update the reel information and content. Note: Videos cannot be edited.
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

          {/* Video Display - Show current video as read-only */}
          {/* Video Source Selection */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Change Video Source</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={videoSource === 'upload' ? 'default' : 'outline'}
                onClick={() => setVideoSource('upload')}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload New File
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

              {youtubePreviewUrl &&
                (youtubePreviewUrl.includes('youtube.com') ||
                  youtubePreviewUrl.includes('youtu.be')) && (
                  <div className="border rounded-lg bg-black overflow-hidden relative aspect-video mt-4">
                    <ReactPlayer src={youtubePreviewUrl} width="100%" height="100%" controls />
                  </div>
                )}
            </div>
          )}

          {/* Video Upload input */}
          {videoSource === 'upload' && (
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                Upload New Video or Image
              </Label>
              <div className="mt-2">
                {!uploadedFile ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Click to upload new file</p>
                      <p className="text-xs text-gray-500">MP4, JPG, PNG up to 100MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleFileUpload}
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
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {uploadedFile.type.startsWith('image/') ? (
                          <Upload className="h-4 w-4 text-green-500" />
                        ) : (
                          <Video className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeUploadedFile}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Preview */}
                    {filePreview && (
                      <div className="mb-3">
                        {uploadedFile.type.startsWith('image/') ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={filePreview}
                            className="w-full h-48 object-cover rounded-lg"
                            controls
                          />
                        )}
                      </div>
                    )}

                    {/* Upload Progress */}
                    {uploadProgress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}

                    {isUploading && (
                      <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm">Uploading and processing...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current File Display */}
          {!uploadedFile && videoSource === 'upload' && (
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                Current File
              </Label>
              <div className="mt-2">
                {formData.video_url &&
                  !formData.video_url.includes('youtube.com') &&
                  !formData.video_url.includes('youtu.be') ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="relative aspect-video">
                      {formData.video_url.includes('/reels/images/') ||
                        formData.video_url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? (
                        <img
                          src={formData.video_url}
                          alt="Current"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={formData.video_url}
                          className="w-full h-full object-cover rounded-lg"
                          controls
                          muted
                          loop
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                      <Upload className="h-12 w-12 mb-2 opacity-20" />
                      <p className="text-sm font-medium text-center px-4">
                        No local file currently set or using YouTube.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regular URL Input - Removed because video is read-only in Edit mode */}

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
              onClick={handleUpdateReel}
              disabled={updateReelMutation.isPending || isUploading || isCompressing}
              className="flex-1"
            >
              {updateReelMutation.isPending || isCompressing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isCompressing ? 'Compressing...' : 'Update Reel'}
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

export default EditReelModal;
