import re

with open("src/components/pages/pos/POSLoginScreen.tsx", "r") as f:
    c = f.read()

def rep(old, new):
    global c
    if old in c:
        c = c.replace(old, new)
    else:
        print(f"Warning: Not found: {old}")

# Main Wrappers
rep('bg-slate-950 text-white', 'bg-background text-foreground dark:bg-slate-950 dark:text-white')
rep('bg-slate-900/70 border-slate-800/80', 'bg-card/95 border-border dark:bg-slate-900/70 dark:border-slate-800/80')

# Logo border
rep('border-slate-700 shadow-lg', 'border-border dark:border-slate-700 shadow-lg')

# Texts
rep('text-slate-400 font-bold', 'text-muted-foreground dark:text-slate-400 font-bold')
rep('text-slate-400 font-medium', 'text-muted-foreground dark:text-slate-400 font-medium')
rep('text-slate-500 mx-1', 'text-muted-foreground/60 dark:text-slate-500 mx-1')
rep('text-slate-500 font-bold', 'text-muted-foreground dark:text-slate-500 font-bold')
rep('text-slate-500 uppercase', 'text-muted-foreground/80 dark:text-slate-500 uppercase')
rep('text-slate-500 py-4', 'text-muted-foreground/80 dark:text-slate-500 py-4')
rep('text-slate-500 py-3', 'text-muted-foreground/80 dark:text-slate-500 py-3')
rep('text-white mt-2', 'text-foreground dark:text-white mt-2')

# Grid Card
rep('bg-slate-800/40 border border-slate-800/60 hover:border-primary/50 hover:bg-slate-800/80', 'bg-muted/40 dark:bg-slate-800/40 border border-border dark:border-slate-800/60 hover:border-primary/50 hover:bg-accent dark:hover:bg-slate-800/80')
rep('text-slate-200 group-hover:text-white', 'text-foreground dark:text-slate-200 group-hover:text-primary dark:group-hover:text-white')
rep('text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-400', 'text-muted-foreground/80 dark:text-slate-500 font-bold uppercase tracking-wider group-hover:text-foreground dark:group-hover:text-slate-400')

# Avatar fallback
rep('bg-slate-700/60 border-2 border-slate-600', 'bg-muted dark:bg-slate-700/60 border-2 border-border dark:border-slate-600')
rep('text-slate-300', 'text-muted-foreground dark:text-slate-300')
rep('border-2 border-slate-600', 'border-2 border-border dark:border-slate-600')

# Search
rep('text-slate-500"', 'text-muted-foreground/80 dark:text-slate-500"')
rep('bg-slate-800 border-slate-700 text-white placeholder-slate-500', 'bg-background dark:bg-slate-800 border-border dark:border-slate-700 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-slate-500')

# Password input
rep('bg-slate-800 border-slate-700 text-white placeholder-slate-500', 'bg-background dark:bg-slate-800 border-border dark:border-slate-700 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-slate-500')

# Back button
rep('text-slate-400 hover:text-white', 'text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white')

# Loading PIN text
rep('text-slate-400 text-xs', 'text-muted-foreground dark:text-slate-400 text-xs')
rep('text-slate-400 mt-1', 'text-muted-foreground dark:text-slate-400 mt-1')

# Keypad 
rep('border-slate-700 bg-transparent', 'border-border dark:border-slate-700 bg-transparent')
rep('bg-slate-800/40 border border-slate-800 text-lg font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white py-3', 'bg-muted/60 dark:bg-slate-800/40 border border-border dark:border-slate-800 text-lg font-black hover:bg-accent dark:hover:bg-slate-800 hover:border-primary/50 dark:hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-foreground dark:text-white py-3')
rep('bg-slate-800/40 border border-slate-800 text-base font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white py-3', 'bg-muted/60 dark:bg-slate-800/40 border border-border dark:border-slate-800 text-base font-black hover:bg-accent dark:hover:bg-slate-800 hover:border-primary/50 dark:hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-foreground dark:text-white py-3')

with open("src/components/pages/pos/POSLoginScreen.tsx", "w") as f:
    f.write(c)
