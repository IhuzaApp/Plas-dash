'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Loader2, 
  Video, 
  Edit,
  ToggleLeft, 
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateReel } from '@/hooks/useHasuraApi';
import { useAuth } from '@/components/layout/RootLayout';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';

type PostType = "restaurant" | "supermarket" | "chef";

// Category types for video handling
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
    }
  }, [reel]);

  const handleUpdateReel = async () => {
    if (!reel) {
      toast.error('No reel selected for editing');
      return;
    }

    try {
      let videoUrl = formData.video_url;

      // Validate based on category
      if (YOUTUBE_CATEGORIES.includes(formData.category.toLowerCase())) {
        if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
          toast.error('Please provide a valid YouTube URL for tutorial, recipe, or cooking categories');
          return;
        }
      } else if (UPLOAD_CATEGORIES.includes(formData.category.toLowerCase())) {
        if (!videoUrl) {
          toast.error('Please provide a video URL for this category');
          return;
        }
      }

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
      <SheetContent side="right" className="w-[600px] sm:w-[800px] lg:w-[900px] overflow-y-auto">
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter reel title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter reel description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Post Type</Label>
            <Select value={formData.type} onValueChange={(value: PostType) => setFormData({ ...formData, type: value })}>
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
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
          <div>
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-500" />
              Current Video (Read-only)
            </Label>
            <div className="mt-2">
              {reel.video_url ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Current Video</span>
                  </div>
                  <div className="relative">
                    <video
                      src={reel.video_url}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                      muted
                      loop
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This video cannot be edited. To change the video, delete this reel and create a new one.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50 text-center">
                  <Video className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">No video available</p>
                </div>
              )}
            </div>
          </div>

          {/* Regular URL Input - For other categories */}
          {!YOUTUBE_CATEGORIES.includes(formData.category.toLowerCase()) && !UPLOAD_CATEGORIES.includes(formData.category.toLowerCase()) && (
            <div>
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, Price: e.target.value })}
                placeholder="Enter price"
              />
            </div>
            <div>
              <Label htmlFor="delivery_time">Delivery Time</Label>
              <Input
                id="delivery_time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
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
                className={formData.is_active ? 'text-green-600 border-green-600' : 'text-gray-400 border-gray-400'}
              >
                {formData.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpdateReel} 
              disabled={updateReelMutation.isPending}
              className="flex-1"
            >
              {updateReelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Reel
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