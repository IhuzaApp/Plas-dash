import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  ArrowUpCircle, 
  Zap, 
  TrendingUp, 
  Video, 
  Activity, 
  CheckCircle2, 
  Layers,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BillingUsageTabProps {
  subscriptionData: any;
  usageData: any;
  isLoadingSubscription: boolean;
  currencySymbol: string;
}

const BillingUsageTab: React.FC<BillingUsageTabProps> = ({
  subscriptionData,
  usageData,
  isLoadingSubscription,
  currencySymbol,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card - Made Smaller (1 column) */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 via-background to-background rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex flex-wrap items-center gap-2">
                  {subscriptionData?.plan?.name || 'Standard Plan'}
                  <Badge className={cn(
                    "border-none text-[10px] h-5",
                    subscriptionData?.status === 'active' ? "bg-primary/20 text-primary" : "bg-zinc-500/20 text-zinc-500"
                  )}>
                    {subscriptionData?.status?.toUpperCase() || 'INACTIVE'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs line-clamp-1">
                  {subscriptionData?.plan?.description || 'Managed subscription'}
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-muted/30 border border-muted-foreground/5 flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Renewal</p>
                <div className="flex items-center gap-2">
                  <History className="h-3 w-3 text-primary" />
                  <span className="font-semibold text-sm">
                    {subscriptionData?.end_date ? format(new Date(subscriptionData.end_date), 'MMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border border-muted-foreground/5 flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Pricing</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-primary" />
                  <span className="font-semibold text-sm">
                    {currencySymbol}{subscriptionData?.billing_cycle === 'yearly' ? subscriptionData?.plan?.price_yearly : subscriptionData?.plan?.price_monthly || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button size="sm" className="w-full rounded-xl h-10 shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Card (Merchant Wallet) - Made Bigger (2 columns) */}
        <Card className="md:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden bg-muted/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">Merchant Wallet</CardTitle>
                <CardDescription>Primary funding source for your business operations</CardDescription>
              </div>
              <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                ACTIVE WALLET
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
              <div className="lg:col-span-3 p-6 rounded-[2rem] bg-zinc-950 dark:bg-zinc-900 text-white shadow-2xl relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-700 scale-150 group-hover:rotate-12">
                  <Layers className="h-32 w-32" />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Available Balance</p>
                      <p className="text-4xl font-mono tracking-tighter font-bold text-primary">
                        {currencySymbol}{(subscriptionData?.Shop?.merchant_wallet?.balance || subscriptionData?.Restaurant?.merchant_wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="h-10 w-16 bg-zinc-800/50 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                      <div className="h-6 w-10 bg-primary/60 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Wallet Holder</p>
                      <p className="text-sm font-semibold uppercase tracking-wider">
                        {subscriptionData?.Shop?.name || subscriptionData?.Restaurant?.name || 'Admin User'}
                      </p>
                    </div>
                    <div className="flex -space-x-3">
                      <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white/20" />
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/40 border border-white/20 backdrop-blur-sm shadow-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 rounded-2xl bg-background border border-primary/10 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Linked Business</p>
                  <p className="text-sm font-semibold truncate">
                    {subscriptionData?.Shop?.name || subscriptionData?.Restaurant?.name || 'Main Entity'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-background border border-primary/10 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Transaction</p>
                  <p className="text-sm font-semibold">
                    {subscriptionData?.Shop?.merchant_wallet?.update_at ? format(new Date(subscriptionData.Shop.merchant_wallet.update_at), 'MMM dd, HH:mm') : 'Recently'}
                  </p>
                </div>
                <Button className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                  <ArrowUpCircle className="h-5 w-5" />
                  Top Up Wallet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Usage Tracker */}
        {(() => {
          const aiData = usageData?.ai_usage?.[0];
          const aiLimit = aiData?.request_count !== undefined ? aiData.request_count : (subscriptionData?.plan?.ai_request_limit || 0);
          const aiUsed = aiData?.requests_sent || 0;
          const isUnlimited = aiLimit === -1;
          const aiPercentage = isUnlimited ? 0 : (aiLimit > 0 ? Math.min(Math.round((aiUsed / aiLimit) * 100), 100) : 0);
          const hasNoSubscription = !aiData && aiLimit <= 5;

          return (
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-muted/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      AI Intelligence Usage
                    </CardTitle>
                    <CardDescription>
                      {hasNoSubscription ? 'Unlock AI-powered content generation' : 'Consumption of AI credits for content generation'}
                    </CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary opacity-50" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasNoSubscription ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">No AI Subscription</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">Upgrade your plan to start using AI for your business content.</p>
                    </div>
                    <Button className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2 shadow-lg shadow-primary/20">
                      <ArrowUpCircle className="h-4 w-4" />
                      Subscribe to AI
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">
                          {isUnlimited ? 'Unlimited' : `${aiUsed.toLocaleString()} / ${aiLimit.toLocaleString()}`} Credits
                        </span>
                        {!isUnlimited && <span className="text-primary font-bold">{aiPercentage}%</span>}
                      </div>
                      <Progress value={isUnlimited ? 0 : aiPercentage} className="h-3 rounded-full bg-muted shadow-inner" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Cap</p>
                        <p className="text-sm font-bold">{isUnlimited ? '∞' : aiLimit.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining</p>
                        <p className="text-sm font-bold text-primary">{isUnlimited ? '∞' : Math.max(0, aiLimit - aiUsed).toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Reset In</p>
                        <p className="text-sm font-bold">
                          {subscriptionData?.end_date ? Math.max(0, Math.ceil((new Date(subscriptionData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0} Days
                        </p>
                      </div>
                    </div>
                    <Button className="w-full rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border-none transition-colors gap-2">
                      <ArrowUpCircle className="h-4 w-4" />
                      Purchase More Credits
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Reel Production Usage */}
        {(() => {
          const reelData = usageData?.reel_usage?.[0];
          const reelLimit = subscriptionData?.plan?.reel_limit || 0;
          const reelUsed = reelData?.upload_count || 0;
          const reelPercentage = reelLimit > 0 ? Math.min(Math.round((reelUsed / reelLimit) * 100), 100) : 0;
          const hasNoReelSubscription = !reelData && reelLimit <= 0;

          return (
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-muted/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-4 w-4 text-primary" />
                      Reel Production Limits
                    </CardTitle>
                    <CardDescription>
                      {hasNoReelSubscription ? 'Create stunning video marketing reels' : 'Monthly video marketing generation quota'}
                    </CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-primary opacity-50" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasNoReelSubscription ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Video className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold">No Reel Quota</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">Activate your reel production quota to start generating video content.</p>
                    </div>
                    <Button className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2 shadow-lg shadow-primary/20">
                      <Layers className="h-4 w-4" />
                      Activate Reel Plan
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{reelUsed.toLocaleString()} / {reelLimit.toLocaleString()} Reels</span>
                        <span className="text-primary font-bold">{reelPercentage}%</span>
                      </div>
                      <Progress value={reelPercentage} className="h-3 rounded-full bg-muted shadow-inner" />
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Standard Resolution (1080p)</p>
                        <p className="text-[10px] text-muted-foreground">
                          {reelLimit - reelUsed} productions remaining this cycle
                        </p>
                      </div>
                    </div>
                    <Button className="w-full rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border-none transition-colors gap-2">
                      <Layers className="h-4 w-4" />
                      Manage Quota Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Subscription Invoices Table */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-muted/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">Subscription Invoices</CardTitle>
            <CardDescription>Review and download your billing history</CardDescription>
          </div>
          <Button variant="outline" className="rounded-xl border-primary/10 hover:bg-primary/5 text-primary gap-2">
            <History className="h-4 w-4" />
            View Full History
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-muted-foreground/10">
                  <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Invoice</th>
                  <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Date</th>
                  <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Amount</th>
                  <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                  <th className="py-4"></th>
                </tr>
              </thead>
              <tbody>
                {subscriptionData?.subscription_invoices?.length > 0 ? (
                  subscriptionData.subscription_invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b border-muted-foreground/5 hover:bg-muted/5 transition-colors">
                      <td className="py-4">
                        <p className="font-semibold text-foreground">#{invoice.invoice_number || invoice.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-muted-foreground">{invoice.plan_name}</p>
                      </td>
                      <td className="py-4">
                        <span className="text-muted-foreground">
                          {invoice.created_at ? format(new Date(invoice.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="font-bold">
                          {currencySymbol}{invoice.plan_price?.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge className={cn(
                          "rounded-full px-2 py-0 h-5 text-[10px] border-none font-bold",
                          invoice.status === 'paid' ? "bg-primary/20 text-primary" : "bg-zinc-500/20 text-zinc-500"
                        )}>
                          {invoice.status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" className="rounded-lg h-8 text-primary hover:bg-primary/10">
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                      No invoices found for this subscription.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingUsageTab;
