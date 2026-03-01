'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Sheet,
  Printer,
  PieChart,
  Globe,
  Building2,
  CalendarDays,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ─── Dummy Data ────────────────────────────────────────────────────────────────
const COMPANY = {
  name: 'Acme Corp Ltd.',
  ein: '12-3456789',
  address: '500 Market Street, Suite 900, San Francisco, CA 94105',
  fiscal_year: 'January 1 – December 31, 2024',
  business_type: 'C-Corporation',
  jurisdiction: 'USA – California',
};

const FINANCIALS = {
  gross_revenue: 2_012_000,
  cost_of_goods: 520_000,
  gross_profit: 1_492_000,
  payroll: 869_200,
  rent: 120_000,
  utilities: 26_800,
  marketing: 148_000,
  equipment: 44_000,
  misc: 55_700,
  total_expenses: 1_263_700,
  rd_credits: 45_000,
  depreciation: 125_000,
  nol: 0,
  other_deductions: 15_000,
  total_deductions: 185_000,
  taxable_income: 228_300,
  tax_rate: 0.21,
  estimated_tax: 47_943,
  effective_rate: 2.38,
};

const REPORT_CARDS = [
  {
    id: 'annual',
    title: 'Annual Tax Summary',
    description: 'Full-year revenue, expense, and tax liability statement.',
    icon: FileText,
    color: 'blue',
    period: 'FY 2024',
    status: 'Ready',
  },
  {
    id: 'quarterly',
    title: 'Quarterly Filing Summary',
    description: 'Estimated quarterly tax payments and reconciliation.',
    icon: CalendarDays,
    color: 'purple',
    period: 'Q1–Q4 2024',
    status: 'Ready',
  },
  {
    id: 'deductions',
    title: 'Deduction Breakdown',
    description: 'Detailed list of all applied deductions and credits.',
    icon: PieChart,
    color: 'green',
    period: 'FY 2024',
    status: 'Ready',
  },
  {
    id: 'jurisdiction',
    title: 'Jurisdiction Tax Breakdown',
    description: 'Federal vs. state allocation of tax liabilities.',
    icon: Globe,
    color: 'amber',
    period: 'FY 2024',
    status: 'Ready',
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TaxReportsPage() {
  const [year, setYear] = useState('2024');

  const handlePrint = () => window.print();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Tax Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generate, preview, and export your official tax documents.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2 border-slate-300 dark:border-slate-700 h-10 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200 transition-colors"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-slate-300 dark:border-slate-700 h-10 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-300 transition-colors"
          >
            <Sheet className="h-4 w-4" /> Export Excel
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10 shadow-sm transition-colors">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Filter className="h-4 w-4 text-blue-500" /> Filter Reports
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tax Year
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Quarter
              </Label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  <SelectItem value="q1">Q1 (Jan–Mar)</SelectItem>
                  <SelectItem value="q2">Q2 (Apr–Jun)</SelectItem>
                  <SelectItem value="q3">Q3 (Jul–Sep)</SelectItem>
                  <SelectItem value="q4">Q4 (Oct–Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Jurisdiction
              </Label>
              <Select defaultValue="us_ca">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us_ca">USA – California</SelectItem>
                  <SelectItem value="us_ny">USA – New York</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Business Entity
              </Label>
              <Select defaultValue="acme">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme">Acme Corp Ltd.</SelectItem>
                  <SelectItem value="globex">Globex Industries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Report Card Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {REPORT_CARDS.map(r => {
          const Icon = r.icon;
          return (
            <Card
              key={r.id}
              className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2.5 rounded-xl bg-${r.color}-50 dark:bg-${r.color}-900/30 text-${r.color}-600 dark:text-${r.color}-400`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30"
                  >
                    {r.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                    {r.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {r.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{r.period}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Formatted Report Preview ─────────────────────────── */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Report Preview
        </h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg shadow-slate-900/5 overflow-hidden print:shadow-none print:border-none">
          {/* Document Header */}
          <div className="bg-slate-900 text-white px-10 py-8 print:bg-white print:text-slate-900">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{COMPANY.name}</h2>
                <p className="text-slate-400 text-sm mt-1 print:text-slate-600">
                  {COMPANY.address}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1 print:text-slate-500">
                  Tax Return
                </p>
                <p className="text-xl font-mono font-bold text-blue-400 print:text-blue-700">
                  FY {year}
                </p>
              </div>
            </div>
          </div>

          <div className="px-10 py-8 space-y-8">
            {/* Company Information */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-4">
                Company Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'EIN / Tax ID', value: COMPANY.ein },
                  { label: 'Business Type', value: COMPANY.business_type },
                  { label: 'Jurisdiction', value: COMPANY.jurisdiction },
                  { label: 'Fiscal Period', value: COMPANY.fiscal_year },
                  { label: 'Report Status', value: 'Draft' },
                  { label: 'Prepared By', value: 'PlasDash Tax Engine' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Separator className="text-slate-100" />

            {/* Revenue Summary */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-4">
                Revenue Summary
              </h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { label: 'Gross Revenue', value: FINANCIALS.gross_revenue },
                    {
                      label: 'Cost of Goods Sold (COGS)',
                      value: -FINANCIALS.cost_of_goods,
                      negative: true,
                    },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{row.label}</td>
                      <td
                        className={`py-2.5 text-right font-mono font-semibold ${row.negative ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}
                      >
                        {row.negative ? `(${fmt(Math.abs(row.value))})` : fmt(row.value)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-50 dark:bg-slate-800 rounded">
                    <td className="py-3 px-2 text-slate-900 dark:text-slate-100 rounded-l-lg">
                      Gross Profit
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-blue-700 dark:text-blue-400 rounded-r-lg">
                      {fmt(FINANCIALS.gross_profit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <Separator />

            {/* Deduction Summary */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-4">
                Deduction Summary
              </h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { label: 'Payroll & Salaries', value: FINANCIALS.payroll },
                    { label: 'Rent & Lease', value: FINANCIALS.rent },
                    { label: 'Utilities', value: FINANCIALS.utilities },
                    { label: 'Marketing & Advertising', value: FINANCIALS.marketing },
                    { label: 'Equipment & Technology', value: FINANCIALS.equipment },
                    { label: 'Miscellaneous', value: FINANCIALS.misc },
                    { label: 'R&D Credits', value: FINANCIALS.rd_credits },
                    { label: 'Asset Depreciation', value: FINANCIALS.depreciation },
                    { label: 'Other Standard Deductions', value: FINANCIALS.other_deductions },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{row.label}</td>
                      <td className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                        {fmt(row.value)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-50 dark:bg-slate-800">
                    <td className="py-3 px-2 text-slate-900 dark:text-slate-100 rounded-l-lg">
                      Total Deductions
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-green-700 dark:text-green-400 rounded-r-lg">
                      ({fmt(FINANCIALS.total_expenses + FINANCIALS.total_deductions)})
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <Separator className="text-slate-100" />

            {/* Tax Calculation */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-4">
                Tax Calculation
              </h3>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    {
                      label: 'Taxable Income',
                      value: fmt(FINANCIALS.taxable_income),
                      highlight: false,
                    },
                    {
                      label: 'Applied Tax Rate',
                      value: `${(FINANCIALS.tax_rate * 100).toFixed(1)}%`,
                      highlight: false,
                    },
                    {
                      label: 'Effective Rate',
                      value: `${FINANCIALS.effective_rate.toFixed(2)}%`,
                      highlight: false,
                    },
                    {
                      label: 'Estimated Tax Due',
                      value: fmt(FINANCIALS.estimated_tax),
                      highlight: true,
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className={`p-4 rounded-xl ${item.highlight ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5'}`}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                        {item.label}
                      </p>
                      <p
                        className={`text-xl font-bold font-mono ${item.highlight ? 'text-blue-300' : 'text-white'}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Separator />

            {/* Signature Section */}
            <section>
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-6">
                Authorization & Signature
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    role: 'Authorized Officer / Director',
                    name: 'Jane Doe',
                    title: 'Chief Financial Officer',
                  },
                  {
                    role: 'Tax Preparer / CPA',
                    name: 'John Smith, CPA',
                    title: 'External Tax Advisor',
                  },
                ].map(sig => (
                  <div key={sig.role} className="space-y-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {sig.role}
                    </p>
                    <div className="h-px w-full bg-slate-300 dark:bg-slate-700" />
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {sig.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{sig.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Date: ___________________
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300">
                <strong>Disclaimer:</strong> This report is generated from the PlasDash Tax Engine
                using internally provided financial data. It is intended for review purposes only
                and does not constitute a filed tax return. Please review with a qualified tax
                professional before submission.
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
