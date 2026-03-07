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
  ShoppingCart,
  BarChart2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  useReels,
  useSystemConfig,
  useDeleteReel,
  useDeleteReelsComment,
  useUpdateReel,
} from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { useAuth } from '@/components/layout/RootLayout';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { toast } from 'sonner';
import AddReelModal from '@/components/Reels/AddReelModal';
import EditReelModal from '@/components/Reels/EditReelModal';
import ReelsStats from '@/components/Reels/ReelsStats';
import ReelsAnalytics from '@/components/Reels/ReelsAnalytics';
import ReelCard from '@/components/Reels/ReelCard';
import ReelsCommentsModal from '@/components/Reels/ReelsCommentsModal';
import { deleteVideoFromFirebase } from '@/lib/firebaseStorage';

type PostType = 'restaurant' | 'supermarket' | 'chef';

// Category types for video handling
const YOUTUBE_CATEGORIES = ['tutorial', 'recipe', 'cooking'];
const UPLOAD_CATEGORIES = ['shopping', 'organic', 'food', 'delivery'];

const Reels = () => {
  const { session } = useAuth();
  const { orgEmployee } = useCurrentOrgEmployee();

  const whereClause = React.useMemo(() => {
    if (!session || session.isProjectUser) return {};

    const conditions = [];
    if (session.shop_id) {
      conditions.push({ shop_id: { _eq: session.shop_id } });
    }
    if (orgEmployee?.restaurant_id) {
      conditions.push({ restaurant_id: { _eq: orgEmployee.restaurant_id } });
    }

    if (conditions.length === 0) {
      // If the user has no shop or restaurant assigned, return a condition that matches nothing
      return { id: { _is_null: true } };
    }

    return { _or: conditions };
  }, [session, orgEmployee]);

  const { data, isLoading, isError, error, refetch } = useReels(whereClause);
  const { data: systemConfig } = useSystemConfig();
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
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedCommentsReel, setSelectedCommentsReel] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'user' | 'restaurant' | 'shop' | 'business'>('all');

  const deleteReelMutation = useDeleteReel();
  const deleteCommentMutation = useDeleteReelsComment();
  const updateReelMutation = useUpdateReel();

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || '$';
    return `${currency}${amount.toFixed(2)}`;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    switch (categoryLower) {
      case 'shopping':
        return '#8b5cf6'; // Purple
      case 'organic':
        return '#10b981'; // Emerald
      case 'tutorial':
        return '#f59e0b'; // Amber
      case 'recipe':
        return '#ef4444'; // Red
      case 'food':
        return '#f97316'; // Orange
      case 'cooking':
        return '#dc2626'; // Red
      case 'delivery':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
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
      const reel = reels.find((r: any) => r.id === reelId);
      if (!reel) {
        toast.error('Reel not found');
        return;
      }

      toast.promise(
        updateReelMutation.mutateAsync({
          id: reelId,
          title: reel.title,
          description: reel.description,
          video_url: reel.video_url,
          category: reel.category,
          type: reel.type,
          Price: reel.Price,
          delivery_time: reel.delivery_time,
          is_active: !currentStatus,
          shop_id: reel.shop_id,
          restaurant_id: reel.restaurant_id,
        }),
        {
          loading: 'Updating reel status...',
          success: () => {
            refetch();
            return `Reel ${!currentStatus ? 'enabled' : 'disabled'} successfully`;
          },
          error: 'Failed to update reel status',
        }
      );
    } catch (error) {
      console.error('Error updating reel status:', error);
    }
  };

  const handleDeleteReel = async (reelId: string) => {
    if (
      !window.confirm('Are you sure you want to delete this reel? This action cannot be undone.')
    ) {
      return;
    }

    try {
      // Find the reel to get its video_url
      const reelToDelete = reels.find((r: any) => r.id === reelId);

      // If it's a Firebase URL, delete it from storage
      if (reelToDelete?.video_url && reelToDelete.video_url.includes('firebasestorage.googleapis.com')) {
        await deleteVideoFromFirebase(reelToDelete.video_url);
      }

      await deleteReelMutation.mutateAsync({ id: reelId });
      toast.success('Reel deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete reel');
      console.error('Error deleting reel:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync({ id: commentId });
      toast.success('Comment deleted successfully');
      // Refresh the data to update the counts and comments
      refetch();
      // If the modal is open, we might want to update the local state if reels data doesn't update fast enough
      // But refetch should be enough.
    } catch (error) {
      toast.error('Failed to delete comment');
      console.error('Error deleting comment:', error);
    }
  };

  const openCommentsModal = (reel: any) => {
    setSelectedCommentsReel(reel);
    setIsCommentsModalOpen(true);
  };

  // Filter reels based on search term and sort by most recent
  const filteredReels = reels
    .filter(reel => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        reel.title?.toLowerCase().includes(searchLower) ||
        reel.description?.toLowerCase().includes(searchLower) ||
        reel.category?.toLowerCase().includes(searchLower) ||
        reel.User?.name?.toLowerCase().includes(searchLower) ||
        reel.Restaurant?.name?.toLowerCase().includes(searchLower) ||
        reel.Shops?.name?.toLowerCase().includes(searchLower)
      );

      if (!matchesSearch) return false;

      // Apply filter type logic
      switch (activeFilter) {
        case 'user':
          return !!reel.user_id;
        case 'restaurant':
          return !!reel.restaurant_id;
        case 'shop':
          return !!reel.shop_id;
        case 'business':
          return !!reel.shop_id || !!reel.restaurant_id;
        default:
          return true;
      }
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

  const totalLikes = reels.reduce((acc, reel) => acc + reel.likes, 0);
  const totalComments = reels.reduce((acc, reel) => acc + reel.Reels_comments.length, 0);
  const totalOrders = reels.reduce((acc, reel) => acc + reel.reel_orders.length, 0);
  const totalSales = reels.reduce((acc, reel) => {
    const reelPrice = parseFloat(reel.Price || '0');
    const orderCount = reel.reel_orders.length;
    const reelRevenue = reelPrice * orderCount;
    return acc + reelRevenue;
  }, 0);
  const reelsWithSales = reels.filter(reel => reel.reel_orders.length > 0).length;

  // Analytics Data Processing
  const topReels = [...reels]
    .sort((a, b) => b.reel_orders.length - a.reel_orders.length || b.likes - a.likes)
    .slice(0, 5)
    .map(r => ({
      name: r.title.length > 15 ? r.title.substring(0, 15) + '...' : r.title,
      sales: r.reel_orders.length,
      likes: r.likes,
    }));

  // Analytics Data Processing: Reels by Type (Count)
  const categoryData = reels.reduce((acc: any[], reel) => {
    let typeName = 'System (Unknown)';

    // Check by ID presence first (more reliable in this schema)
    if (reel.restaurant_id) {
      typeName = 'Restaurant';
    } else if (reel.shop_id) {
      typeName = 'Shop';
    } else if (reel.user_id) {
      // If it has user_id but not shop/restaurant, it's a User reel
      // unless specifically tagged as business or system
      if (reel.type === 'business') typeName = 'Business';
      else if (reel.type === 'chef' || reel.type === 'user') typeName = 'User';
      else typeName = 'User';
    } else {
      // Fallback to type field
      if (reel.type === 'restaurant') typeName = 'Restaurant';
      else if (reel.type === 'supermarket' || reel.type === 'shop') typeName = 'Shop';
      else if (reel.type === 'business') typeName = 'Business';
      else if (reel.type === 'chef' || reel.type === 'user') typeName = 'User';
    }

    const existing = acc.find(item => item.name === typeName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: typeName, value: 1 });
    }
    return acc;
  }, []);

  // Sort category data by value
  categoryData.sort((a, b) => b.value - a.value);

  const ownerData = reels.reduce((acc: any[], reel) => {
    const ownerName = reel.User?.name || reel.Shops?.name || reel.Restaurant?.name || 'System';
    const existing = acc.find(item => item.name === ownerName);
    if (existing) {
      existing.value += reel.reel_orders.length;
    } else {
      acc.push({ name: ownerName, value: reel.reel_orders.length });
    }
    return acc;
  }, []);

  ownerData.sort((a, b) => b.value - a.value);

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

      <ReelsStats
        totalReels={reels.length}
        reelsWithSales={reelsWithSales}
        totalOrders={totalOrders}
        totalSalesFormatted={formatCurrency(totalSales)}
      />

      <ReelsAnalytics topReels={topReels} categoryData={categoryData} ownerData={ownerData} />

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
          <div className="flex gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="px-3 h-8"
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'user' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('user')}
              className="px-3 h-8"
            >
              Users
            </Button>
            <Button
              variant={activeFilter === 'restaurant' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('restaurant')}
              className="px-3 h-8"
            >
              Restaurants
            </Button>
            <Button
              variant={activeFilter === 'shop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('shop')}
              className="px-3 h-8"
            >
              Shops
            </Button>
            <Button
              variant={activeFilter === 'business' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveFilter('business')}
              className="px-3 h-8"
            >
              Business
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReels.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(reel => (
            <ReelCard
              key={reel.id}
              reel={reel}
              playingVideo={playingVideo}
              mutedVideos={mutedVideos}
              failedVideos={failedVideos}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
              getCategoryColor={getCategoryColor}
              onVideoPlay={setPlayingVideo}
              onVideoPause={() => setPlayingVideo(null)}
              onToggleMute={toggleMute}
              onFailedVideo={videoUrl => {
                console.warn(`Failed to load video: ${videoUrl}`);
                setFailedVideos(prev => new Set(prev).add(videoUrl));
              }}
              onEdit={handleEditReel}
              onToggleStatus={handleToggleReelStatus}
              onDelete={handleDeleteReel}
              onViewComments={openCommentsModal}
            />
          ))}
        </div>

        {filteredReels.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No reels found</p>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first reel'}
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

      <ReelsCommentsModal
        open={isCommentsModalOpen}
        onOpenChange={setIsCommentsModalOpen}
        reel={selectedCommentsReel}
        formatDateTime={formatDateTime}
        onDeleteComment={handleDeleteComment}
      />
    </AdminLayout>
  );
};

export default Reels;
