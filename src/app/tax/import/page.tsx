'use client';

import React, { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileBadge,
  CheckCircle2,
  Loader2,
  Sparkles,
  Link2,
  X,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'upload' | 'processing' | 'results';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'Revenue' | 'Expense';
  taxImpact: number;
}

interface ProcessingStep {
  id: string;
  label: string;
  durationMs: number;
  status: 'pending' | 'active' | 'done';
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TAX_CATEGORIES = [
  'Revenue',
  'Payroll',
  'Rent',
  'Utilities',
  'Marketing',
  'Equipment',
  'IT Expenses',
  'Travel',
  'Miscellaneous',
  'Uncategorized',
];

const SAMPLE_FILES = [
  {
    name: 'Q4 Sales Report.csv',
    icon: FileSpreadsheet,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  { name: 'Annual Expenses.xlsx', icon: FileSpreadsheet, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Payroll Summary.pdf', icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
  { name: 'Bank Statement.pdf', icon: FileBadge, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const ACCOUNTING_APPS = [
  {
    name: 'QuickBooks',
    color: 'text-green-700',
    border: 'border-green-200 hover:border-green-400',
    bg: 'hover:bg-green-50',
    logo: 'QB',
  },
  {
    name: 'Xero',
    color: 'text-blue-700',
    border: 'border-blue-200 hover:border-blue-400',
    bg: 'hover:bg-blue-50',
    logo: 'X',
  },
  {
    name: 'Wave',
    color: 'text-teal-700',
    border: 'border-teal-200 hover:border-teal-400',
    bg: 'hover:bg-teal-50',
    logo: 'W',
  },
];

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'analyze', label: 'Analyzing transactions…', durationMs: 1200, status: 'pending' },
  { id: 'categorize', label: 'Categorizing expenses…', durationMs: 1600, status: 'pending' },
  { id: 'rules', label: 'Applying tax rules…', durationMs: 1000, status: 'pending' },
  { id: 'predict', label: 'Generating predictions…', durationMs: 900, status: 'pending' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'T001',
    date: '2024-10-03',
    description: 'SaaS Revenue — Enterprise',
    category: 'Revenue',
    amount: 52000,
    type: 'Revenue',
    taxImpact: 10920,
  },
  {
    id: 'T002',
    date: '2024-10-08',
    description: 'AWS Cloud Infrastructure',
    category: 'IT Expenses',
    amount: 8420,
    type: 'Expense',
    taxImpact: -1768,
  },
  {
    id: 'T003',
    date: '2024-10-15',
    description: 'Payroll — October',
    category: 'Payroll',
    amount: 68000,
    type: 'Expense',
    taxImpact: -14280,
  },
  {
    id: 'T004',
    date: '2024-10-22',
    description: 'Google Ads Campaign Q4',
    category: 'Marketing',
    amount: 12500,
    type: 'Expense',
    taxImpact: -2625,
  },
  {
    id: 'T005',
    date: '2024-10-28',
    description: 'Equipment — MacBook Pro ×3',
    category: 'Equipment',
    amount: 9750,
    type: 'Expense',
    taxImpact: -2048,
  },
  {
    id: 'T006',
    date: '2024-11-01',
    description: 'Consulting Revenue — FinTech',
    category: 'Revenue',
    amount: 34000,
    type: 'Revenue',
    taxImpact: 7140,
  },
  {
    id: 'T007',
    date: '2024-11-05',
    description: 'Office Lease — Monthly',
    category: 'Rent',
    amount: 10000,
    type: 'Expense',
    taxImpact: -2100,
  },
  {
    id: 'T008',
    date: '2024-11-14',
    description: 'Team Conference & Travel',
    category: 'Travel',
    amount: 3200,
    type: 'Expense',
    taxImpact: -672,
  },
  {
    id: 'T009',
    date: '2024-11-20',
    description: 'Product License Revenue',
    category: 'Revenue',
    amount: 18500,
    type: 'Revenue',
    taxImpact: 3885,
  },
  {
    id: 'T010',
    date: '2024-11-27',
    description: 'Electric & Internet Bills',
    category: 'Utilities',
    amount: 2100,
    type: 'Expense',
    taxImpact: -441,
  },
  {
    id: 'T011',
    date: '2024-12-02',
    description: 'Wire Transfer — Unknown Vendor',
    category: 'Uncategorized',
    amount: 5600,
    type: 'Expense',
    taxImpact: 0,
  },
  {
    id: 'T012',
    date: '2024-12-10',
    description: 'Annual Software Subscription',
    category: 'IT Expenses',
    amount: 1800,
    type: 'Expense',
    taxImpact: -378,
  },
  {
    id: 'T013',
    date: '2024-12-16',
    description: 'Inbound Wire — EU Client',
    category: 'Revenue',
    amount: 28000,
    type: 'Revenue',
    taxImpact: 5880,
  },
  {
    id: 'T014',
    date: '2024-12-20',
    description: 'Office Supplies & Furniture',
    category: 'Miscellaneous',
    amount: 4100,
    type: 'Expense',
    taxImpact: -861,
  },
];

const fmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImportFinancialDataPage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [stepProgress, setStepProgress] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalRevenue = transactions
    .filter(t => t.type === 'Revenue')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((s, t) => s + t.amount, 0);
  const uncategorised = transactions.filter(t => t.category === 'Uncategorized').length;

  const overallProgress = (() => {
    const done = steps.filter(s => s.status === 'done').length;
    const activeIdx = steps.findIndex(s => s.status === 'active');
    if (activeIdx === -1) return done === steps.length ? 100 : 0;
    return Math.round(((done + stepProgress / 100) / steps.length) * 100);
  })();

  // ── AI Pipeline simulation ──────────────────────────────────────────────────
  const runPipeline = useCallback(async (name: string) => {
    setFileName(name);
    setPhase('processing');
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));

    for (let i = 0; i < INITIAL_STEPS.length; i++) {
      setSteps(prev => prev.map((s, idx) => ({ ...s, status: idx === i ? 'active' : s.status })));
      setStepProgress(0);
      const ticks = 20;
      const interval = INITIAL_STEPS[i].durationMs / ticks;
      for (let t = 1; t <= ticks; t++) {
        await new Promise(r => setTimeout(r, interval));
        setStepProgress(Math.round((t / ticks) * 100));
      }
      setSteps(prev => prev.map((s, idx) => ({ ...s, status: idx === i ? 'done' : s.status })));
      setStepProgress(100);
      await new Promise(r => setTimeout(r, 180));
    }
    await new Promise(r => setTimeout(r, 350));
    router.push('/tax/summary');
  }, []);

  const handleFile = (name: string) => runPipeline(name);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file.name);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file.name);
  };

  const reset = () => {
    setPhase('upload');
    setFileName(null);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));
    setStepProgress(0);
    setTransactions(INITIAL_TRANSACTIONS);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateCategory = (id: string, category: string) => {
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, category } : t)));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Import Financial Data
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            Upload your financial reports and let the system calculate and predict your tax
            automatically.
          </p>
        </div>
        {phase !== 'upload' && (
          <Button
            variant="outline"
            className="gap-2 border-slate-300 dark:border-slate-700 h-10 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={reset}
          >
            <RefreshCw className="h-4 w-4" /> Start over
          </Button>
        )}
      </div>

      {/* ══════════════════════ PHASE: UPLOAD ════════════════════════════════ */}
      {phase === 'upload' && (
        <div className="space-y-8">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-5 py-20 px-8 transition-all duration-200 group
              ${isDragging ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-900/20 scale-[1.01]' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'}`}
          >
            <div
              className={`p-6 rounded-3xl transition-all duration-200 shadow-sm
              ${isDragging ? 'bg-blue-100 dark:bg-blue-900/40 shadow-blue-200' : 'bg-white dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}`}
            >
              <UploadCloud
                className={`h-12 w-12 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-400'}`}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Drop your file here
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                or click anywhere to browse your files
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {['CSV', 'Excel (.xlsx)', 'PDF (simulation)'].map(f => (
                <span
                  key={f}
                  className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm"
                >
                  {f}
                </span>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.pdf"
              onChange={onInputChange}
            />
          </div>

          {/* Two columns: Sample files + Connect software */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sample Files */}
            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <FileBadge className="h-4 w-4 text-blue-500" /> Try a sample file
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {SAMPLE_FILES.map(sf => {
                  const Icon = sf.icon;
                  return (
                    <button
                      key={sf.name}
                      onClick={() => handleFile(sf.name)}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-md transition-all text-left group"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${sf.bg}`}>
                        <Icon className={`h-4 w-4 ${sf.color}`} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-tight">
                        {sf.name}
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Connect accounting software */}
            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-purple-500" /> Connect accounting software
                </CardTitle>
                <CardDescription className="text-xs dark:text-slate-400">
                  Sync transactions directly from your bookkeeping tool.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ACCOUNTING_APPS.map(app => (
                  <button
                    key={app.name}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border ${app.border} ${app.bg} bg-white dark:bg-slate-800 transition-all text-left group`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${app.bg} border ${app.border} flex items-center justify-center shrink-0 font-black text-sm ${app.color}`}
                    >
                      {app.logo}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${app.color}`}>{app.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Click to connect your account
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                      UI Only
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════════════ PHASE: PROCESSING ════════════════════════════ */}
      {phase === 'processing' && (
        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-12 flex flex-col items-center gap-8">
            {/* Pulsing AI orb */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                AI is processing your data
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 truncate max-w-xs">
                {fileName}
              </p>
            </div>
            {/* Overall bar */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Overall progress</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {overallProgress}%
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full"
              />
            </div>
            {/* Step List */}
            <ol className="w-full max-w-md space-y-3">
              {steps.map((step, idx) => (
                <li
                  key={step.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    step.status === 'active'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                      : step.status === 'done'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${
                      step.status === 'done'
                        ? 'bg-green-500 border-green-500'
                        : step.status === 'active'
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {step.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold
                      ${
                        step.status === 'done'
                          ? 'text-green-700 dark:text-green-400'
                          : step.status === 'active'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.status === 'active' && (
                      <Progress
                        value={stepProgress}
                        className="h-1 mt-1.5 bg-blue-100 dark:bg-blue-900/40"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════ PHASE: RESULTS ═══════════════════════════════ */}
      {phase === 'results' && (
        <div className="space-y-8">
          {/* Success Banner */}
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl px-5 py-4">
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200 text-sm">
                Import complete — <span className="font-normal">{fileName}</span>
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                AI processed {transactions.length} transactions and generated tax predictions
              </p>
            </div>
            <button
              onClick={reset}
              className="ml-auto text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                label: 'Total Transactions',
                value: transactions.length.toString(),
                icon: FileBadge,
                color: 'blue',
                sub: 'imported & parsed',
              },
              {
                label: 'Total Revenue',
                value: fmt(totalRevenue),
                icon: CheckCircle2,
                color: 'green',
                sub: 'identified by AI',
              },
              {
                label: 'Total Expenses',
                value: fmt(totalExpenses),
                icon: CheckCircle2,
                color: 'red',
                sub: 'identified by AI',
              },
              {
                label: 'Uncategorized',
                value: uncategorised.toString(),
                icon: AlertCircle,
                color: 'amber',
                sub: 'need your review',
              },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900"
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div
                      className={`p-2.5 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400 shrink-0`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-0.5 tabular-nums">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {stat.sub}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Uncategorized Alert */}
          {uncategorised > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-amber-800 dark:text-amber-200">
                <strong>
                  {uncategorised} transaction{uncategorised > 1 ? 's' : ''}
                </strong>{' '}
                could not be auto-categorised. Use the dropdown in the table below to assign the
                correct category.
              </span>
            </div>
          )}

          {/* Transactions Table */}
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 py-4 px-6 flex-row justify-between items-center">
              <div>
                <CardTitle className="text-base text-slate-800 dark:text-slate-100">
                  Categorized Transactions
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  {transactions.length} records · categories are editable
                </CardDescription>
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-none font-semibold hover:bg-blue-100">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> AI Categorized
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    {['Date', 'Description', 'Category', 'Amount', 'Type', 'Tax Impact'].map(
                      col => (
                        <th
                          key={col}
                          className={`text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 ${col === 'Amount' || col === 'Tax Impact' ? 'text-right' : 'text-left'}`}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map(t => (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${t.category === 'Uncategorized' ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[260px] truncate"
                        title={t.description}
                      >
                        {t.description}
                      </td>
                      <td className="py-2 px-4">
                        <Select value={t.category} onValueChange={v => updateCategory(t.id, v)}>
                          <SelectTrigger
                            className={`h-8 text-xs font-semibold border rounded-lg w-[155px]
                            ${
                              t.category === 'Uncategorized'
                                ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                                : t.category === 'Revenue'
                                  ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap
                        ${t.type === 'Revenue' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {t.type === 'Revenue' ? `+${fmt(t.amount)}` : `(${fmt(t.amount)})`}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-semibold
                          ${
                            t.type === 'Revenue'
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100'
                          }`}
                        >
                          {t.type}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono text-sm font-semibold whitespace-nowrap
                        ${
                          t.taxImpact > 0
                            ? 'text-red-500 dark:text-red-400'
                            : t.taxImpact < 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-slate-400'
                        }`}
                      >
                        {t.taxImpact === 0
                          ? '—'
                          : t.taxImpact > 0
                            ? `+${fmt(t.taxImpact)}`
                            : `-${fmt(Math.abs(t.taxImpact))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                * Tax Impact calculated at 21% federal corporate rate. Negative values reduce your
                liability.
              </p>
              <Button
                size="sm"
                disabled
                className="gap-2 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed hover:bg-slate-200 text-xs"
              >
                <FileText className="h-3.5 w-3.5" /> Save to Declaration
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
