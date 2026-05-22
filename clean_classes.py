import re

with open("src/components/pages/pos/POSLoginScreen.tsx", "r") as f:
    c = f.read()

# Fix duplicates
c = c.replace("text-muted-foreground dark:text-muted-foreground/80 dark:text-slate-500", "text-muted-foreground dark:text-slate-500")
c = c.replace("text-muted-foreground/80 dark:text-muted-foreground/80 dark:text-slate-500", "text-muted-foreground/80 dark:text-slate-500")
c = c.replace("text-foreground dark:text-slate-200 dark:group-hover:text-foreground dark:hover:text-white", "text-foreground dark:text-slate-200 group-hover:text-primary dark:group-hover:text-white")
c = c.replace("group-hover:text-muted-foreground dark:text-slate-400", "group-hover:text-muted-foreground dark:group-hover:text-slate-400")

# Fix inputs
c = c.replace("bg-background border-border text-foreground placeholder:text-muted-foreground dark:bg-slate-800 dark:border-border dark:border-slate-700", "bg-background dark:bg-slate-800 border-border dark:border-slate-700 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder-slate-500")
c = c.replace("dark:bg-slate-800 dark:border-border dark:border-slate-700 pl-8", "dark:bg-slate-800 border-border dark:border-slate-700 pl-8")

with open("src/components/pages/pos/POSLoginScreen.tsx", "w") as f:
    f.write(c)
