'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';

interface ReelsCommentsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reel: any;
    formatDateTime: (date: string) => string;
    onDeleteComment: (commentId: string) => void;
}

const ReelsCommentsModal: React.FC<ReelsCommentsModalProps> = ({
    open,
    onOpenChange,
    reel,
    formatDateTime,
    onDeleteComment,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Comments</DialogTitle>
                    <DialogDescription>
                        Viewing all comments for "{reel?.title}"
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 py-4">
                        {reel?.Reels_comments?.length > 0 ? (
                            reel.Reels_comments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-4">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarImage src={comment.User?.profile_picture} />
                                        <AvatarFallback>{comment.User?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">{comment.User?.name}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDateTime(comment.created_on)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {comment.text}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Heart className="h-3 w-3" /> {comment.likes}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-auto p-0 text-[10px] text-red-500 hover:text-red-700 hover:bg-transparent"
                                                onClick={() => onDeleteComment(comment.id)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-sm text-muted-foreground font-medium">No comments yet</p>
                                <p className="text-xs text-muted-foreground">No comments have been posted for this reel.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/50">
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReelsCommentsModal;
