'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Percent, Download } from 'lucide-react';
import { DUMMY_RECIPES, computeFullCost } from '@/lib/data/dummy-production';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'];

const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export default function CostProfitPreview() {
    const [recipeId, setRecipeId] = useState(DUMMY_RECIPES[0].id);
    const [batches, setBatches] = useState(1);
    const [extraLabourCost, setExtraLabourCost] = useState(0);

    const recipe = DUMMY_RECIPES.find(r => r.id === recipeId) ?? DUMMY_RECIPES[0];
    const { ingredientCost, wasteCost, labourCost, overheadCost, totalCost, costPerUnit } =
        computeFullCost(recipe, batches);

    const totalLabour = labourCost + extraLabourCost;
    const finalTotal = ingredientCost + totalLabour + overheadCost;
    const finalCPU = recipe.yieldQty * batches > 0 ? finalTotal / (recipe.yieldQty * batches) : 0;
    const revenue = recipe.sellingPrice * recipe.yieldQty * batches;
    const grossProfit = revenue - finalTotal;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const pieData = [
        { name: 'Ingredients', value: ingredientCost },
        { name: 'Labour', value: totalLabour },
        { name: 'Overhead', value: overheadCost },
        { name: 'Profit', value: Math.max(0, grossProfit) },
    ].filter(d => d.value > 0);

    const ingredientBreakdown = recipe.ingredients.map(ing => ({
        name: ing.name,
        qty: ing.quantity * batches,
        unit: ing.unit,
        unitCost: ing.unitCost,
        total: ing.quantity * batches * ing.unitCost,
        pct: ingredientCost > 0 ? (ing.quantity * batches * ing.unitCost / ingredientCost) * 100 : 0,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cost &amp; Profit Preview</h2>
                    <p className="text-muted-foreground mt-1">
                        Analyze ingredient costs, labour, overheads, and profit margins for any recipe.
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Selector */}
            <Card>
                <CardContent className="pt-5 pb-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-1.5 flex-1">
                            <Label>Select Recipe</Label>
                            <Select value={recipeId} onValueChange={setRecipeId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DUMMY_RECIPES.filter(r => r.isActive).map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 w-36">
                            <Label>Batches</Label>
                            <Input type="number" min={1} max={100} value={batches}
                                onChange={e => setBatches(Math.max(1, Number(e.target.value)))} />
                        </div>
                        <div className="space-y-1.5 w-48">
                            <Label>Extra Labour Cost ($)</Label>
                            <Input type="number" min={0} step={0.01} value={extraLabourCost}
                                onChange={e => setExtraLabourCost(Number(e.target.value))} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Cost', value: fmt(finalTotal), icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
                    { label: 'Revenue (projected)', value: fmt(revenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
                    { label: 'Gross Profit', value: fmt(Math.max(0, grossProfit)), icon: DollarSign, color: grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
                    { label: 'Gross Margin', value: `${margin.toFixed(1)}%`, icon: Percent, color: margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-amber-600' : 'text-red-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                ].map(card => (
                    <Card key={card.label}>
                        <CardContent className="pt-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">{card.label}</p>
                                    <p className={`text-xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                                </div>
                                <div className={`p-2.5 rounded-full ${card.bg}`}>
                                    <card.icon className={`h-5 w-5 ${card.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Ingredient table */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base">Ingredient Cost Breakdown</CardTitle>
                        <CardDescription>
                            {recipe.yieldQty * batches} {recipe.yieldUnit} · Waste: {recipe.wastePct}% · Cost/Unit: <strong>{fmt(finalCPU)}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ingredient</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">% of Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ingredientBreakdown.map((ing, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-sm font-medium">{ing.name}</TableCell>
                                        <TableCell className="text-right text-sm">{ing.qty} {ing.unit}</TableCell>
                                        <TableCell className="text-right text-sm">{fmt(ing.unitCost)}</TableCell>
                                        <TableCell className="text-right text-sm font-semibold">{fmt(ing.total)}</TableCell>
                                        <TableCell className="text-right text-sm">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 bg-muted rounded-full h-1.5">
                                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${ing.pct}%` }} />
                                                </div>
                                                <span className="text-muted-foreground w-12 text-right">{ing.pct.toFixed(1)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Waste row */}
                                <TableRow className="bg-orange-50/50 dark:bg-orange-950/10">
                                    <TableCell colSpan={3} className="text-sm text-orange-700 dark:text-orange-300">Waste ({recipe.wastePct}%)</TableCell>
                                    <TableCell className="text-right text-sm text-orange-700 dark:text-orange-300">{fmt(wasteCost)}</TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow className="border-t-2 bg-muted/20">
                                    <TableCell colSpan={3} className="font-semibold text-sm">Ingredient Subtotal (incl. waste)</TableCell>
                                    <TableCell className="text-right font-bold text-sm">{fmt(ingredientCost)}</TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-sm text-muted-foreground">Labour</TableCell>
                                    <TableCell className="text-right text-sm">{fmt(totalLabour)}</TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-sm text-muted-foreground">Overhead</TableCell>
                                    <TableCell className="text-right text-sm">{fmt(overheadCost)}</TableCell>
                                    <TableCell />
                                </TableRow>
                                <TableRow className="bg-muted/40 font-bold">
                                    <TableCell colSpan={3} className="text-sm font-bold">Total Production Cost</TableCell>
                                    <TableCell className="text-right text-sm font-bold">{fmt(finalTotal)}</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pie + margin gauge */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Cost Composition</CardTitle>
                        <CardDescription>Visual cost & profit breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90}
                                        paddingAngle={3} dataKey="value">
                                        {pieData.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                        formatter={(v: number) => [fmt(v)]} />
                                    <Legend iconType="circle" verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Gross Margin</span>
                                <span className="font-semibold">{margin.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3">
                                <div className={`h-3 rounded-full transition-all ${margin >= 40 ? 'bg-green-500' : margin >= 25 ? 'bg-emerald-400' : margin >= 15 ? 'bg-amber-400' : 'bg-red-500'
                                    }`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span className={margin >= 30 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                    {margin >= 40 ? '🟢 Excellent' : margin >= 25 ? '🟡 Good' : margin >= 15 ? '🟠 Marginal' : '🔴 Critical'}
                                </span>
                                <span>100%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
