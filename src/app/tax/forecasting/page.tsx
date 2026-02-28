"use client";

import React, { useState } from "react";
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
    Cell
} from "recharts";
import {
    TrendingUp,
    Users,
    TrendingDown,
    Plus,
    ArrowRight,
    TrendingUp as ArrowTrendingUp,
    TrendingDown as ArrowTrendingDown,
    Calculator,
    Percent,
    CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Base Data
const BASE_REVENUE = 2000000;
const BASE_EXPENSES = 1200000;
const BASE_TAX_RATE = 0.21;
const TAXABLE_INCOME = BASE_REVENUE - BASE_EXPENSES;
const BASE_TAX_DUE = TAXABLE_INCOME * BASE_TAX_RATE;

// Three Year Base Forecast (2024, 2025, 2026)
const getBaseForecast = (growth: number, inflation: number) => {
    return [
        { year: "2024 (Base)", revenue: BASE_REVENUE, expenses: BASE_EXPENSES, tax: BASE_TAX_DUE },
        {
            year: "2025 (Proj)",
            revenue: BASE_REVENUE * (1 + growth),
            expenses: BASE_EXPENSES * (1 + inflation),
            tax: (BASE_REVENUE * (1 + growth) - BASE_EXPENSES * (1 + inflation)) * BASE_TAX_RATE
        },
        {
            year: "2026 (Proj)",
            revenue: BASE_REVENUE * Math.pow(1 + growth, 2),
            expenses: BASE_EXPENSES * Math.pow(1 + inflation, 2),
            tax: (BASE_REVENUE * Math.pow(1 + growth, 2) - BASE_EXPENSES * Math.pow(1 + inflation, 2)) * BASE_TAX_RATE
        }
    ];
};

export default function TaxForecastingPage() {
    const [baseYear, setBaseYear] = useState("2024");
    const [growthRateStr, setGrowthRateStr] = useState("5.0");
    const [inflationRateStr, setInflationRateStr] = useState("3.0");

    const growthRate = (parseFloat(growthRateStr) || 0) / 100;
    const inflationRate = (parseFloat(inflationRateStr) || 0) / 100;

    const baseForecastData = getBaseForecast(growthRate, inflationRate);

    // Define Scenarios
    const scenarios = [
        {
            id: 1,
            title: "What if revenue grows 20%?",
            icon: TrendingUp,
            color: "blue",
            changes: { revenueMult: 1.20, expenseMult: 1.0 },
        },
        {
            id: 2,
            title: "What if we hire 2 employees?",
            icon: Users,
            color: "purple",
            changes: { revenueMult: 1.05, expenseMult: 1.15 }, // Marginal revenue bump, significant expense bump
        },
        {
            id: 3,
            title: "What if expenses increase 10%?",
            icon: TrendingDown,
            color: "orange",
            changes: { revenueMult: 1.0, expenseMult: 1.10 },
        }
    ];

    // Calculate Scenario Results relative to Base Year
    const scenarioResults = scenarios.map(s => {
        const projRev = BASE_REVENUE * s.changes.revenueMult;
        const projExp = BASE_EXPENSES * s.changes.expenseMult;
        const projTaxable = projRev - projExp;
        const projTax = projTaxable * BASE_TAX_RATE;
        const taxDiff = projTax - BASE_TAX_DUE;

        return {
            ...s,
            projRev,
            projExp,
            projTaxable,
            projTax,
            taxDiff,
            isSavings: taxDiff < 0
        };
    });

    // Prepare data for Scenario Comparison Bar Chart
    const comparisonData = scenarioResults.map(s => ({
        name: s.id === 1 ? "High Growth" : s.id === 2 ? "Hiring" : "High Costs",
        "Base Tax": BASE_TAX_DUE,
        "Scenario Tax": s.projTax,
        diff: s.taxDiff
    }));

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const formatCompact = (val: number) => `$${(val / 1000).toFixed(0)}k`;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Forecasting & Scenarios</h1>
                    <p className="text-slate-500 mt-1">Model future tax liabilities based on business decisions and macro factors.</p>
                </div>
            </div>

            {/* Top Section / Macro Controls */}
            <Card className="border-none shadow-sm shadow-blue-900/5 rounded-2xl bg-white overflow-visible bg-gradient-to-r from-white to-slate-50 border border-slate-100">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row items-end gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-blue-500" /> Base Year
                                </Label>
                                <Select value={baseYear} onValueChange={setBaseYear}>
                                    <SelectTrigger className="w-full bg-white border-slate-200 h-11">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024 (Current)</SelectItem>
                                        <SelectItem value="2023">2023</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Est. Growth Rate (%)
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="pl-3 pr-8 h-11 bg-white"
                                        value={growthRateStr}
                                        onChange={(e) => setGrowthRateStr(e.target.value)}
                                    />
                                    <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-orange-500" /> Est. Inflation (%)
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="pl-3 pr-8 h-11 bg-white"
                                        value={inflationRateStr}
                                        onChange={(e) => setInflationRateStr(e.target.value)}
                                    />
                                    <Percent className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <Button className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white gap-2 w-full lg:w-auto shrink-0 shadow-sm">
                            <Plus className="h-4 w-4" /> Add Custom Scenario
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: Scenarios List */}
                <div className="xl:col-span-1 space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        Active Scenarios
                    </h3>

                    <div className="space-y-4">
                        {scenarioResults.map((scenario) => {
                            const Icon = scenario.icon;
                            return (
                                <Card key={scenario.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative group">
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-${scenario.color}-500`} />
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-${scenario.color}-100 text-${scenario.color}-600`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <h4 className="font-semibold text-slate-900 leading-tight pr-4">{scenario.title}</h4>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-slate-500 text-xs mb-1">Proj. Revenue</p>
                                                <p className="font-semibold text-slate-900">{formatCurrency(scenario.projRev)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-xs mb-1">Proj. Expenses</p>
                                                <p className="font-semibold text-slate-900">{formatCurrency(scenario.projExp)}</p>
                                            </div>
                                            <div className="col-span-2 pt-2 border-t border-slate-200">
                                                <p className="text-slate-500 text-xs mb-1">Estimated Tax</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-slate-900 text-base">{formatCurrency(scenario.projTax)}</p>

                                                    <Badge
                                                        variant="secondary"
                                                        className={`px-2 py-1 flex items-center gap-1 font-bold ${scenario.isSavings
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                            }`}
                                                    >
                                                        {scenario.isSavings ? (
                                                            <ArrowTrendingDown className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <ArrowTrendingUp className="h-3.5 w-3.5" />
                                                        )}
                                                        {formatCurrency(Math.abs(scenario.taxDiff))}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 text-right">vs base projection</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Charts */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-blue-600" />
                        Projections & Comparisons
                    </h3>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-800">3-Year Baseline Tax Forecast</CardTitle>
                            <CardDescription>Based on {growthRateStr}% growth & {inflationRateStr}% inflation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={baseForecastData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="year"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 13 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 13 }}
                                            tickFormatter={formatCompact}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 13 }}
                                            tickFormatter={formatCompact}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                                            formatter={(value: number) => [formatCurrency(value), undefined]}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line yAxisId="left" type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line yAxisId="right" type="monotone" dataKey="tax" name="Estimated Tax" stroke="#ef4444" strokeWidth={3} dot={{ r: 6, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-800">Scenario Liability Comparison</CardTitle>
                            <CardDescription>Tax impact of different business decisions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 13 }}
                                            tickFormatter={formatCompact}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "#f1f5f9" }}
                                            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                                            formatter={(value: number) => [formatCurrency(value), undefined]}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                        <ReferenceLine y={BASE_TAX_DUE} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Base Tax Level', fill: '#64748b', fontSize: 12 }} />

                                        <Bar dataKey="Base Tax" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="Scenario Tax" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                            {
                                                comparisonData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.diff < 0 ? "#10b981" : "#ef4444"} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
