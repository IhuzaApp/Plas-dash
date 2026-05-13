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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem('theme-primary-color');
    if (savedColor) {
      try {
        setInternalColor(JSON.parse(savedColor));
      } catch (e) {
        console.error('Failed to parse theme color', e);
      }
    }
    setIsInitialized(true);
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
    if (!isInitialized) return;

    // Inject CSS variables
    const root = document.documentElement;
    const h = color.hsl.split(' ')[0];
    const s = color.hsl.split(' ')[1];

    // Main primary
    root.style.setProperty('--primary', color.hsl);
    root.style.setProperty('--ring', color.hsl);
    
    // Secondary and Accent - derived from primary
    // Secondary: slightly more saturated or lighter
    root.style.setProperty('--secondary', `${h} ${s} 35%`);
    root.style.setProperty('--accent', `${h} ${s} 22%`);
    root.style.setProperty('--muted', `${h} 20% 96%`); // Keep muted very light but tint with hue

    // Sidebar overrides
    root.style.setProperty('--sidebar-background', `${h} ${s} 8%`);
    root.style.setProperty('--sidebar-foreground', `${h} 10% 98%`);
    root.style.setProperty('--sidebar-primary', color.hsl);
    root.style.setProperty('--sidebar-accent', `${h} ${s} 15%`);
    root.style.setProperty('--sidebar-border', `${h} ${s} 12%`);
    root.style.setProperty('--sidebar-ring', color.hsl);

    // Chart colors
    root.style.setProperty('--chart-1', `${h} ${s} 25%`);
    root.style.setProperty('--chart-2', `${h} ${s} 35%`);
    root.style.setProperty('--chart-3', `${h} ${s} 45%`);
    root.style.setProperty('--chart-4', `${h} ${s} 55%`);
    root.style.setProperty('--chart-5', `${h} ${s} 65%`);
    
    localStorage.setItem('theme-primary-color', JSON.stringify(color));
  }, [color, isInitialized]);

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
