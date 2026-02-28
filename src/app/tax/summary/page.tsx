"use client";

import React, { useState } from "react";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
    DollarSign, TrendingDown, Calculator, Receipt,
    Download, RefreshCw, SlidersHorizontal, Sparkles, Info, Building2, MapPin, Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { AIInsightsPanel } from "@/components/tax/AIInsightsPanel";

const TOTAL_REVENUE = 132500;
const TOTAL_EXPENSES = 113770;
const TAXABLE_INCOME = TOTAL_REVENUE - TOTAL_EXPENSES;
const FEDERAL_TAX = TAXABLE_INCOME * 0.21;
const STATE_TAX = TAXABLE_INCOME * 0.0884;
const LOCAL_TAX = TAXABLE_INCOME * 0.015;
const TOTAL_TAX = FEDERAL_TAX + STATE_TAX + LOCAL_TAX;
const EFFECTIVE_RATE = (TOTAL_TAX / TOTAL_REVENUE) * 100;

const MONTHLY_DATA = [
    { month: "Jan", Revenue: 92000, Tax: 4410 },
    { month: "Feb", Revenue: 87000, Tax: 3780 },
    { month: "Mar", Revenue: 105000, Tax: 6510 },
    { month: "Apr", Revenue: 98000, Tax: 5040 },
    { month: "May", Revenue: 115000, Tax: 8610 },
    { month: "Jun", Revenue: 121000, Tax: 9240 },
    { month: "Jul", Revenue: 132000, Tax: 11130 },
    { month: "Aug", Revenue: 118000, Tax: 8820 },
    { month: "Sep", Revenue: 145000, Tax: 12600 },
    { month: "Oct", Revenue: 139000, Tax: 11970 },
    { month: "Nov", Revenue: 152000, Tax: 13440 },
    { month: "Dec", Revenue: 176000, Tax: 16800 },
];

const QUARTERLY_TAX = [
    { quarter: "Q1", Estimated: 14700 },
    { quarter: "Q2", Estimated: 22890 },
    { quarter: "Q3", Estimated: 33600 },
    { quarter: "Q4", Estimated: 42210 },
];

const EXPENSE_BREAKDOWN = [
    { name: "Payroll", value: 68000, color: "#3b82f6" },
    { name: "Rent", value: 10000, color: "#8b5cf6" },
    { name: "Marketing", value: 12500, color: "#f59e0b" },
    { name: "IT Expenses", value: 8420, color: "#06b6d4" },
    { name: "Equipment", value: 9750, color: "#10b981" },
    { name: "Other", value: 5100, color: "#94a3b8" },
];

const TAX_BREAKDOWN = [
    { id: "federal", label: "Federal Tax", icon: Landmark, amount: FEDERAL_TAX, rate: "21.0%", iconBg: "bg-blue-50 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400", tooltip: "Federal corporate income tax at 21% (Tax Cuts and Jobs Act, 2017). Applied to taxable income after all deductions." },
    { id: "state", label: "State Tax (CA)", icon: Building2, amount: STATE_TAX, rate: "8.84%", iconBg: "bg-purple-50 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400", tooltip: "California state corporate income tax at 8.84% — one of the highest in the US. Applied to California-apportioned income." },
    { id: "local", label: "Local / City Tax", icon: MapPin, amount: LOCAL_TAX, rate: "1.5%", iconBg: "bg-amber-50 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400", tooltip: "San Francisco local business tax at ~1.5% of gross receipts. Rate varies by business category." },
];

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtCompact = (n: number) => `$${(n / 1000).toFixed(0)}k`;

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const R = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    return (
        <text x={cx + radius * Math.cos(-midAngle * R)} y={cy + radius * Math.sin(-midAngle * R)}
            fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const tooltipStyle = { borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgb(0 0 0/0.1)" };

export default function AutoTaxSummaryPage() {
    const [isRecalculating, setIsRecalculating] = useState(false);

    return (
        <TooltipProvider>
            <AIInsightsPanel />
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Auto Tax Summary</h1>
                            <Badge className="gap-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border-none font-semibold px-3 py-1">
                                <Sparkles className="h-3.5 w-3.5" /> Calculated from Imported Data
                            </Badge>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">Tax liability automatically computed from your last import.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-700 h-10 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200 transition-colors" asChild>
                            <Link href="/tax/import"><SlidersHorizontal className="h-4 w-4" /> View Adjustments</Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 border-slate-300 dark:border-slate-700 h-10 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200 transition-colors"
                            onClick={() => { setIsRecalculating(true); setTimeout(() => setIsRecalculating(false), 1800); }}
                            disabled={isRecalculating}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
                            {isRecalculating ? "Recalculating…" : "Recalculate"}
                        </Button>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10 shadow-sm transition-colors">
                            <Download className="h-4 w-4" /> Download Summary
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {[
                        { label: "Total Revenue", value: fmt(TOTAL_REVENUE), icon: DollarSign, darkCard: false, iconBg: "bg-blue-100 dark:bg-blue-900/40", iconColor: "text-blue-600 dark:text-blue-400" },
                        { label: "Total Deductible Expenses", value: fmt(TOTAL_EXPENSES), icon: Receipt, darkCard: false, iconBg: "bg-red-100 dark:bg-red-900/40", iconColor: "text-red-600 dark:text-red-400" },
                        { label: "Taxable Income", value: fmt(TAXABLE_INCOME), icon: TrendingDown, darkCard: false, iconBg: "bg-green-100 dark:bg-green-900/40", iconColor: "text-green-600 dark:text-green-400" },
                        { label: "Estimated Tax Due", value: fmt(TOTAL_TAX), icon: Calculator, darkCard: true, iconBg: "bg-white/10", iconColor: "text-blue-300" },
                    ].map(kpi => {
                        const Icon = kpi.icon;
                        return (
                            <Card key={kpi.label} className={`relative overflow-hidden rounded-2xl border-none shadow-sm
                ${kpi.darkCard ? "bg-slate-900 dark:bg-slate-800" : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"}`}>
                                <CardContent className="p-5 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className={`text-sm font-medium ${kpi.darkCard ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>{kpi.label}</p>
                                        <div className={`p-2 rounded-xl ${kpi.iconBg}`}>
                                            <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                                        </div>
                                    </div>
                                    <p className={`text-2xl font-black tracking-tight ${kpi.darkCard ? "text-white" : "text-slate-900 dark:text-slate-50"}`}>{kpi.value}</p>
                                    {kpi.darkCard && <p className="text-xs text-slate-400 mt-2">Effective rate: {EFFECTIVE_RATE.toFixed(1)}%</p>}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-100">Monthly Revenue vs Tax Liability</CardTitle>
                            <CardDescription className="dark:text-slate-400">Full-year trend from imported data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[260px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={fmtCompact} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), undefined]} />
                                        <Legend wrapperStyle={{ paddingTop: "16px" }} />
                                        <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                                        <Line type="monotone" dataKey="Tax" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-100">Expense Category Breakdown</CardTitle>
                            <CardDescription className="dark:text-slate-400">Share of total deductible expenses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={EXPENSE_BREAKDOWN} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={renderPieLabel}>
                                            {EXPENSE_BREAKDOWN.map(e => <Cell key={e.name} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} formatter={(v: number) => [fmt(v), undefined]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                                {EXPENSE_BREAKDOWN.map(e => (
                                    <div key={e.name} className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{e.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 + Tax Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-100">Quarterly Estimated Tax</CardTitle>
                            <CardDescription className="dark:text-slate-400">Cumulative tax by quarter</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[220px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={QUARTERLY_TAX} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={fmtCompact} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Estimated"]} />
                                        <Bar dataKey="Estimated" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tax Breakdown */}
                    <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <CardTitle className="text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Tax Jurisdiction Breakdown
                            </CardTitle>
                            <CardDescription className="dark:text-slate-400">Federal + State + Local liability totals</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {TAX_BREAKDOWN.map(tax => {
                                    const Icon = tax.icon;
                                    return (
                                        <div key={tax.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${tax.iconBg}`}>
                                                    <Icon className={`h-4 w-4 ${tax.iconColor}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{tax.label}</p>
                                                        <UITooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3.5 w-3.5 text-slate-400 cursor-help hover:text-slate-600 dark:hover:text-slate-200 transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="max-w-[260px] text-xs leading-relaxed">{tax.tooltip}</TooltipContent>
                                                        </UITooltip>
                                                    </div>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Rate: <span className="font-semibold">{tax.rate}</span></p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">{fmt(tax.amount)}</p>
                                        </div>
                                    );
                                })}
                                {/* Total row */}
                                <div className="flex items-center justify-between px-6 py-5 bg-slate-900 dark:bg-slate-950">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-white/10">
                                            <Calculator className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">Total Liability</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Effective rate: <span className="font-semibold text-slate-300">{EFFECTIVE_RATE.toFixed(2)}%</span></p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black font-mono text-blue-300">{fmt(TOTAL_TAX)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    );
}
