'use client';

/**
 * RecipeManagement.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-featured Recipes list + Create/Edit modal.
 * All data lives in React state (no backend).
 *
 * To connect to an API later:
 *  - Replace `useState(DUMMY_RECIPES)` with a data-fetching hook
 *  - Replace save/delete handlers with API mutation calls
 *  - Replace `INGREDIENT_CATALOGUE` fetch with GET /api/ingredients
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  X,
  ChefHat,
  TrendingUp,
  DollarSign,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DUMMY_RECIPES,
  INGREDIENT_CATALOGUE,
  IngredientCatalogueItem,
  Recipe,
  RecipeIngredient,
  RecipeCategory,
  computeIngredientCost,
  computeFullCost,
} from '@/lib/data/dummy-production';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: RecipeCategory[] = [
  'Bread & Pastry',
  'Cakes & Desserts',
  'Beverages',
  'Savory',
  'Pizza',
  'Salads & Sides',
  'Sauces & Dressings',
];

const UNIT_OPTIONS = ['kg', 'g', 'liter', 'ml', 'piece', 'tray', 'cup', 'tbsp', 'tsp'];

const CATEGORY_BADGE_STYLE: Record<string, string> = {
  'Bread & Pastry': 'bg-amber-100 text-amber-700 border-amber-200',
  'Cakes & Desserts': 'bg-pink-100  text-pink-700  border-pink-200',
  Beverages: 'bg-cyan-100  text-cyan-700  border-cyan-200',
  Savory: 'bg-orange-100 text-orange-700 border-orange-200',
  Pizza: 'bg-red-100   text-red-700   border-red-200',
  'Salads & Sides': 'bg-green-100 text-green-700 border-green-200',
  'Sauces & Dressings': 'bg-rose-100  text-rose-700  border-rose-200',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DialogMode = 'create' | 'edit' | 'view';

interface RecipeFormData {
  name: string;
  sku: string;
  category: RecipeCategory;
  description: string;
  yieldQty: number;
  yieldUnit: string;
  wastePct: number;
  sellingPrice: number;
  labourCostPct: number;
  overheadCostPct: number;
  isActive: boolean;
  ingredients: RecipeIngredient[];
}

const blankIngredient = (): RecipeIngredient => ({
  id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  catalogueItemId: '',
  name: '',
  quantity: 1,
  unit: 'kg',
  unitCost: 0,
});

const defaultForm = (): RecipeFormData => ({
  name: '',
  sku: '',
  category: 'Bread & Pastry',
  description: '',
  yieldQty: 1,
  yieldUnit: 'units',
  wastePct: 5,
  sellingPrice: 0,
  labourCostPct: 15,
  overheadCostPct: 10,
  isActive: true,
  ingredients: [blankIngredient()],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);

const pct = (n: number) => `${n.toFixed(1)}%`;

function marginColor(m: number) {
  if (m >= 40) return 'text-green-600';
  if (m >= 25) return 'text-emerald-600';
  if (m >= 15) return 'text-amber-600';
  return 'text-red-600';
}

function marginLabel(m: number) {
  if (m >= 40) return '🟢 Excellent';
  if (m >= 25) return '🟡 Good';
  if (m >= 15) return '🟠 Marginal';
  return '🔴 Critical';
}

// ─── Live cost panel (used inside form) ──────────────────────────────────────
function CostPanel({ form }: { form: RecipeFormData }) {
  const raw = form.ingredients.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const waste = raw * (form.wastePct / 100);
  const ingredient = raw + waste;
  const labour = ingredient * (form.labourCostPct / 100);
  const overhead = ingredient * (form.overheadCostPct / 100);
  const total = ingredient + labour + overhead;
  const perUnit = form.yieldQty > 0 ? total / form.yieldQty : 0;
  const profitPerUnit = form.sellingPrice - perUnit;
  const margin = form.sellingPrice > 0 ? (profitPerUnit / form.sellingPrice) * 100 : 0;

  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Live Cost Summary
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Raw Ingredients', value: fmt(raw) },
          { label: `Waste (${form.wastePct}%)`, value: fmt(waste) },
          { label: 'Labour', value: fmt(labour) },
          { label: 'Overhead', value: fmt(overhead) },
          { label: 'Total Production', value: fmt(total), bold: true },
          { label: 'Cost per Unit', value: fmt(perUnit), bold: true },
        ].map(row => (
          <div key={row.label} className="bg-background rounded-lg border p-2.5">
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p className={`text-sm mt-0.5 ${row.bold ? 'font-bold' : 'font-medium'}`}>
              {row.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-6 pt-1 border-t">
        <div>
          <p className="text-xs text-muted-foreground">Selling Price / Unit</p>
          <p className="text-base font-bold">{fmt(form.sellingPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Est. Profit / Unit</p>
          <p
            className={`text-base font-bold ${profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {fmt(profitPerUnit)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gross Margin</p>
          <p className={`text-base font-bold ${marginColor(margin)}`}>
            {pct(margin)} <span className="text-xs font-normal">{marginLabel(margin)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecipeManagement() {
  const [recipes, setRecipes] = useState<Recipe[]>(DUMMY_RECIPES);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeFormData>(defaultForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      recipes.filter(r => {
        const q = search.toLowerCase();
        const matchSearch =
          !q || r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
        const matchCat = filterCategory === 'all' || r.category === filterCategory;
        const matchStatus =
          filterStatus === 'all' || (filterStatus === 'active' ? r.isActive : !r.isActive);
        return matchSearch && matchCat && matchStatus;
      }),
    [recipes, search, filterCategory, filterStatus]
  );

  // ── Summary stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeCount = recipes.filter(r => r.isActive).length;
    const avgMargin = recipes.length
      ? recipes.reduce((s, r) => {
          const { costPerUnit } = computeFullCost(r);
          return (
            s + (r.sellingPrice > 0 ? ((r.sellingPrice - costPerUnit) / r.sellingPrice) * 100 : 0)
          );
        }, 0) / recipes.length
      : 0;
    const categories = new Set(recipes.map(r => r.category)).size;
    return { total: recipes.length, active: activeCount, avgMargin, categories };
  }, [recipes]);

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const openDialog = (mode: DialogMode, recipe?: Recipe) => {
    setDialogMode(mode);
    if (recipe) {
      setSelectedId(recipe.id);
      setForm({
        name: recipe.name,
        sku: recipe.sku,
        category: recipe.category,
        description: recipe.description,
        yieldQty: recipe.yieldQty,
        yieldUnit: recipe.yieldUnit,
        wastePct: recipe.wastePct,
        sellingPrice: recipe.sellingPrice,
        labourCostPct: recipe.labourCostPct,
        overheadCostPct: recipe.overheadCostPct,
        isActive: recipe.isActive,
        ingredients: recipe.ingredients.map(i => ({ ...i })),
      });
    } else {
      setSelectedId(null);
      setForm(defaultForm());
    }
    setIsDialogOpen(true);
  };

  // ── Ingredient row helpers ──────────────────────────────────────────────────
  const pickIngredient = (idx: number, catalogueId: string) => {
    const cat = INGREDIENT_CATALOGUE.find(c => c.id === catalogueId);
    setForm(p => {
      const ings = [...p.ingredients];
      ings[idx] = {
        ...ings[idx],
        catalogueItemId: catalogueId,
        name: cat?.name ?? '',
        unit: cat?.unit ?? 'kg',
        unitCost: cat?.unitCost ?? 0,
      };
      return { ...p, ingredients: ings };
    });
  };

  const updateIngField = (
    idx: number,
    field: 'quantity' | 'unit' | 'unitCost',
    val: number | string
  ) => {
    setForm(p => {
      const ings = [...p.ingredients];
      (ings[idx] as any)[field] = val;
      return { ...p, ingredients: ings };
    });
  };

  const addIngredient = () =>
    setForm(p => ({ ...p, ingredients: [...p.ingredients, blankIngredient()] }));
  const removeIngredient = (idx: number) =>
    setForm(p => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }));

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Recipe name is required');
      return;
    }
    if (!form.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    if (form.ingredients.length === 0) {
      toast.error('Add at least one ingredient');
      return;
    }
    if (form.ingredients.some(i => !i.catalogueItemId)) {
      toast.error('Select an item for every ingredient row');
      return;
    }

    const now = new Date().toISOString();
    if (dialogMode === 'create') {
      const newRecipe: Recipe = {
        id: `rec-${Date.now()}`,
        ...form,
        createdAt: now,
        updatedAt: now,
      };
      setRecipes(p => [newRecipe, ...p]);
      toast.success('Recipe created');
    } else {
      setRecipes(p => p.map(r => (r.id === selectedId ? { ...r, ...form, updatedAt: now } : r)));
      toast.success('Recipe updated');
    }
    setIsDialogOpen(false);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    setRecipes(p => p.filter(r => r.id !== deleteId));
    setDeleteId(null);
    toast.success('Recipe deleted');
  };

  const isReadOnly = dialogMode === 'view';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Recipes</h2>
            <p className="text-muted-foreground mt-1">
              Manage production recipes with ingredient costing, waste, and profit analysis.
            </p>
          </div>
          <Button onClick={() => openDialog('create')} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Recipe
          </Button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Recipes',
              value: stats.total,
              icon: ChefHat,
              color: 'text-violet-600',
              bg: 'bg-violet-100 dark:bg-violet-900/30',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: Layers,
              color: 'text-green-600',
              bg: 'bg-green-100 dark:bg-green-900/30',
            },
            {
              label: 'Avg Margin',
              value: pct(stats.avgMargin),
              icon: TrendingUp,
              color: 'text-blue-600',
              bg: 'bg-blue-100 dark:bg-blue-900/30',
            },
            {
              label: 'Categories',
              value: stats.categories,
              icon: DollarSign,
              color: 'text-amber-600',
              bg: 'bg-amber-100 dark:bg-amber-900/30',
            },
          ].map(s => (
            <Card key={s.label} className="py-4">
              <CardContent className="py-0 px-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Recipes Table ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recipes ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="border-t overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost / Unit</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map(recipe => {
                      const { costPerUnit } = computeFullCost(recipe);
                      const margin =
                        recipe.sellingPrice > 0
                          ? ((recipe.sellingPrice - costPerUnit) / recipe.sellingPrice) * 100
                          : 0;
                      return (
                        <TableRow key={recipe.id} className="group">
                          <TableCell className="font-medium">{recipe.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {recipe.sku}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${CATEGORY_BADGE_STYLE[recipe.category] ?? ''}`}
                            >
                              {recipe.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {fmt(costPerUnit)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {fmt(recipe.sellingPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-sm font-semibold ${marginColor(margin)}`}>
                              {pct(margin)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={recipe.isActive ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {recipe.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View"
                                onClick={() => openDialog('view', recipe)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                onClick={() => openDialog('edit', recipe)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(recipe.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                        No recipes found. Try adjusting your filters or create a new recipe.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Create / Edit / View Dialog ─────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-violet-600" />
              {dialogMode === 'create'
                ? 'Create New Recipe'
                : dialogMode === 'edit'
                  ? 'Edit Recipe'
                  : 'Recipe Details'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Define a new production recipe. All cost fields update in real time.'
                : dialogMode === 'edit'
                  ? 'Update recipe fields. Cost preview updates as you type.'
                  : 'Read-only view of this recipe&apos;s details and cost breakdown.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ── Basic Info ───────────────────────────────────────────────── */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Basic Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    Recipe Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    disabled={isReadOnly}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Classic Sourdough Loaf"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    SKU <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.sku}
                    disabled={isReadOnly}
                    onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                    placeholder="e.g. BRD-001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    disabled={isReadOnly}
                    onValueChange={v => setForm(p => ({ ...p, category: v as RecipeCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.isActive ? 'active' : 'inactive'}
                    disabled={isReadOnly}
                    onValueChange={v => setForm(p => ({ ...p, isActive: v === 'active' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    disabled={isReadOnly}
                    rows={2}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description…"
                  />
                </div>
              </div>
            </section>

            {/* ── Production Parameters ────────────────────────────────────── */}
            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Production Parameters
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Yield Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.yieldQty}
                    disabled={isReadOnly}
                    onChange={e => setForm(p => ({ ...p, yieldQty: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Yield Unit</Label>
                  <Input
                    value={form.yieldUnit}
                    disabled={isReadOnly}
                    onChange={e => setForm(p => ({ ...p, yieldUnit: e.target.value }))}
                    placeholder="loaves / slices…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Waste %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.wastePct}
                      disabled={isReadOnly}
                      onChange={e => setForm(p => ({ ...p, wastePct: Number(e.target.value) }))}
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Selling Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.sellingPrice}
                      disabled={isReadOnly}
                      className="pl-6"
                      onChange={e => setForm(p => ({ ...p, sellingPrice: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Labour Cost %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.labourCostPct}
                      disabled={isReadOnly}
                      onChange={e =>
                        setForm(p => ({ ...p, labourCostPct: Number(e.target.value) }))
                      }
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Overhead Cost %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.overheadCostPct}
                      disabled={isReadOnly}
                      onChange={e =>
                        setForm(p => ({ ...p, overheadCostPct: Number(e.target.value) }))
                      }
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Ingredients ─────────────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Ingredients
                </p>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={addIngredient}>
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Add Ingredient
                  </Button>
                )}
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-2">
                {['Ingredient', 'Qty', 'Unit', 'Unit Cost ($)', 'Subtotal', ''].map((h, i) => (
                  <p
                    key={i}
                    className={`text-xs font-medium text-muted-foreground ${
                      i === 0
                        ? 'col-span-4'
                        : i === 1
                          ? 'col-span-2'
                          : i === 2
                            ? 'col-span-2'
                            : i === 3
                              ? 'col-span-2'
                              : 'col-span-1'
                    } ${i === 3 || i === 4 ? 'text-right' : ''}`}
                  >
                    {h}
                  </p>
                ))}
              </div>

              <div className="space-y-2">
                {form.ingredients.map((ing, idx) => {
                  const subtotal = ing.quantity * ing.unitCost;
                  return (
                    <div
                      key={ing.id}
                      className="grid grid-cols-12 gap-2 items-center bg-muted/20 rounded-lg px-2 py-2 border"
                    >
                      {/* Ingredient dropdown */}
                      <div className="col-span-4">
                        {isReadOnly ? (
                          <p className="text-sm font-medium pl-1">{ing.name}</p>
                        ) : (
                          <Select
                            value={ing.catalogueItemId}
                            onValueChange={v => pickIngredient(idx, v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select item…" />
                            </SelectTrigger>
                            <SelectContent>
                              {INGREDIENT_CATALOGUE.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}{' '}
                                  <span className="text-muted-foreground ml-1">
                                    ({cat.unit}, ${cat.unitCost})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {/* Quantity */}
                      <div className="col-span-2">
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          min={0}
                          step={0.01}
                          value={ing.quantity}
                          disabled={isReadOnly}
                          onChange={e => updateIngField(idx, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      {/* Unit */}
                      <div className="col-span-2">
                        {isReadOnly ? (
                          <p className="text-sm pl-1">{ing.unit}</p>
                        ) : (
                          <Select
                            value={ing.unit}
                            onValueChange={v => updateIngField(idx, 'unit', v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map(u => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {/* Unit cost */}
                      <div className="col-span-2 text-right">
                        <Input
                          className="h-8 text-sm text-right"
                          type="number"
                          min={0}
                          step={0.01}
                          value={ing.unitCost}
                          disabled={isReadOnly}
                          onChange={e => updateIngField(idx, 'unitCost', Number(e.target.value))}
                        />
                      </div>
                      {/* Subtotal */}
                      <div className="col-span-1 text-right">
                        <p className="text-sm font-semibold pr-1">${subtotal.toFixed(2)}</p>
                      </div>
                      {/* Remove */}
                      <div className="col-span-1 flex justify-end">
                        {!isReadOnly && form.ingredients.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeIngredient(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Live Cost Panel ──────────────────────────────────────────── */}
            <CostPanel form={form} />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {dialogMode === 'view' && (
              <Button onClick={() => setDialogMode('edit')}>
                <Edit className="h-4 w-4 mr-2" /> Edit Recipe
              </Button>
            )}
            {!isReadOnly && (
              <Button onClick={handleSave}>
                {dialogMode === 'create' ? 'Create Recipe' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the recipe. Any associated production orders will be
              unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
