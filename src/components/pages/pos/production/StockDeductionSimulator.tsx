'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle2, FlaskConical, Info, TriangleAlert } from 'lucide-react';
import { DUMMY_RECIPES, DUMMY_INVENTORY_SNAPSHOT, Recipe } from '@/lib/data/dummy-production';

interface SimulatedItem {
  name: string;
  currentStock: number;
  unit: string;
  required: number;
  remaining: number;
  lowStockThreshold: number;
  isSufficient: boolean;
  willBeLow: boolean;
}

function simulate(recipe: Recipe, batches: number): SimulatedItem[] {
  return recipe.ingredients.map(ing => {
    // Match inventory snapshot by ingredient name (in production: match by inventoryItemId)
    const snap = DUMMY_INVENTORY_SNAPSHOT.find(i =>
      i.name.toLowerCase().includes(ing.name.toLowerCase().split(' ')[0])
    );
    const current = snap?.currentStock ?? 999;
    const threshold = snap?.lowStockThreshold ?? 0;
    const unit = snap?.unit ?? ing.unit;
    const required = ing.quantity * batches;
    const remaining = current - required;
    return {
      name: ing.name,
      currentStock: current,
      unit,
      required,
      remaining,
      lowStockThreshold: threshold,
      isSufficient: remaining >= 0,
      willBeLow: remaining >= 0 && remaining < threshold,
    };
  });
}

export default function StockDeductionSimulator() {
  const [recipeId, setRecipeId] = useState(DUMMY_RECIPES[0].id);
  const [batches, setBatches] = useState(1);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [result, setResult] = useState<SimulatedItem[]>([]);

  const recipe = DUMMY_RECIPES.find(r => r.id === recipeId) ?? DUMMY_RECIPES[0];

  const handleSimulate = () => {
    setResult(simulate(recipe, batches));
    setHasSimulated(true);
  };

  const insufficient = result.filter(r => !r.isSufficient);
  const willBeLow = result.filter(r => r.isSufficient && r.willBeLow);
  const healthy = result.filter(r => r.isSufficient && !r.willBeLow);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stock Deduction Simulator</h2>
        <p className="text-muted-foreground mt-1">
          Simulate ingredient stock deductions before committing to a production run. No actual
          stock is changed.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 text-blue-800 dark:text-blue-200">
        <Info className="h-5 w-5 mt-0.5 shrink-0" />
        <p className="text-sm">
          <strong>Frontend-only simulation.</strong> No inventory changes are made. Once backend is
          connected, stock figures will reflect live inventory data.
        </p>
      </div>

      {/* Selector */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 flex-1">
              <Label>Select Recipe</Label>
              <Select
                value={recipeId}
                onValueChange={id => {
                  setRecipeId(id);
                  setHasSimulated(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_RECIPES.filter(r => r.isActive).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-40">
              <Label>Batches to Produce</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={batches}
                onChange={e => {
                  setBatches(Math.max(1, Number(e.target.value)));
                  setHasSimulated(false);
                }}
              />
            </div>
            <Button onClick={handleSimulate} size="lg">
              <FlaskConical className="h-4 w-4 mr-2" />
              Run Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick info */}
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{recipe.name}</strong>
        &nbsp;·&nbsp;Yield: {recipe.yieldQty * batches} {recipe.yieldUnit} from {batches} batch
        {batches !== 1 ? 'es' : ''}
        &nbsp;·&nbsp;{recipe.ingredients.length} ingredients
      </p>

      {/* Results */}
      {hasSimulated && (
        <>
          <div className="flex flex-wrap gap-3">
            {insufficient.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-300 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                {insufficient.length} item{insufficient.length !== 1 ? 's' : ''} insufficient
              </div>
            )}
            {willBeLow.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-700 dark:text-amber-300 text-sm font-medium">
                <TriangleAlert className="h-4 w-4" />
                {willBeLow.length} item{willBeLow.length !== 1 ? 's' : ''} will be low
              </div>
            )}
            {insufficient.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-700 dark:text-green-300 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Sufficient stock to proceed
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulated Stock Deductions</CardTitle>
              <CardDescription>
                Stock levels <em>after</em> producing {batches} batch{batches !== 1 ? 'es' : ''} of{' '}
                <strong>{recipe.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.map((item, i) => (
                    <TableRow
                      key={i}
                      className={
                        !item.isSufficient
                          ? 'bg-red-50/50 dark:bg-red-950/10'
                          : item.willBeLow
                            ? 'bg-amber-50/50 dark:bg-amber-950/10'
                            : ''
                      }
                    >
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="text-right text-sm">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {item.required.toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-bold ${!item.isSufficient ? 'text-red-600' : item.willBeLow ? 'text-amber-600' : 'text-green-600'}`}
                      >
                        {item.isSufficient
                          ? `${item.remaining.toFixed(2)} ${item.unit}`
                          : `−${Math.abs(item.remaining).toFixed(2)} ${item.unit}`}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {item.lowStockThreshold} {item.unit}
                      </TableCell>
                      <TableCell>
                        {!item.isSufficient ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 border-red-200 text-xs"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" /> Insufficient
                          </Badge>
                        ) : item.willBeLow ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700 border-amber-200 text-xs"
                          >
                            <TriangleAlert className="h-3 w-3 mr-1" /> Will be Low
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-200 text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'OK',
                count: healthy.length,
                color: 'text-green-700',
                bg: 'bg-green-50 dark:bg-green-950/20 border-green-200',
              },
              {
                label: 'Will be Low',
                count: willBeLow.length,
                color: 'text-amber-700',
                bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200',
              },
              {
                label: 'Insufficient',
                count: insufficient.length,
                color: 'text-red-700',
                bg: 'bg-red-50 dark:bg-red-950/20 border-red-200',
              },
            ].map(s => (
              <div key={s.label} className={`rounded-lg border p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!hasSimulated && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <FlaskConical className="h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">No simulation run yet</p>
          <p className="text-sm">
            Select a recipe and batch count, then click <strong>Run Simulation</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
