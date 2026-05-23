'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useRestaurantById } from '@/hooks/useHasuraApi';
import { Sparkles, Utensils, Flame, Leaf, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';



export default function MenuDisplay() {
  const { session } = useAuth();
  const { shopSession } = useShopSession();

  const restaurantId =
    session?.restaurant_id ||
    (shopSession?.isRestaurant ? shopSession?.shopId : null);

  const { data: restaurantData } = useRestaurantById(restaurantId || '');
  const restaurant = restaurantData?.Restaurants_by_pk;

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  interface FoodItem {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    description: string;
    tag: string;
    spicy: boolean;
    veg: boolean;
  }

  // Combine DB dishes and Mock dishes
  const foodItems = useMemo<FoodItem[]>(() => {
    const dbDishes = (restaurant?.restaurant_dishes || []).map((rd: any) => {
      const category = rd.dishes?.category;
      const ingredients = rd.dishes?.ingredients;

      const veg = typeof category === 'string' && category.toLowerCase().includes('veg');

      let spicy = false;
      if (typeof ingredients === 'string') {
        spicy = ingredients.toLowerCase().includes('spicy');
      } else if (Array.isArray(ingredients)) {
        spicy = ingredients.some((i: any) => typeof i === 'string' && i.toLowerCase().includes('spicy'));
      }

      return {
        id: rd.id,
        name: rd.dishes?.name || rd.ProductNames?.name || 'Unnamed Dish',
        price: parseFloat(rd.price) || 0,
        category: category || 'General',
        image: rd.image || rd.dishes?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        description: rd.dishes?.description || 'Delicious freshly prepared recipe.',
        tag: rd.promo ? 'Promotion' : 'Popular',
        spicy,
        veg,
      };
    });

    return dbDishes;
  }, [restaurant]);

  // Featured list for slideshow (carousel)
  const featuredItems = useMemo<FoodItem[]>(() => {
    return foodItems.slice(0, 4);
  }, [foodItems]);

  // Slideshow automatic loop
  useEffect(() => {
    if (featuredItems.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % featuredItems.length);
    }, 6000); // changes every 6s
    return () => clearInterval(interval);
  }, [featuredItems]);

  // Group items by category for menu layout
  const categoriesMap = useMemo(() => {
    const map: Record<string, FoodItem[]> = {};
    foodItems.forEach((item: FoodItem) => {
      const cat = item.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [foodItems]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Digital Board Header */}
      <header className="flex justify-between items-center bg-slate-900/85 backdrop-blur-md px-10 py-5 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-500/20">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {restaurant?.name || 'DREAMS KITCHEN'}
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Digital Menu
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {restaurant?.location || 'Experience Culinary Excellence'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm font-semibold text-slate-400">
          <Clock className="h-4 w-4 text-blue-500" />
          <span>Freshly Prepared to Order</span>
        </div>
      </header>

      {/* Main Board Layout split 50/50 */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-10 min-h-0">
        {/* Left Side: Stunning Featured Slideshow */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <h2 className="text-xs font-black tracking-widest text-blue-500 uppercase mb-4 flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-blue-500" /> Today's Highlights
          </h2>

          <div className="flex-1 relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900 group">
            {featuredItems.map((item: FoodItem, idx: number) => {
              const isActive = idx === activeSlideIndex;
              return (
                <div
                  key={item.id}
                  className={`absolute inset-0 flex flex-col transition-all duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                  }`}
                >
                  {/* Big Hero Image */}
                  <div className="flex-1 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                    {/* Floating badges */}
                    <div className="absolute top-6 left-6 flex gap-2">
                      <Badge className="bg-blue-600 text-white font-black uppercase text-xs px-3.5 py-1.5 tracking-wider shadow-lg rounded-full">
                        {item.tag || 'Featured'}
                      </Badge>
                      {item.spicy && (
                        <Badge className="bg-red-600 text-white font-black uppercase text-xs px-3.5 py-1.5 tracking-wider shadow-lg rounded-full flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 fill-white" /> Spicy
                        </Badge>
                      )}
                      {item.veg && (
                        <Badge className="bg-emerald-600 text-white font-black uppercase text-xs px-3.5 py-1.5 tracking-wider shadow-lg rounded-full flex items-center gap-1">
                          <Leaf className="h-3.5 w-3.5" /> Veg
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Details Overlay */}
                  <div className="p-8 space-y-4 bg-slate-950/95 border-t border-slate-900/50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-white tracking-tight">{item.name}</h3>
                      <span className="text-3xl font-black text-blue-500">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-slate-400 font-semibold leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Slider Dots indicators */}
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
              {featuredItems.map((_: FoodItem, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeSlideIndex ? 'w-8 bg-blue-500' : 'w-2.5 bg-slate-700'
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Structured scrolling list */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-4">
            Menu Board
          </h2>

          <div className="flex-1 bg-slate-900/35 border border-slate-800/80 rounded-3xl p-6 overflow-y-auto scrollbar-none">
            <div className="space-y-8">
              {Object.entries(categoriesMap).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  {/* Category Section Title */}
                  <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                    {category}
                  </h3>

                  {/* Category Items List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((dish: FoodItem) => (
                      <div
                        key={dish.id}
                        className="flex gap-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/30 hover:border-slate-800 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-extrabold text-sm text-slate-200 truncate leading-snug">
                              {dish.name}
                            </h4>
                            <span className="font-black text-sm text-blue-500 shrink-0 ml-1">
                              ${dish.price.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-0.5 leading-snug">
                            {dish.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {dish.spicy && (
                              <Badge className="bg-red-500/10 text-red-400 border border-red-500/10 text-[9px] px-1 py-0 font-extrabold leading-none">
                                Spicy
                              </Badge>
                            )}
                            {dish.veg && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[9px] px-1 py-0 font-extrabold leading-none">
                                Veg
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
