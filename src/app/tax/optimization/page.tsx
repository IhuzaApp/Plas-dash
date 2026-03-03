'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Lightbulb,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Percent,
  Calculator,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Base Dummy Data
const CURRENT_TAX_DUE = 168000;

const SUGGESTIONS = [
  {
    id: 'depreciation',
    title: 'Accelerate equipment depreciation',
    description:
      'Switch to MACRS accelerated depreciation for hardware acquired in Q3 to increase immediate deductible expenses.',
    savings: 12000,
    impactLevel: 'high',
    icon: Zap,
    color: 'blue',
  },
  {
    id: 'shift_expenses',
    title: 'Shift expenses to Q4',
    description:
      'Pre-pay January rent and software annual renewals in December to reduce current year taxable income.',
    savings: 8500,
    impactLevel: 'medium',
    icon: TrendingDown,
    color: 'amber',
  },
  {
    id: 'rd_credit',
    title: 'Claim R&D credit',
    description:
      'File Form 6765 for documented software development engineering hours spent on the new analytics engine.',
    savings: 15200,
    impactLevel: 'high',
    icon: Target,
    color: 'purple',
  },
];

export default function TaxOptimizationPage() {
  const [activeSimulations, setActiveSimulations] = useState<Record<string, boolean>>({});

  const toggleSimulation = (id: string) => {
    setActiveSimulations(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const missedDeductionsCount = SUGGESTIONS.length;
  const totalPotentialSavings = SUGGESTIONS.reduce((sum, s) => sum + s.savings, 0);

  const activeSavings = SUGGESTIONS.filter(s => activeSimulations[s.id]).reduce(
    (sum, s) => sum + s.savings,
    0
  );
  const optimizedTaxDue = CURRENT_TAX_DUE - activeSavings;

  // Calculate optimization score based on how many savings are 'activated' out of the total possible
  const maxPossibleScore = 100;
  const baseScore = 45; // Arbitrary starting state
  const additionalScore =
    totalPotentialSavings > 0
      ? (activeSavings / totalPotentialSavings) * (maxPossibleScore - baseScore)
      : 0;
  const currentScore = Math.round(baseScore + additionalScore);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const formatCompact = (val: number) => `$${(val / 1000).toFixed(0)}k`;

  const comparisonData = [
    {
      name: 'Current Tax',
      Amount: CURRENT_TAX_DUE,
      fill: '#ef4444', // Red
    },
    {
      name: 'Optimized Tax',
      Amount: optimizedTaxDue,
      fill: '#10b981', // Green
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Tax Optimization
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            AI-driven suggestions to maximize deductions and reduce your tax liability.
          </p>
        </div>
      </div>

      {/* Top Section: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 dark:from-amber-900/10 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Estimated Missed Deductions
                </p>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {missedDeductionsCount}
                </div>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              Review suggestions below to capture these opportunities before year-end.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 dark:from-green-900/10 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-500" /> Potential Tax Savings
                </p>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(totalPotentialSavings)}
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                <Calculator className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              Total identified savings across all active intelligence modules.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 dark:from-blue-900/10 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-blue-500" /> Optimization Score
                </p>
                <div className="flex items-end gap-3 mb-2">
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {currentScore}%
                  </div>
                  <span
                    className={`text-sm font-medium mb-1 ${currentScore > 80 ? 'text-green-600 dark:text-green-400' : currentScore > 50 ? 'text-amber-500' : 'text-red-500'}`}
                  >
                    {currentScore > 80
                      ? 'Excellent'
                      : currentScore > 50
                        ? 'Needs Review'
                        : 'Action Required'}
                  </span>
                </div>
                <Progress
                  value={currentScore}
                  className="h-2 w-full bg-slate-100 dark:bg-slate-800"
                  indicatorClassName={
                    currentScore > 80
                      ? 'bg-green-500'
                      : currentScore > 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Suggestions */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <Lightbulb className="h-5 w-5 text-amber-500" /> Actionable Strategies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUGGESTIONS.map(suggestion => {
              const Icon = suggestion.icon;
              const isActive = activeSimulations[suggestion.id];
              return (
                <Card
                  key={suggestion.id}
                  className={`border transition-all duration-200 overflow-hidden relative
                                        ${
                                          isActive
                                            ? 'border-blue-300 dark:border-blue-600 shadow-md ring-1 ring-blue-50 dark:ring-blue-900 bg-blue-50/20 dark:bg-blue-900/10'
                                            : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md bg-white dark:bg-slate-900'
                                        }`}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`p-3 rounded-2xl shrink-0 ${isActive ? `bg-${suggestion.color}-500 text-white` : `bg-${suggestion.color}-50 dark:bg-${suggestion.color}-900/30 text-${suggestion.color}-600 dark:text-${suggestion.color}-400`}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1">
                          {suggestion.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold tracking-wider
                                                    ${
                                                      suggestion.impactLevel === 'high'
                                                        ? 'border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                                                        : 'border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                                                    }`}
                        >
                          {suggestion.impactLevel} impact
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1 mb-6">
                      {suggestion.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                          Est. Savings
                        </p>
                        <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                          {formatCurrency(suggestion.savings)}
                        </p>
                      </div>
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        className={`gap-2 h-10 transition-colors ${isActive ? 'bg-blue-600 hover:bg-blue-700 shadow-sm text-white' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200'}`}
                        onClick={() => toggleSimulation(suggestion.id)}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Applied
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" /> Simulate
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-1 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Simulation Impact
          </h3>
          <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg sticky top-24">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base text-slate-800 dark:text-slate-100">
                Tax Liability Comparison
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Current projection vs. applied strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Optimized Tax
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {formatCurrency(optimizedTaxDue)}
                  </p>
                </div>
                {activeSavings > 0 && (
                  <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 font-bold px-3 py-1 text-sm border-none mb-1">
                    -{formatCurrency(activeSavings)}
                  </Badge>
                )}
              </div>
              <div className="h-[220px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={formatCompact}
                      domain={[0, Math.ceil(CURRENT_TAX_DUE * 1.1)]}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      formatter={(value: number) => [formatCurrency(value), 'Estimated Tax']}
                    />
                    <Bar dataKey="Amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-4">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Current Tax Due:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(CURRENT_TAX_DUE)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Simulated Savings:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatCurrency(activeSavings)}
                  </span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
