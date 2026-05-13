'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeColor = {
  name: string;
  hsl: string;
  primary: string; // Hex for the picker
};

const defaultColor: ThemeColor = {
  name: 'Emerald (Default)',
  hsl: '142 76% 17%',
  primary: '#064e3b',
};

type ThemeColorContextType = {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  setCustomColor: (hex: string) => void;
};

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

const hexToHsl = (hex: string): string => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemeColorProvider = ({ children }: { children: React.ReactNode }) => {
  const [color, setInternalColor] = useState<ThemeColor>(defaultColor);

  useEffect(() => {
    const savedColor = localStorage.getItem('theme-primary-color');
    if (savedColor) {
      try {
        setInternalColor(JSON.parse(savedColor));
      } catch (e) {
        console.error('Failed to parse theme color', e);
      }
    }
  }, []);

  const setCustomColor = (hex: string) => {
    const hsl = hexToHsl(hex);
    setInternalColor({
      name: 'Custom',
      hsl,
      primary: hex
    });
  };

  useEffect(() => {
    // Inject CSS variables
    const root = document.documentElement;
    const h = color.hsl.split(' ')[0];
    const s = color.hsl.split(' ')[1];
    const l = color.hsl.split(' ')[2].replace('%', '');

    // Main primary
    root.style.setProperty('--primary', color.hsl);
    root.style.setProperty('--ring', color.hsl);
    
    // Sidebar overrides - calculating variations based on primary
    // Background: very dark (5-10% lightness)
    root.style.setProperty('--sidebar-background', `${h} ${s} 8%`);
    root.style.setProperty('--sidebar-foreground', `${h} 10% 98%`);
    root.style.setProperty('--sidebar-primary', color.hsl);
    root.style.setProperty('--sidebar-accent', `${h} ${s} 15%`);
    root.style.setProperty('--sidebar-border', `${h} ${s} 12%`);
    root.style.setProperty('--sidebar-ring', color.hsl);

    // Chart colors - different lightness
    root.style.setProperty('--chart-1', `${h} ${s} 25%`);
    root.style.setProperty('--chart-2', `${h} ${s} 35%`);
    root.style.setProperty('--chart-3', `${h} ${s} 45%`);
    root.style.setProperty('--chart-4', `${h} ${s} 55%`);
    root.style.setProperty('--chart-5', `${h} ${s} 65%`);
    
    localStorage.setItem('theme-primary-color', JSON.stringify(color));
  }, [color]);

  return (
    <ThemeColorContext.Provider value={{ color, setColor: setInternalColor, setCustomColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
};

export const useThemeColor = () => {
  const context = useContext(ThemeColorContext);
  if (context === undefined) {
    throw new Error('useThemeColor must be used within a ThemeColorProvider');
  }
  return context;
};
