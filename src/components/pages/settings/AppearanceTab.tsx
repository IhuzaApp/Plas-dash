import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const themePresets = [
  { name: 'Emerald (Default)', hsl: '142 76% 17%', primary: '#064e3b' },
  { name: 'Ocean Blue', hsl: '221 83% 53%', primary: '#3b82f6' },
  { name: 'Royal Purple', hsl: '262 83% 58%', primary: '#8b5cf6' },
  { name: 'Rose Pink', hsl: '346 84% 61%', primary: '#f43f5e' },
  { name: 'Amber Glow', hsl: '38 92% 50%', primary: '#f59e0b' },
  { name: 'Midnight', hsl: '222 47% 11%', primary: '#0f172a' },
  { name: 'Crimson', hsl: '0 72% 51%', primary: '#dc2626' },
  { name: 'Teal', hsl: '174 75% 39%', primary: '#0d9488' },
];

interface AppearanceTabProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  activeColor: { name: string; primary: string };
  setActiveColor: (color: any) => void;
  setCustomColor: (color: string) => void;
  handleSaveChanges: () => void;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  theme,
  setTheme,
  activeColor,
  setActiveColor,
  setCustomColor,
  handleSaveChanges,
}) => {
  return (
    <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>Customize the look and feel of your dashboard experience.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Interface Theme
          </Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', name: 'Light', icon: <Sun className="h-4 w-4" /> },
              { id: 'dark', name: 'Dark', icon: <Moon className="h-4 w-4" /> },
              { id: 'system', name: 'System', icon: <Smartphone className="h-4 w-4" /> },
            ].map(t => (
              <Button
                key={t.id}
                variant={theme === t.id ? 'default' : 'outline'}
                className={cn(
                  'h-20 flex flex-col gap-2 rounded-2xl transition-all duration-300',
                  theme === t.id
                    ? 'bg-primary shadow-lg shadow-primary/20 scale-105'
                    : 'hover:bg-primary/5 hover:border-primary/30'
                )}
                onClick={() => setTheme(t.id)}
              >
                {t.icon}
                <span className="text-xs font-bold uppercase tracking-tight">{t.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Primary Color Accent
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themePresets.map(p => (
              <Button
                key={p.name}
                variant="outline"
                className={cn(
                  'h-14 flex items-center justify-start gap-3 rounded-2xl transition-all duration-300 px-3 overflow-hidden',
                  activeColor.name === p.name
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
                onClick={() => {
                  setActiveColor(p);
                  toast.success(`Theme updated to ${p.name}`);
                }}
              >
                <div
                  className="h-6 w-6 rounded-lg shadow-inner flex-shrink-0"
                  style={{ backgroundColor: p.primary }}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-tighter truncate',
                    activeColor.name === p.name ? 'text-primary' : 'text-zinc-500'
                  )}
                >
                  {p.name.split(' ')[0]}
                </span>
              </Button>
            ))}

            <div className="relative group">
              <Button
                variant="outline"
                className={cn(
                  'h-14 w-full flex items-center justify-start gap-3 rounded-2xl transition-all duration-300 px-3 overflow-hidden',
                  activeColor.name === 'Custom'
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
                onClick={() => document.getElementById('custom-color-picker')?.click()}
              >
                <div
                  className="h-6 w-6 rounded-lg shadow-inner flex-shrink-0 border-2 border-dashed border-zinc-300 flex items-center justify-center text-[10px]"
                  style={{
                    backgroundColor:
                      activeColor.name === 'Custom' ? activeColor.primary : 'transparent',
                  }}
                >
                  {activeColor.name !== 'Custom' && '+'}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-tighter truncate',
                    activeColor.name === 'Custom' ? 'text-primary' : 'text-zinc-500'
                  )}
                >
                  Custom
                </span>
              </Button>
              <input
                id="custom-color-picker"
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                value={activeColor.primary}
                onChange={e => setCustomColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed">
          <div className="space-y-0.5">
            <Label htmlFor="compact-mode" className="text-sm font-bold">
              Compact Interface
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Reduce spacing and padding for a denser layout.
            </p>
          </div>
          <Switch id="compact-mode" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceTab;
