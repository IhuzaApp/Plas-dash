import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';

interface ProfileTabProps {
  profileData: any;
  setIsAvatarDialogOpen: (open: boolean) => void;
  handleSaveChanges: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  profileData,
  setIsAvatarDialogOpen,
  handleSaveChanges,
}) => {
  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-background to-muted/20 rounded-3xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-500" />
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl relative z-10">
              <AvatarImage src={profileData?.display_image} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profileData?.display_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-lg z-20 hover:scale-110 transition-transform"
              onClick={() => setIsAvatarDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight">
              {profileData?.display_name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest text-[10px] h-5">
                {profileData?.display_role?.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {profileData?.display_email}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="full-name"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                Account Holder Name
              </Label>
              <Input
                id="full-name"
                defaultValue={profileData?.display_name}
                className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                Primary Email Address
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={profileData?.display_email}
                className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                Contact Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                defaultValue={profileData?.display_phone}
                className="rounded-2xl h-12 bg-muted/30 border-none focus-visible:ring-primary shadow-inner"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="bio"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                Professional Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                className="min-h-[120px] rounded-2xl bg-muted/30 border-none focus-visible:ring-primary shadow-inner resize-none p-4"
              />
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Membership Status
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  {profileData?.membership_id ? 'PRO PARTNER' : 'BASIC ACCOUNT'}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">
                  ID: {profileData?.membership_id || 'PLAS-0000'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-zinc-50/50 dark:bg-zinc-900/50 pt-6">
        <Button
          onClick={handleSaveChanges}
          className="rounded-2xl px-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 font-bold transition-all hover:scale-[1.02]"
        >
          Save Profile Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileTab;
