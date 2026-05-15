'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  PawPrint,
  Heart,
  Calendar,
  Stethoscope,
  Video,
  Tag,
  Layers,
  Utensils,
  History,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Pet } from '@/hooks/useHasuraApi';

interface PetDetailsModalProps {
  pet: Pet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PetDetailsModal: React.FC<PetDetailsModalProps> = ({ pet, open, onOpenChange }) => {
  if (!pet) return null;

  // Helper to split comma-separated strings into arrays
  const getList = (val: any) => {
    if (typeof val !== 'string') return [];
    return val
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const favouriteFoods = getList(pet.favourite_food);
  const vaccines = getList(pet.vaccinations);

  // Handle parent images
  let parentImages: string[] = [];
  try {
    const rawImages = pet.parent_images;
    if (Array.isArray(rawImages)) {
      parentImages = rawImages;
    } else if (typeof rawImages === 'string') {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed)) parentImages = parsed;
    } else if (rawImages && typeof rawImages === 'object') {
      if (Array.isArray((rawImages as any).images)) {
        parentImages = (rawImages as any).images;
      }
    }
  } catch (e) {
    console.error('Error parsing parent images:', e);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-xl w-full p-0 flex flex-col border-none shadow-2xl bg-slate-50 dark:bg-slate-950"
      >
        <SheetHeader className="px-6 py-8 border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner shrink-0">
              <PawPrint className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                {String(pet.name || 'Pet')}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant="outline"
                  className="capitalize font-bold border-primary/20 text-primary bg-primary/5"
                >
                  {String(pet.pet_type || 'Pet')}
                </Badge>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-500">{String(pet.breed || 'Breed')}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-8 space-y-10">
            {/* Header Metrics */}
            <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Price
                </span>
                <div className="text-2xl font-black text-primary">
                  {pet.free ? 'FREE' : `${Number(pet.amount || 0).toLocaleString()} RWF`}
                </div>
              </div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Status
                </span>
                <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none font-black px-3 py-1">
                  {pet.quantity_sold}/{pet.quantity} ADOPTED
                </Badge>
              </div>
            </div>

            {/* Main Image */}
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-white shadow-xl border-4 border-white group relative">
                {pet.image ? (
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <PawPrint className="w-32 h-32" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <span className="text-sm font-black text-slate-900">{pet.quantity} Total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                <Heart className="w-4 h-4 text-rose-500" /> The Story
              </h3>
              <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <PawPrint className="w-20 h-20 rotate-12" />
                </div>
                <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400 font-medium italic relative z-10">
                  &quot;
                  {String(
                    pet.story ||
                      'No story provided for this pet yet. They are waiting for someone to get to know them!'
                  )}
                  &quot;
                </p>
              </div>
            </div>

            {/* Characteristics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Calendar className="w-6 h-6 text-primary mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">Age</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {String(pet.age || `${pet.months}m`)}
                </span>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Layers className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">Gender</span>
                <span className="text-sm font-black text-slate-800 dark:text-white capitalize">
                  {String(pet.gender || 'N/A')}
                </span>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Tag className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">Color</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {String(pet.color || 'N/A')}
                </span>
              </div>
            </div>

            {/* Vaccination Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                <Stethoscope className="w-4 h-4 text-emerald-500" /> Vaccination & Health
              </h3>
              <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pet.vaccinated ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5" /> Fully Vaccinated
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 font-black text-sm">
                        <AlertCircle className="w-5 h-5" /> Not Vaccinated
                      </div>
                    )}
                  </div>
                  {pet.vaccination_cert && (
                    <Button
                      variant="link"
                      className="text-emerald-600 font-bold p-0 h-auto underline decoration-2"
                      asChild
                    >
                      <a href={pet.vaccination_cert} target="_blank" rel="noopener noreferrer">
                        Certificate <ArrowRight className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>

                {vaccines.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {vaccines.map((v, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm"
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Favourite Foods List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                <Utensils className="w-4 h-4 text-amber-500" /> Diet & Preferences
              </h3>
              <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-4">
                  Favourite Foods
                </span>
                {favouriteFoods.length > 0 ? (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    {favouriteFoods.map((food, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        {food}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 font-medium italic">
                    No special diet listed
                  </span>
                )}
              </div>
            </div>

            {/* Parent Images */}
            {parentImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <Plus className="w-4 h-4 text-primary" /> Parent Gallery
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {parentImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={`Parent ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Showcase */}
            {pet.video && (
              <a
                href={pet.video}
                target="_blank"
                rel="noopener noreferrer"
                className="p-8 rounded-[2rem] bg-indigo-600 shadow-indigo-200 dark:shadow-none shadow-2xl flex flex-col gap-6 hover:scale-[1.01] transition-transform group relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 p-10 opacity-10 group-hover:rotate-12 transition-transform">
                  <Video className="w-40 h-40 text-white" />
                </div>
                <Video className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase text-white/60 block mb-1">
                    Media
                  </span>
                  <span className="text-2xl font-black text-white">
                    Watch {String(pet.name || 'Pet')} in action
                  </span>
                </div>
              </a>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t bg-white dark:bg-slate-900 sticky bottom-0">
          <SheetClose asChild>
            <Button className="w-full py-7 rounded-3xl font-black text-lg shadow-xl hover:scale-[1.01] transition-transform">
              Return to Inventory
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default PetDetailsModal;
