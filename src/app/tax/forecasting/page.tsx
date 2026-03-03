'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Plus,
  Sparkles,
  Calculator,
  Percent,
  CalendarDays,
  Building2,
  Cpu,
  ArrowUp,
  ArrowDown,
  Minus,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

const BASE_REVENUE = 2_000_000;
const BASE_EXPENSES = 1_200_000;
const TAX_RATE = 0.21;
const BASE_TAX = (BASE_REVENUE - BASE_EXPENSES) * TAX_RATE;
const AI_CONFIDENCE = 87;

const HISTORICAL = [
  { month: "Jan '24", revenue: 142000, expenses: 88000 },
  { month: "Feb '24", revenue: 138000, expenses: 91000 },
  { month: "Mar '24", revenue: 155000, expenses: 95000 },
  { month: "Apr '24", revenue: 162000, expenses: 97000 },
  { month: "May '24", revenue: 170000, expenses: 102000 },
  { month: "Jun '24", revenue: 176000, expenses: 104000 },
  { month: "Jul '24", revenue: 183000, expenses: 108000 },
  { month: "Aug '24", revenue: 178000, expenses: 110000 },
  { month: "Sep '24", revenue: 192000, expenses: 113000 },
  { month: "Oct '24", revenue: 195000, expenses: 116000 },
  { month: "Nov '24", revenue: 204000, expenses: 120000 },
  { month: "Dec '24", revenue: 211000, expenses: 126000 },
];

const FIXED_SCENARIOS = [
  {
    id: 1,
    title: 'What if revenue grows 20%?',
    icon: TrendingUp,
    color: 'blue',
    changes: { revenueMult: 1.2, expenseMult: 1.0 },
  },
  {
    id: 2,
    title: 'What if we hire 2 employees?',
    icon: Users,
    color: 'purple',
    changes: { revenueMult: 1.05, expenseMult: 1.15 },
  },
  {
    id: 3,
    title: 'What if expenses increase 10%?',
    icon: TrendingDown,
    color: 'orange',
    changes: { revenueMult: 1.0, expenseMult: 1.1 },
  },
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtK = (n: number) => `$${(n / 1000).toFixed(0)}k`;

export default function TaxForecastingPage() {
  const [baseYear, setBaseYear] = useState('2024');
  const [growthRateStr, setGrowthRateStr] = useState('5.0');
  const [inflationRateStr, setInflationRateStr] = useState('3.0');
  const [revenueGrowth, setRevenueGrowth] = useState(5);
  const [expenseIncrease, setExpenseIncrease] = useState(3);
  const [newEmployees, setNewEmployees] = useState(0);
  const [capEx, setCapEx] = useState(0);

  const builderRevenue = BASE_REVENUE * (1 + revenueGrowth / 100);
  const employeeCost = newEmployees * 75000;
  const capExDeduction = capEx * 1000;
  const builderExpenses = BASE_EXPENSES * (1 + expenseIncrease / 100) + employeeCost;
  const builderTaxableIncome = builderRevenue - builderExpenses - capExDeduction;
  const builderTax = Math.max(0, builderTaxableIncome * TAX_RATE);
  const taxDelta = builderTax - BASE_TAX;
  const taxDeltaPct = (taxDelta / BASE_TAX) * 100;

  const growthRate = (parseFloat(growthRateStr) || 0) / 100;
  const inflationRate = (parseFloat(inflationRateStr) || 0) / 100;

  const forecastMonths = useMemo(() => {
    const MONTHS = [
      "Jan '25",
      "Feb '25",
      "Mar '25",
      "Apr '25",
      "May '25",
      "Jun '25",
      "Jul '25",
      "Aug '25",
      "Sep '25",
      "Oct '25",
      "Nov '25",
      "Dec '25",
    ];
    const lastRev = HISTORICAL[HISTORICAL.length - 1].revenue;
    const lastExp = HISTORICAL[HISTORICAL.length - 1].expenses;
    return MONTHS.map((month, i) => {
      const rev = lastRev * Math.pow(1 + growthRate / 12, i + 1);
      const exp = lastExp * Math.pow(1 + inflationRate / 12, i + 1);
      return {
        month,
        revenue: null,
        expenses: null,
        projectedRevenue: Math.round(rev),
        projectedExpenses: Math.round(exp),
        tax: Math.round(Math.max(0, (rev - exp) * TAX_RATE)),
      };
    });
  }, [growthRate, inflationRate]);

  const combinedChartData = [
    ...HISTORICAL.map(d => ({ ...d, projectedRevenue: null, projectedExpenses: null, tax: null })),
    ...forecastMonths,
  ];

  const baseForecastData = [
    { year: '2024 (Base)', revenue: BASE_REVENUE, expenses: BASE_EXPENSES, tax: BASE_TAX },
    {
      year: '2025 (Proj)',
      revenue: BASE_REVENUE * (1 + growthRate),
      expenses: BASE_EXPENSES * (1 + inflationRate),
      tax: (BASE_REVENUE * (1 + growthRate) - BASE_EXPENSES * (1 + inflationRate)) * TAX_RATE,
    },
    {
      year: '2026 (Proj)',
      revenue: BASE_REVENUE * Math.pow(1 + growthRate, 2),
      expenses: BASE_EXPENSES * Math.pow(1 + inflationRate, 2),
      tax:
        (BASE_REVENUE * Math.pow(1 + growthRate, 2) -
          BASE_EXPENSES * Math.pow(1 + inflationRate, 2)) *
        TAX_RATE,
    },
  ];

  const scenarioResults = FIXED_SCENARIOS.map(s => {
    const projRev = BASE_REVENUE * s.changes.revenueMult;
    const projExp = BASE_EXPENSES * s.changes.expenseMult;
    const projTax = (projRev - projExp) * TAX_RATE;
    const diff = projTax - BASE_TAX;
    return { ...s, projRev, projExp, projTax, taxDiff: diff, isSavings: diff < 0 };
  });

  const comparisonData = scenarioResults.map(s => ({
    name: s.id === 1 ? 'High Growth' : s.id === 2 ? 'Hiring' : 'High Costs',
    'Base Tax': BASE_TAX,
    'Scenario Tax': s.projTax,
    diff: s.taxDiff,
  }));

  const tooltipStyle = { borderRadius: '12px', border: '1px solid #e2e8f0' };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Forecasting & Scenarios
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Model future tax liabilities based on business decisions and macro factors.
        </p>
      </div>

      {/* ── Section 1: AI Predictions ──────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Predictions Based on Imported Financial History
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                12-month historical trend + 12-month AI forward projection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-sm rounded-2xl px-4 py-2.5 shadow-sm border border-slate-700">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-slate-400 text-xs font-medium">AI Confidence</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-green-400"
                  style={{ width: `${AI_CONFIDENCE}%` }}
                />
              </div>
              <span className="font-black text-white text-sm">{AI_CONFIDENCE}%</span>
            </div>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base text-slate-800 dark:text-slate-100">
                  Revenue & Expenses — Historical + 12-Month Projection
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Solid lines = historical data · Dashed lines = AI-projected
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 border-t-2 border-slate-400" />
                  Historical
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 border-t-2 border-dashed border-blue-400" />
                  Projected
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 bg-white dark:bg-slate-900">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedChartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    interval={2}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={fmtK}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [v != null ? fmt(v) : '—', name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '16px' }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (actual)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses (actual)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedRevenue"
                    name="Revenue (proj.)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                    opacity={0.7}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedExpenses"
                    name="Expenses (proj.)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                    opacity={0.7}
                  />
                  <Line
                    type="monotone"
                    dataKey="tax"
                    name="Est. Tax (proj.)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                    opacity={0.7}
                  />
                  <ReferenceLine
                    x="Jan '25"
                    stroke="#64748b"
                    strokeDasharray="4 3"
                    label={{ value: 'Now', position: 'top', fill: '#94a3b8', fontSize: 11 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              {[
                {
                  label: 'Avg Monthly Revenue',
                  value: fmtK(HISTORICAL.reduce((s, d) => s + d.revenue, 0) / 12),
                  color: 'text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Avg Monthly Expenses',
                  value: fmtK(HISTORICAL.reduce((s, d) => s + d.expenses, 0) / 12),
                  color: 'text-amber-600 dark:text-amber-400',
                },
                {
                  label: 'Proj. FY25 Revenue',
                  value: fmtK(forecastMonths.reduce((s, d) => s + (d.projectedRevenue ?? 0), 0)),
                  color: 'text-blue-600 dark:text-blue-400',
                },
                {
                  label: 'Proj. FY25 Tax',
                  value: fmtK(forecastMonths.reduce((s, d) => s + (d.tax ?? 0), 0)),
                  color: 'text-red-600 dark:text-red-400',
                },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-lg font-black mt-0.5 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Section 2: Scenario Builder ────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30">
            <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Scenario Builder
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Adjust inputs and see your tax impact update in real time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders */}
          <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-7">
              {[
                {
                  label: 'Revenue Growth Rate',
                  icon: TrendingUp,
                  iconColor: 'text-blue-500',
                  value: revenueGrowth,
                  setter: setRevenueGrowth,
                  min: -20,
                  max: 50,
                  step: 1,
                  unit: '%',
                  badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40',
                  sub: revenueGrowth !== 0 ? '' : undefined,
                },
                {
                  label: 'Expense Increase Rate',
                  icon: TrendingDown,
                  iconColor: 'text-amber-500',
                  value: expenseIncrease,
                  setter: setExpenseIncrease,
                  min: 0,
                  max: 40,
                  step: 1,
                  unit: '%',
                  badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40',
                  sub: undefined,
                },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${s.iconColor}`} /> {s.label}
                      </Label>
                      <span className={`text-sm font-black px-3 py-1 rounded-full ${s.badgeColor}`}>
                        {s.value}
                        {s.unit}
                      </span>
                    </div>
                    <Slider
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={[s.value]}
                      onValueChange={([v]) => s.setter(v)}
                      className="py-1"
                    />
                  </div>
                );
              })}

              {/* New Employees */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" /> New Employee Cost Simulation
                  </Label>
                  <span className="text-sm font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-3 py-1 rounded-full">
                    {newEmployees} hire{newEmployees !== 1 ? 's' : ''}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={[newEmployees]}
                  onValueChange={([v]) => setNewEmployees(v)}
                  className="py-1"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Each hire ~$75,000/yr.
                  {newEmployees > 0 && (
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {' '}
                      Total: {fmt(newEmployees * 75000)}
                    </span>
                  )}
                </p>
              </div>

              {/* CapEx */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-teal-500" /> Capital Expenditure Simulation
                  </Label>
                  <span className="text-sm font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full">
                    ${capEx}k
                  </span>
                </div>
                <Slider
                  min={0}
                  max={500}
                  step={10}
                  value={[capEx]}
                  onValueChange={([v]) => setCapEx(v)}
                  className="py-1"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  CapEx deducted via Section 179.
                  {capEx > 0 && (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {' '}
                      Tax benefit: {fmt(capEx * 1000 * TAX_RATE)}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Live Tax Impact */}
          <Card
            className={`border shadow-md rounded-2xl overflow-hidden self-start
            ${taxDelta < 0 ? 'border-green-300 dark:border-green-700' : taxDelta > 0 ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'}`}
          >
            <div
              className={`px-5 py-4 text-white ${taxDelta < 0 ? 'bg-green-600' : taxDelta > 0 ? 'bg-red-500' : 'bg-slate-700'}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Projected Tax Change
              </p>
              <div className="flex items-center gap-2 mt-1">
                {taxDelta < 0 ? (
                  <ArrowDown className="h-6 w-6" />
                ) : taxDelta > 0 ? (
                  <ArrowUp className="h-6 w-6" />
                ) : (
                  <Minus className="h-6 w-6 opacity-60" />
                )}
                <p className="text-3xl font-black font-mono tracking-tight">
                  {taxDelta === 0
                    ? 'No change'
                    : `${taxDelta < 0 ? '-' : '+'}${fmt(Math.abs(taxDelta))}`}
                </p>
              </div>
              {taxDelta !== 0 && (
                <p className="text-xs mt-1 opacity-70">
                  {taxDelta < 0 ? '▼' : '▲'} {Math.abs(taxDeltaPct).toFixed(1)}% vs. base
                </p>
              )}
            </div>
            <CardContent className="p-5 space-y-4 bg-white dark:bg-slate-900">
              {[
                {
                  label: 'Projected Revenue',
                  value: fmt(builderRevenue),
                  color: 'text-blue-700 dark:text-blue-400',
                },
                {
                  label: 'Projected Expenses',
                  value: fmt(builderExpenses + capExDeduction),
                  color: 'text-amber-700 dark:text-amber-400',
                },
                {
                  label: 'Taxable Income',
                  value: fmt(builderTaxableIncome),
                  color: 'text-slate-900 dark:text-slate-100',
                },
                {
                  label: 'Base Tax (current)',
                  value: fmt(BASE_TAX),
                  color: 'text-slate-400 dark:text-slate-500',
                },
                {
                  label: 'Projected Tax',
                  value: fmt(builderTax),
                  color:
                    taxDelta < 0
                      ? 'text-green-700 dark:text-green-400'
                      : taxDelta > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-900 dark:text-slate-100',
                },
              ].map(r => (
                <div
                  key={r.label}
                  className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {r.label}
                  </span>
                  <span className={`text-sm font-bold font-mono ${r.color}`}>{r.value}</span>
                </div>
              ))}
              <div
                className={`rounded-xl p-3 text-center text-xs font-semibold
                ${
                  taxDelta < 0
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : taxDelta > 0
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {taxDelta < 0
                  ? `🎉 Save ${fmt(Math.abs(taxDelta))} in taxes!`
                  : taxDelta > 0
                    ? `⚠️ +${fmt(taxDelta)} tax liability`
                    : 'No tax change at current settings'}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 3: 3-Year Baseline Projection ────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
            <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              3-Year Baseline Projection
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure macro growth and inflation assumptions
            </p>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-end gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-500" /> Base Year
                  </Label>
                  <Select value={baseYear} onValueChange={setBaseYear}>
                    <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024 (Current)</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {[
                  {
                    label: 'Est. Growth Rate (%)',
                    icon: TrendingUp,
                    iconColor: 'text-emerald-500',
                    value: growthRateStr,
                    setter: setGrowthRateStr,
                  },
                  {
                    label: 'Est. Inflation (%)',
                    icon: TrendingDown,
                    iconColor: 'text-orange-500',
                    value: inflationRateStr,
                    setter: setInflationRateStr,
                  },
                ].map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${f.iconColor}`} /> {f.label}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          className="pl-3 pr-8 h-11 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                          value={f.value}
                          onChange={e => f.setter(e.target.value)}
                        />
                        <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button className="h-11 px-6 bg-slate-900 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white gap-2 w-full lg:w-auto shrink-0 transition-colors">
                <Plus className="h-4 w-4" /> Add Custom Scenario
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Scenario cards */}
          <div className="xl:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Active Scenarios
            </h3>
            {scenarioResults.map(s => {
              const Icon = s.icon;
              return (
                <Card
                  key={s.id}
                  className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative bg-white dark:bg-slate-900"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-${s.color}-500`} />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight text-sm">
                        {s.title}
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                          Proj. Revenue
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {fmt(s.projRev)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">
                          Proj. Expenses
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {fmt(s.projExp)}
                        </p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {fmt(s.projTax)}
                          </p>
                          <Badge
                            className={`font-bold text-xs gap-1 border-none ${s.isSavings ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}
                          >
                            {s.isSavings ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUp className="h-3 w-3" />
                            )}
                            {fmt(Math.abs(s.taxDiff))}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">
                          vs base projection
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="xl:col-span-2 space-y-6">
            {[
              {
                title: '3-Year Baseline Tax Forecast',
                desc: `Based on ${growthRateStr}% growth & ${inflationRateStr}% inflation`,
                isLine: true,
              },
              {
                title: 'Scenario Liability Comparison',
                desc: 'Tax impact of different business decisions',
                isLine: false,
              },
            ].map(chart => (
              <Card
                key={chart.title}
                className="border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl bg-white dark:bg-slate-900"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-800 dark:text-slate-100">
                    {chart.title}
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">{chart.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      {chart.isLine ? (
                        <LineChart
                          data={baseForecastData}
                          margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#334155"
                            opacity={0.2}
                          />
                          <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 13 }}
                            dy={10}
                          />
                          <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 13 }}
                            tickFormatter={fmtK}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 13 }}
                            tickFormatter={fmtK}
                          />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v: number) => [fmt(v), undefined]}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="expenses"
                            name="Expenses"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="tax"
                            name="Estimated Tax"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 6, fill: '#fff' }}
                          />
                        </LineChart>
                      ) : (
                        <BarChart
                          data={comparisonData}
                          margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#334155"
                            opacity={0.2}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 13 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 13 }}
                            tickFormatter={fmtK}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(100,116,139,0.1)' }}
                            contentStyle={tooltipStyle}
                            formatter={(v: number) => [fmt(v), undefined]}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <ReferenceLine
                            y={BASE_TAX}
                            stroke="#94a3b8"
                            strokeDasharray="3 3"
                            label={{
                              position: 'top',
                              value: 'Base Tax Level',
                              fill: '#94a3b8',
                              fontSize: 11,
                            }}
                          />
                          <Bar
                            dataKey="Base Tax"
                            fill="#cbd5e1"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                          />
                          <Bar dataKey="Scenario Tax" radius={[4, 4, 0, 0]} maxBarSize={50}>
                            {comparisonData.map((entry, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={entry.diff < 0 ? '#10b981' : '#ef4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
