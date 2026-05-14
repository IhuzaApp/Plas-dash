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
  Car,
  Settings,
  MapPin,
  Calendar,
  Info,
  Layers,
  Fuel,
  Users,
  History,
  CheckCircle2,
  AlertCircle,
  Video,
  ArrowRight,
  ShieldCheck,
  Truck,
  Plus,
} from 'lucide-react';
import { RentalVehicle } from '@/hooks/useHasuraApi';

interface VehicleDetailsModalProps {
  vehicle: RentalVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  vehicle,
  open,
  onOpenChange,
}) => {
  if (!vehicle) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-xl w-full p-0 flex flex-col border-none shadow-2xl bg-slate-50 dark:bg-slate-950"
      >
        <SheetHeader className="px-6 py-8 border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner shrink-0">
              <Car className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                {String(vehicle.name || 'Vehicle')}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant="outline"
                  className="capitalize font-bold border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                >
                  {String((vehicle as any).category || 'Vehicle')}
                </Badge>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-500">
                  {String((vehicle as any).brand || 'Standard')} {(vehicle as any).model || ''}
                </span>
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
                  Daily Rate
                </span>
                <div className="text-2xl font-black text-emerald-600">
                  {Number((vehicle as any).price || 0).toLocaleString()} RWF
                </div>
              </div>
              <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                  Plate Number
                </span>
                <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none font-black px-3 py-1 uppercase">
                  {String((vehicle as any).platNumber || 'N/A')}
                </Badge>
              </div>
            </div>

            {/* Main Image */}
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-white shadow-xl border-4 border-white group relative">
                {(vehicle as any).main_photo ? (
                  <img
                    src={(vehicle as any).main_photo}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Car className="w-32 h-32" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-black text-slate-900">
                      {String((vehicle as any).location || 'Kigali')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                <Info className="w-4 h-4 text-emerald-500" /> Vehicle Overview
              </h3>
              <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Truck className="w-20 h-20 rotate-12" />
                </div>
                <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400 font-medium italic relative z-10">
                  "
                  {String(
                    vehicle.description ||
                      'No detailed description available for this vehicle. Contact the logistics partner for more information regarding performance and features.'
                  )}
                  "
                </p>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Users className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">Seats</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {String((vehicle as any).seats || '5')}
                </span>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Fuel className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">Fuel</span>
                <span className="text-sm font-black text-slate-800 dark:text-white capitalize">
                  {String((vehicle as any).fuel_type || 'Petrol')}
                </span>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <Settings className="w-6 h-6 text-purple-500 mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">
                  Transmission
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-white capitalize">
                  {String((vehicle as any).transmission || 'Auto')}
                </span>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 mb-1">Driver</span>
                <span className="text-sm font-black text-slate-800 dark:text-white capitalize">
                  {(vehicle as any).drive_provided ? 'Included' : 'Self-drive'}
                </span>
              </div>
            </div>

            {/* Media Gallery (Exterior & Interior) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                <Plus className="w-4 h-4 text-emerald-500" /> Detailed Views
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                    Exterior View
                  </span>
                  <div className="aspect-video rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 group/img relative cursor-pointer">
                    {(vehicle as any).exterior ? (
                      <>
                        <img
                          src={(vehicle as any).exterior}
                          alt="Exterior"
                          className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                        />
                        <a
                          href={(vehicle as any).exterior}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Plus className="w-6 h-6 text-white" />
                        </a>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Car className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                    Interior View
                  </span>
                  <div className="aspect-video rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 group/img relative cursor-pointer">
                    {(vehicle as any).interior ? (
                      <>
                        <img
                          src={(vehicle as any).interior}
                          alt="Interior"
                          className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                        />
                        <a
                          href={(vehicle as any).interior}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Plus className="w-6 h-6 text-white" />
                        </a>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <Users className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Registration
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    Listed on {new Date(vehicle.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100"
              >
                {vehicle.status || 'Available'}
              </Badge>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 border-t bg-white dark:bg-slate-900 sticky bottom-0">
          <SheetClose asChild>
            <Button className="w-full py-7 rounded-3xl font-black text-lg shadow-xl hover:scale-[1.01] transition-transform bg-emerald-600 hover:bg-emerald-700">
              Return to Fleet
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default VehicleDetailsModal;
