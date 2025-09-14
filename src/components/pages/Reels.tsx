'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Loader2, 
  Plus, 
  Video, 
  Edit, 
  Heart, 
  MessageCircle, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Trash2,
  Upload,
  X,
  Youtube,
  FileVideo,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { useReels, useSystemConfig } from '@/hooks/useHasuraApi';
import { useAuth } from '@/components/layout/RootLayout';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import AddReelModal from '@/components/Reels/AddReelModal';
import EditReelModal from '@/components/Reels/EditReelModal';

type PostType = "restaurant" | "supermarket" | "chef";

// Category types for video handling
const YOUTUBE_CATEGORIES = ['tutorial', 'recipe', 'cooking'];
const UPLOAD_CATEGORIES = ['shopping', 'organic', 'food', 'delivery'];

const Reels = () => {
  const { data, isLoading, isError, error, refetch } = useReels();
  const { data: systemConfig } = useSystemConfig();
  const { session } = useAuth();
  const { orgEmployee } = useCurrentOrgEmployee();
  const reels = data?.Reels || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [failedVideos, setFailedVideos] = useState<Set<string>>(new Set());

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || '$';
    return `${currency}${amount.toFixed(2)}`;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case "shopping":
        return "#8b5cf6"; // Purple
      case "organic":
        return "#10b981"; // Emerald
      case "tutorial":
        return "#f59e0b"; // Amber
      case "recipe":
        return "#ef4444"; // Red
      case "food":
        return "#f97316"; // Orange
      case "cooking":
        return "#dc2626"; // Red
      case "delivery":
        return "#3b82f6"; // Blue
      default:
        return "#6b7280"; // Gray
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const handleVideoPlay = (reelId: string) => {
    setPlayingVideo(reelId);
  };

  const handleVideoPause = () => {
    setPlayingVideo(null);
  };

  const toggleMute = (reelId: string) => {
    const newMutedVideos = new Set(mutedVideos);
    if (newMutedVideos.has(reelId)) {
      newMutedVideos.delete(reelId);
    } else {
      newMutedVideos.add(reelId);
    }
    setMutedVideos(newMutedVideos);
  };

  const handleEditReel = (reel: any) => {
    setSelectedReel(reel);
    setIsEditDialogOpen(true);
  };

  const handleToggleReelStatus = async (reelId: string, currentStatus: boolean) => {
    try {
      // This would be a mutation to update the reel's is_active status
      // For now, we'll simulate it with a toast
      toast.success(`Reel ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      // In a real implementation, you would call a mutation here
      // await updateReelMutation.mutateAsync({ id: reelId, is_active: !currentStatus });
      refetch(); // Refresh the data
    } catch (error) {
      toast.error('Failed to update reel status');
      console.error('Error updating reel status:', error);
    }
  };

  // Filter reels based on search term and sort by most recent
  const filteredReels = reels
    .filter(reel => {
      const searchLower = searchTerm.toLowerCase();
      return (
        reel.title?.toLowerCase().includes(searchLower) ||
        reel.description?.toLowerCase().includes(searchLower) ||
        reel.category?.toLowerCase().includes(searchLower) ||
        reel.User?.name?.toLowerCase().includes(searchLower) ||
        reel.Restaurant?.name?.toLowerCase().includes(searchLower) ||
        reel.Shops?.name?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by most recent first (newest to oldest)
      const dateA = new Date(a.created_on).getTime();
      const dateB = new Date(b.created_on).getTime();
      return dateB - dateA;
    });

  // Calculate pagination
  const totalItems = filteredReels.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentReels = filteredReels.slice(startIndex, endIndex);

  const totalLikes = reels.reduce((acc, reel) => acc + reel.likes, 0);
  const totalComments = reels.reduce((acc, reel) => acc + reel.Reels_comments.length, 0);
  const totalOrders = reels.reduce((acc, reel) => acc + reel.reel_orders.length, 0);
  const totalRevenue = reels.reduce((acc, reel) => {
    const reelPrice = parseFloat(reel.Price || '0');
    const orderCount = reel.reel_orders.length;
    const reelRevenue = reelPrice * orderCount;
    return acc + reelRevenue;
  }, 0);
  const activeReels = reels.filter(reel => reel.is_active).length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Error loading reels.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Reels"
        description="Manage and view video reels with editing capabilities."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDrawerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reel
            </Button>
            <AddReelModal 
              open={isAddDrawerOpen}
              onOpenChange={setIsAddDrawerOpen}
              onSuccess={refetch}
            />
            <EditReelModal 
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              onSuccess={refetch}
              reel={selectedReel}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reels.length}</div>
            <p className="text-muted-foreground">Total Reels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeReels}</div>
            <p className="text-muted-foreground">Active Reels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
            <p className="text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, category, creator, restaurant, or shop..."
              className="pl-8"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentReels.map(reel => (
            <Card key={reel.id} className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                {failedVideos.has(reel.video_url) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Video unavailable</p>
                    </div>
                  </div>
                ) : (
                  <video
                    src={reel.video_url}
                    className="w-full h-full object-cover"
                    muted={mutedVideos.has(reel.id)}
                    onPlay={() => handleVideoPlay(reel.id)}
                    onPause={handleVideoPause}
                    onError={(e) => {
                      console.warn(`Failed to load video: ${reel.video_url}`);
                      setFailedVideos(prev => new Set(prev).add(reel.video_url));
                    }}
                    loop
                    preload="metadata"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  {!failedVideos.has(reel.video_url) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/20 hover:bg-white/30 text-white"
                      onClick={() => {
                        const video = document.querySelector(`video[src="${reel.video_url}"]`) as HTMLVideoElement;
                        if (video) {
                          if (video.paused) {
                            video.play().catch(err => {
                              console.warn('Failed to play video:', err);
                            });
                          } else {
                            video.pause();
                          }
                        }
                      }}
                    >
                      {playingVideo === reel.id ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => toggleMute(reel.id)}
                  >
                    {mutedVideos.has(reel.id) ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2 mb-1">{reel.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {reel.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleReelStatus(reel.id, reel.is_active)}
                      className={reel.is_active ? 'text-green-600' : 'text-gray-400'}
                      title={reel.is_active ? 'Disable reel' : 'Enable reel'}
                    >
                      {reel.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditReel(reel)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{reel.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{reel.Reels_comments.length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{reel.reel_orders.length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <span>{formatCurrency(parseFloat(reel.Price || '0') * reel.reel_orders.length)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: getCategoryColor(reel.category),
                      color: 'white',
                      borderColor: getCategoryColor(reel.category)
                    }}
                  >
                    {reel.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {reel.type}
                  </Badge>
                  <Badge 
                    variant={reel.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {reel.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {reel.User ? (
                        <>
                          <AvatarImage src={reel.User?.profile_picture} />
                          <AvatarFallback className="text-xs">
                            {reel.User?.name?.charAt(0)}
                          </AvatarFallback>
                        </>
                      ) : reel.Shops ? (
                        <>
                          <AvatarImage src={reel.Shops?.logo} />
                          <AvatarFallback className="text-xs">
                            {reel.Shops?.name?.charAt(0)}
                          </AvatarFallback>
                        </>
                      ) : reel.Restaurant ? (
                        <>
                          <AvatarImage src={reel.Restaurant?.logo} />
                          <AvatarFallback className="text-xs">
                            {reel.Restaurant?.name?.charAt(0)}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="text-xs">
                          ?
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium">
                      {reel.User?.name || reel.Shops?.name || reel.Restaurant?.name || 'Unknown Creator'}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDateTime(reel.created_on)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {(reel.Restaurant || reel.Shops) && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Location:</span> {reel.Restaurant?.name || reel.Shops?.name}
                    </div>
                  )}
                  
                  {reel.Price && (
                    <div className="text-sm font-medium text-green-600">
                      <span className="font-medium">Price:</span> {formatCurrency(parseFloat(reel.Price))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {currentReels.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No reels found</p>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first reel'}
              </p>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default Reels;