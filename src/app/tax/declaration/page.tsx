"use client";

import React, { useState, useMemo } from "react";
import {
    Building2,
    CalendarDays,
    MapPin,
    Briefcase,
    DollarSign,
    TrendingDown,
    Receipt,
    Calculator,
    Save,
    Send,
    RefreshCw,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const expenseCategories = ["Payroll", "Rent", "Utilities", "Marketing", "Equipment", "Miscellaneous"];

export default function TaxDeclarationPage() {
    // Dummy State for Interactive Feel (Default Values)
    const [revenueInputs, setRevenueInputs] = useState<Record<string, string>>({
        Jan: "120000", Feb: "132000", Mar: "145000", Apr: "125000",
        May: "155000", Jun: "165000", Jul: "175000", Aug: "160000",
        Sep: "180000", Oct: "195000", Nov: "210000", Dec: "250000"
    });

    const [expenseInputs, setExpenseInputs] = useState<Record<string, Record<string, string>>>({
        Payroll: { Jan: "50000", Feb: "52000", Mar: "55000", Apr: "50000", May: "58000", Jun: "60000", Jul: "62000", Aug: "60000", Sep: "65000", Oct: "70000", Nov: "75000", Dec: "80000" },
        Rent: { Jan: "10000", Feb: "10000", Mar: "10000", Apr: "10000", May: "10000", Jun: "10000", Jul: "10000", Aug: "10000", Sep: "10000", Oct: "10000", Nov: "10000", Dec: "10000" },
        Utilities: { Jan: "2000", Feb: "2100", Mar: "2000", Apr: "1900", May: "2200", Jun: "2500", Jul: "2800", Aug: "2700", Sep: "2300", Oct: "2100", Nov: "2000", Dec: "2200" },
        Marketing: { Jan: "8000", Feb: "8500", Mar: "9000", Apr: "8000", May: "9500", Jun: "10000", Jul: "12000", Aug: "11000", Sep: "15000", Oct: "14000", Nov: "18000", Dec: "25000" },
        Equipment: { Jan: "5000", Mar: "12000", Jun: "8000", Sep: "4000", Dec: "15000" },
        Miscellaneous: { Jan: "3000", Feb: "1400", Mar: "2000", Apr: "5100", May: "5300", Jun: "9500", Jul: "8200", Aug: "4300", Sep: "13200", Oct: "8900", Nov: "5000", Dec: "2800" },
    });

    const [deductions, setDeductions] = useState({
        rdCredits: true,
        depreciation: true,
        lossCarryforward: false,
        other: true
    });

    // Calculate Totals based on current inputs
    const totalRevenue = useMemo(() => {
        return Object.values(revenueInputs).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, [revenueInputs]);

    const totalExpenses = useMemo(() => {
        return Object.values(expenseInputs).reduce((totalSum, category) => {
            const categorySum = Object.values(category).reduce((sum, val) => sum + (Number(val) || 0), 0);
            return totalSum + categorySum;
        }, 0);
    }, [expenseInputs]);

    const totalDeductionsCalc = useMemo(() => {
        let sum = 0;
        if (deductions.rdCredits) sum += 45000;
        if (deductions.depreciation) sum += 125000;
        if (deductions.lossCarryforward) sum += 80000;
        if (deductions.other) sum += 15000;
        return sum;
    }, [deductions]);

    const taxableIncome = Math.max(0, totalRevenue - totalExpenses - totalDeductionsCalc);
    const estimatedTax = taxableIncome * 0.21; // Simple 21% flat rate for demo
    const effectiveRate = totalRevenue > 0 ? (estimatedTax / totalRevenue) * 100 : 0;

    const handleRevenueChange = (month: string, value: string) => {
        setRevenueInputs(prev => ({ ...prev, [month]: value }));
    };

    const handleExpenseChange = (category: string, month: string, value: string) => {
        setExpenseInputs(prev => ({
            ...prev,
            [category]: { ...prev[category], [month]: value }
        }));
    };

    const handleRecalculate = () => {
        // Just a UI interactive feel, values are already auto-calculated in state
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tax Declaration</h1>
                <p className="text-slate-500 mt-1">Review your financials and file your corporate tax returns.</p>
            </div>

            {/* Configuration Selectors */}
            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl bg-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-slate-600 flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" /> Business Entity</Label>
                            <Select defaultValue="acme">
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11">
                                    <SelectValue placeholder="Select Business" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="acme">Acme Corp Ltd.</SelectItem>
                                    <SelectItem value="globex">Globex Industries</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-500" /> Tax Year</Label>
                            <Select defaultValue="2024">
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024">FY 2023-24</SelectItem>
                                    <SelectItem value="2023">FY 2022-23</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" /> Jurisdiction</Label>
                            <Select defaultValue="us_ca">
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11">
                                    <SelectValue placeholder="Select Region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="us_ca">USA - California</SelectItem>
                                    <SelectItem value="us_ny">USA - New York</SelectItem>
                                    <SelectItem value="uk">United Kingdom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-500" /> Business Type</Label>
                            <Select defaultValue="corp">
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="corp">Corporation (C-Corp)</SelectItem>
                                    <SelectItem value="llc">LLC</SelectItem>
                                    <SelectItem value="sole">Sole Proprietorship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section 1: Financial Summary Cards */}
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-slate-100 shadow-sm rounded-xl bg-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-600" /> Total Revenue YTD
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-xl bg-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-red-600" /> Total Expenses YTD
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">${totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-xl bg-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-green-600" /> Taxable Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">${taxableIncome.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-xl bg-slate-900 text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-400" /> Estimated Tax Owed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">${estimatedTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Section 2: Input Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="revenue" className="w-full">
                        <TabsList className="w-full justify-start h-12 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                            <TabsTrigger value="revenue" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none px-6">Revenue</TabsTrigger>
                            <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none px-6">Expenses</TabsTrigger>
                            <TabsTrigger value="deductions" className="rounded-lg data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-none px-6">Deductions</TabsTrigger>
                        </TabsList>

                        <div className="mt-6 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <TabsContent value="revenue" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Monthly Revenue</h3>
                                        <p className="text-sm text-slate-500">Enter your gross receipts per month.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-500">Auto-calculated Total</p>
                                        <p className="text-xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="w-[120px]">Month</TableHead>
                                                <TableHead>Amount (USD)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {months.map((month) => (
                                                <TableRow key={month}>
                                                    <TableCell className="font-medium text-slate-700">{month}</TableCell>
                                                    <TableCell>
                                                        <div className="relative w-full max-w-sm">
                                                            <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                value={revenueInputs[month] || ""}
                                                                onChange={(e) => handleRevenueChange(month, e.target.value)}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="expenses" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Operating Expenses</h3>
                                        <p className="text-sm text-slate-500">Categorized monthly expense breakdown.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-500">Auto-calculated Total</p>
                                        <p className="text-xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <Table className="min-w-[800px]">
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#f1f5f9]">Category</TableHead>
                                                {months.map(m => <TableHead key={m} className="w-[120px]">{m}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {expenseCategories.map(category => (
                                                <TableRow key={category}>
                                                    <TableCell className="font-medium text-slate-700 sticky left-0 bg-white shadow-[1px_0_0_0_#f8fafc] z-10">{category}</TableCell>
                                                    {months.map(month => (
                                                        <TableCell key={`${category}-${month}`} className="p-2">
                                                            <Input
                                                                type="number"
                                                                className="h-9 px-2 text-sm"
                                                                value={expenseInputs[category]?.[month] || ""}
                                                                onChange={(e) => handleExpenseChange(category, month, e.target.value)}
                                                            />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="deductions" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-lg font-semibold text-slate-800">Available Deductions & Credits</h3>
                                    <p className="text-sm text-slate-500">Select applicable deductions to reduce taxable income.</p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="rd" checked={deductions.rdCredits} onCheckedChange={(c) => setDeductions(prev => ({ ...prev, rdCredits: !!c }))} className="mt-1" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="rd" className="text-base font-semibold text-slate-800">Research & Development (R&D) Credits</Label>
                                            <p className="text-sm text-slate-500">Eligible software development and research costs. Estimated value: <strong className="text-green-600">$45,000</strong></p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="dep" checked={deductions.depreciation} onCheckedChange={(c) => setDeductions(prev => ({ ...prev, depreciation: !!c }))} className="mt-1" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="dep" className="text-base font-semibold text-slate-800">Asset Depreciation</Label>
                                            <p className="text-sm text-slate-500">MACRS depreciation on acquired capital assets. Estimated value: <strong className="text-green-600">$125,000</strong></p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="loss" checked={deductions.lossCarryforward} onCheckedChange={(c) => setDeductions(prev => ({ ...prev, lossCarryforward: !!c }))} className="mt-1" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="loss" className="text-base font-semibold text-slate-800">Net Operating Loss (NOL) Carryforward</Label>
                                            <p className="text-sm text-slate-500">Losses from previous financial years. Estimated value: <strong className="text-green-600">$80,000</strong></p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="other" checked={deductions.other} onCheckedChange={(c) => setDeductions(prev => ({ ...prev, other: !!c }))} className="mt-1" />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="other" className="text-base font-semibold text-slate-800">Other Standard Deductions</Label>
                                            <p className="text-sm text-slate-500">Charitable contributions, standard state allowances. Estimated value: <strong className="text-green-600">$15,000</strong></p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Section 3: Result Card */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 border-none shadow-lg shadow-blue-900/5 rounded-2xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white pb-6 pt-8 px-6 text-center">
                            <div className="mx-auto bg-blue-500/20 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                                <Calculator className="h-6 w-6 text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl text-white">Calculation Result</CardTitle>
                            <CardDescription className="text-slate-400">Real-time tax liability estimation</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="px-6 py-4 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Gross Income:</span>
                                    <span className="font-semibold text-slate-900">${totalRevenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Total Expenses:</span>
                                    <span className="font-semibold text-red-600">-${totalExpenses.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Total Deductions:</span>
                                    <span className="font-semibold text-green-600">-${totalDeductionsCalc.toLocaleString()}</span>
                                </div>
                                <div className="my-4 border-t border-slate-100" />
                                <div className="flex justify-between items-center text-base">
                                    <span className="font-medium text-slate-700">Taxable Income:</span>
                                    <span className="font-bold text-slate-900">${taxableIncome.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Applied Tax Rate:</span>
                                    <span className="font-semibold text-blue-600">21.0%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100">
                                    <span className="text-slate-500">Effective Tax Rate:</span>
                                    <span className="font-semibold text-slate-700">{effectiveRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center bg-blue-50 -mx-6 px-6 py-4 mt-2">
                                    <span className="font-bold text-slate-800">Estimated Tax Due</span>
                                    <span className="text-2xl font-black text-blue-700">${estimatedTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-3 px-6 pb-8 pt-4">
                            <Button
                                variant="outline"
                                className="w-full gap-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold h-11"
                                onClick={handleRecalculate}
                            >
                                <RefreshCw className="h-4 w-4" /> Recalculate
                            </Button>
                            <Button
                                className="w-full gap-2 bg-slate-200 text-slate-400 hover:bg-slate-200 cursor-not-allowed h-11 font-semibold"
                                disabled
                            >
                                <Send className="h-4 w-4" /> Submit Declaration
                            </Button>
                            <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                                <Info className="h-4 w-4 text-slate-400 shrink-0" />
                                <p>Submission is disabled in preview mode. Please verify all data before attempting to file.</p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
