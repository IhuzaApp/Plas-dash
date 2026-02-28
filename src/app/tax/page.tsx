"use client";

import React, { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from "recharts";
import {
    Download,
    Filter,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    DollarSign,
    PieChart,
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownRight,
    Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// Dummy Data
const forecastData = [
    { month: "Jan", revenue: 120000, expenses: 80000, projectedTax: 8000 },
    { month: "Feb", revenue: 132000, expenses: 84000, projectedTax: 9600 },
    { month: "Mar", revenue: 145000, expenses: 90000, projectedTax: 11000 },
    { month: "Apr", revenue: 125000, expenses: 85000, projectedTax: 8000 },
    { month: "May", revenue: 155000, expenses: 95000, projectedTax: 12000 },
    { month: "Jun", revenue: 165000, expenses: 100000, projectedTax: 13000 },
    { month: "Jul", revenue: 175000, expenses: 105000, projectedTax: 14000 },
    { month: "Aug", revenue: 160000, expenses: 98000, projectedTax: 12400 },
    { month: "Sep", revenue: 180000, expenses: 110000, projectedTax: 14000 },
    { month: "Oct", revenue: 195000, expenses: 115000, projectedTax: 16000 },
    { month: "Nov", revenue: 210000, expenses: 120000, projectedTax: 18000 },
    { month: "Dec", revenue: 250000, expenses: 135000, projectedTax: 23000 },
];

const taxCategories = [
    { name: "Corporate Income Tax", amount: 125000, status: "Due soon", date: "Oct 15, 2024" },
    { name: "Payroll Taxes", amount: 45000, status: "Paid", date: "Sep 30, 2024" },
    { name: "Sales Tax / VAT", amount: 82000, status: "Pending", date: "Oct 20, 2024" },
    { name: "Property Tax", amount: 15000, status: "Paid", date: "Jun 01, 2024" },
];

export default function TaxDashboardPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Tax Dashboard & Forecasting</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor your tax liabilities and forecast future payments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 transition-colors">
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export Report</span>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Tax Owed</CardTitle>
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" /></div>
                    </CardHeader>
                    <CardContent className="z-10">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">$159,000</div>
                        <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400 font-medium"><ArrowUpRight className="h-4 w-4 mr-1" /><span>+12.5% vs last year</span></div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Potential Savings</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
                    </CardHeader>
                    <CardContent className="z-10">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">$24,500</div>
                        <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400 font-medium"><ArrowDownRight className="h-4 w-4 mr-1" /><span>Through R&D credits</span></div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Effective Tax Rate</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                    </CardHeader>
                    <CardContent className="z-10">
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">21.8%</div>
                        <div className="flex items-center mt-2 text-sm text-slate-500 dark:text-slate-400">Target rate: 21.0%</div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming Deadline</CardTitle>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg"><AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" /></div>
                    </CardHeader>
                    <CardContent className="z-10">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">Oct 15, 2024</div>
                        <div className="flex items-center mt-2 text-sm text-orange-600 dark:text-orange-400 font-medium">12 days remaining</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Charts Section */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Tax Liability Forecast</CardTitle>
                                <CardDescription className="dark:text-slate-400">Projected monthly tax based on revenue & expenses</CardDescription>
                            </div>
                            <Select defaultValue="2024">
                                <SelectTrigger className="w-[120px] rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2023">2023</SelectItem>
                                    <SelectItem value="2022">2022</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13 }} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <Tooltip cursor={{ fill: "rgba(51,65,85,0.08)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                                        <Bar dataKey="projectedTax" name="Projected Tax" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Revenue to Tax Over Time</CardTitle>
                                <CardDescription className="dark:text-slate-400">Historical trend comparison</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13 }} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="projectedTax" name="Tax" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Widgets Section */}
                <div className="space-y-8">
                    <Card className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-800/50">
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Liability Breakdown</CardTitle>
                            <CardDescription className="dark:text-slate-400">Current unfiled obligations</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 px-0">
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {taxCategories.map((category, idx) => (
                                    <li key={idx} className="p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{category.name}</span>
                                                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                                    {category.date}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-bold text-slate-900 dark:text-slate-100">${category.amount.toLocaleString()}</span>
                                                <Badge variant="secondary" className={cn(
                                                    "text-[10px] px-1.5 py-0 h-5 font-semibold",
                                                    category.status === 'Paid' ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200" :
                                                        category.status === 'Due soon' ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200" :
                                                            "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 hover:bg-orange-200"
                                                )}>{category.status}</Badge>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <Button className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-sm">View All Liabilities</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white relative border-none shadow-sm">
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-200" /> Optimization Tip
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-blue-100 text-sm leading-relaxed mb-4">
                                You have <strong className="text-white">$45,000</strong> in eligible R&D expenses that haven't been claimed for the current quarter. Claiming these could reduce your estimated tax by <strong className="text-white">~18%</strong>.
                            </p>
                            <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 border-none font-semibold rounded-xl">Review Deductions</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Temporary cn utility for the badge colors inline
function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}
