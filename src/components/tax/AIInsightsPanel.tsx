"use client";

import React, { useState } from "react";
import {
    Sparkles, X, ChevronLeft, ChevronRight,
    AlertTriangle, TrendingUp, ArrowRight, CheckCircle2, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Severity = "warning" | "opportunity" | "info";

interface Insight {
    id: string;
    title: string;
    body: string[];
    severity: Severity;
    impactLabel: string;
    impactValue: string;
    impactPositive: boolean;
}

const INSIGHTS: Insight[] = [
    {
        id: "marketing",
        title: "High Marketing Spend",
        body: ["You spent 18% more on marketing than the industry average.", "Potential optimization: Adjust allocation timing to shift spend into the next fiscal year."],
        severity: "warning",
        impactLabel: "Estimated Tax Savings",
        impactValue: "$4,200",
        impactPositive: true,
    },
    {
        id: "depreciation",
        title: "Unused Depreciation Opportunity",
        body: ["Equipment purchases totaling $9,750 were detected in your imported data.", "You may qualify for Section 179 accelerated depreciation."],
        severity: "opportunity",
        impactLabel: "Potential Savings",
        impactValue: "$9,800",
        impactPositive: true,
    },
    {
        id: "growth",
        title: "Revenue Growth Trend Detected",
        body: ["Revenue increased 22% over last quarter based on imported transaction history.", "At current trajectory, your annual taxable income will rise significantly."],
        severity: "info",
        impactLabel: "Projected Tax Increase",
        impactValue: "+$12,400",
        impactPositive: false,
    },
];

const SEVERITY_CONFIG = {
    warning: { icon: AlertTriangle, label: "Warning", badgeCls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-700", iconBg: "bg-amber-50 dark:bg-amber-900/30", iconCls: "text-amber-600 dark:text-amber-400", strip: "bg-amber-400" },
    opportunity: { icon: CheckCircle2, label: "Opportunity", badgeCls: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-700", iconBg: "bg-green-50 dark:bg-green-900/30", iconCls: "text-green-600 dark:text-green-400", strip: "bg-green-500" },
    info: { icon: TrendingUp, label: "Trend Alert", badgeCls: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-700", iconBg: "bg-blue-50 dark:bg-blue-900/30", iconCls: "text-blue-600 dark:text-blue-400", strip: "bg-blue-500" },
};

export function AIInsightsPanel() {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState<Record<string, boolean>>({});
    const toggleApply = (id: string) => setApplied(prev => ({ ...prev, [id]: !prev[id] }));
    const appliedCount = Object.values(applied).filter(Boolean).length;

    return (
        <>
            {/* Backdrop (mobile) */}
            {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}

            {/* Trigger Tab */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`fixed top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 transition-all duration-300
          bg-slate-900 dark:bg-slate-800 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-bold
          rounded-l-xl px-2 py-4 shadow-lg border-l border-t border-b border-slate-700
          ${open ? "right-[360px]" : "right-0"}`}
                style={{ writingMode: "vertical-rl" }}
                aria-label="Toggle AI Insights"
            >
                <Sparkles className="h-4 w-4" style={{ writingMode: "horizontal-tb" }} />
                <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>AI Insights</span>
                {open
                    ? <ChevronRight className="h-4 w-4" style={{ writingMode: "horizontal-tb" }} />
                    : <ChevronLeft className="h-4 w-4" style={{ writingMode: "horizontal-tb" }} />}
            </button>

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-[360px] z-40
        bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl
        flex flex-col transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "translate-x-full"}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-400" />
                        <div>
                            <p className="font-bold text-sm">AI Tax Insights</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{INSIGHTS.length} insights from imported data</p>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Applied count */}
                {appliedCount > 0 && (
                    <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {appliedCount} simulation{appliedCount > 1 ? "s" : ""} applied
                    </div>
                )}

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {INSIGHTS.map(insight => {
                        const cfg = SEVERITY_CONFIG[insight.severity];
                        const Icon = cfg.icon;
                        const isApplied = applied[insight.id];
                        return (
                            <div key={insight.id} className={`relative rounded-2xl border overflow-hidden transition-all duration-200
                ${isApplied ? "border-blue-300 dark:border-blue-600 ring-1 ring-blue-100 dark:ring-blue-900 shadow-md" : `${cfg.border} shadow-sm`}`}>
                                <div className={`absolute top-0 left-0 w-1 h-full ${cfg.strip}`} />
                                <div className="pl-4 pr-4 py-4 space-y-3 bg-white dark:bg-slate-900">
                                    {/* Title */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${cfg.iconBg}`}>
                                                <Icon className={`h-4 w-4 ${cfg.iconCls}`} />
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{insight.title}</h4>
                                        </div>
                                        <Badge className={`text-[10px] font-bold shrink-0 border-none ${cfg.badgeCls}`}>{cfg.label}</Badge>
                                    </div>
                                    {/* Body */}
                                    <ul className="space-y-1.5">
                                        {insight.body.map((line, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                                                {line}
                                            </li>
                                        ))}
                                    </ul>
                                    {/* Impact */}
                                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl
                    ${insight.impactPositive
                                            ? "bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800"
                                            : "bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800"}`}>
                                        <DollarSign className={`h-4 w-4 shrink-0 ${insight.impactPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`} />
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{insight.impactLabel}</p>
                                            <p className={`text-base font-black font-mono ${insight.impactPositive ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{insight.impactValue}</p>
                                        </div>
                                    </div>
                                    {/* Apply button */}
                                    <Button
                                        size="sm"
                                        variant={isApplied ? "default" : "outline"}
                                        className={`w-full h-9 gap-2 text-xs font-semibold transition-all
                      ${isApplied ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
                                        onClick={() => toggleApply(insight.id)}
                                    >
                                        {isApplied ? <><CheckCircle2 className="h-3.5 w-3.5" /> Simulation Applied</> : <><ArrowRight className="h-3.5 w-3.5" /> Apply Simulation</>}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 shrink-0 bg-slate-50/50 dark:bg-slate-900">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        Insights auto-generated from imported transaction data and industry benchmarks. Simulations do not affect your filed tax return.
                    </p>
                </div>
            </div>
        </>
    );
}
