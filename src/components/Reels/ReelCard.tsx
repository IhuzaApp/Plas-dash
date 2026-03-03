'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  ShoppingCart,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Video,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ReelCardProps {
  reel: any;
  playingVideo: string | null;
  mutedVideos: Set<string>;
  failedVideos: Set<string>;
  formatCurrency: (amount: number) => string;
  formatDateTime: (date: string) => string;
  getCategoryColor: (category: string) => string;
  onVideoPlay: (reelId: string) => void;
  onVideoPause: () => void;
  onToggleMute: (reelId: string) => void;
  onFailedVideo: (videoUrl: string) => void;
  onEdit: (reel: any) => void;
  onToggleStatus: (reelId: string, currentStatus: boolean) => void;
  onDelete: (reelId: string) => void;
  onViewComments: (reel: any) => void;
}

const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  playingVideo,
  mutedVideos,
  failedVideos,
  formatCurrency,
  formatDateTime,
  getCategoryColor,
  onVideoPlay,
  onVideoPause,
  onToggleMute,
  onFailedVideo,
  onEdit,
  onToggleStatus,
  onDelete,
  onViewComments,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black">
        {failedVideos.has(reel.video_url) || !reel.video_url ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <img
              src="/placeholder.svg"
              alt="No video"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Video className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-xs font-medium">Video unavailable</p>
            </div>
          </div>
        ) : (
          <video
            src={reel.video_url}
            className="w-full h-full object-cover"
            muted={mutedVideos.has(reel.id)}
            onPlay={() => onVideoPlay(reel.id)}
            onPause={onVideoPause}
            onError={() => onFailedVideo(reel.video_url)}
            loop
            preload="metadata"
          />
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          {!failedVideos.has(reel.video_url) && reel.video_url && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={() => {
                const video = document.querySelector(
                  `video[src="${reel.video_url}"]`
                ) as HTMLVideoElement;
                if (video) {
                  if (video.paused) {
                    video.play().catch(err => console.warn('Play error:', err));
                  } else {
                    video.pause();
                  }
                }
              }}
            >
              {playingVideo === reel.id ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onToggleMute(reel.id)}
          >
            {mutedVideos.has(reel.id) ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-1">{reel.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">{reel.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {reel.reel_orders?.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleStatus(reel.id, reel.is_active)}
                className={reel.is_active ? 'text-green-600' : 'text-gray-400'}
                title={reel.is_active ? 'Disable reel' : 'Enable reel'}
              >
                {reel.is_active ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(reel.id)}
                className="text-red-500 hover:text-red-700"
                title="Delete reel"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(reel)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors">
            <Heart className="h-4 w-4" />
            <span>{reel.likes}</span>
          </div>
          <div
            className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => onViewComments(reel)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>{reel.Reels_comments?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <ShoppingCart className="h-4 w-4" />
            <span>{reel.reel_orders?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <span>
              {formatCurrency(parseFloat(reel.Price || '0') * (reel.reel_orders?.length || 0))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              backgroundColor: getCategoryColor(reel.category),
              color: 'white',
              borderColor: getCategoryColor(reel.category),
            }}
          >
            {reel.category}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {reel.type}
          </Badge>
          <Badge variant={reel.is_active ? 'default' : 'secondary'} className="text-xs">
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
                  <AvatarFallback className="text-xs">{reel.User?.name?.charAt(0)}</AvatarFallback>
                </>
              ) : reel.Shops ? (
                <>
                  <AvatarImage src={reel.Shops?.logo} />
                  <AvatarFallback className="text-xs">{reel.Shops?.name?.charAt(0)}</AvatarFallback>
                </>
              ) : reel.Restaurant ? (
                <>
                  <AvatarImage src={reel.Restaurant?.logo} />
                  <AvatarFallback className="text-xs">
                    {reel.Restaurant?.name?.charAt(0)}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="text-xs">?</AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium">
              {reel.User?.name || reel.Shops?.name || reel.Restaurant?.name || 'Unknown Creator'}
            </span>
          </div>
          <span className="text-muted-foreground text-xs">{formatDateTime(reel.created_on)}</span>
        </div>

        <div className="space-y-2">
          {(reel.Restaurant || reel.Shops) && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Location:</span>{' '}
              {reel.Restaurant?.name || reel.Shops?.name}
            </div>
          )}

          {reel.Price && (
            <div className="text-sm font-medium text-green-600">
              <span className="font-medium text-muted-foreground mr-1">Price:</span>{' '}
              {formatCurrency(parseFloat(reel.Price))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReelCard;
