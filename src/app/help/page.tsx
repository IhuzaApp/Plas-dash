'use client';

import React, { useState, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import helpContent from '@/data/help-content.json';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { HelpCircle, Search as SearchIcon } from 'lucide-react';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return helpContent.categories;

    const query = searchQuery.toLowerCase();

    return helpContent.categories
      .map(category => {
        // Check if category title matches
        const categoryMatches = category.title.toLowerCase().includes(query);

        // Filter articles that match
        const matchingArticles = category.articles.filter(
          article =>
            article.title.toLowerCase().includes(query) ||
            (article as any).content?.toLowerCase().includes(query) ||
            (article as any).overview?.toLowerCase().includes(query)
        );

        if (categoryMatches || matchingArticles.length > 0) {
          return {
            ...category,
            articles: matchingArticles.length > 0 ? matchingArticles : category.articles,
            isExplicitMatch: categoryMatches && matchingArticles.length === 0,
          };
        }

        return null;
      })
      .filter(Boolean) as typeof helpContent.categories;
  }, [searchQuery]);

  return (
    <ProtectedRoute requiredPrivilege="help" requiredAction="access">
      <AdminLayout>
        <PageHeader
          title="Help Center"
          description="Get help and learn how to use the dashboard effectively"
          icon={<HelpCircle className="h-6 w-6" />}
        />

        <div className="space-y-8">
          {/* Search Section */}
          <div className="flex items-center gap-2 max-w-lg">
            <div className="relative w-full">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles, features, or logic..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.length > 0 ? (
              filteredContent.map(category => {
                const Icon = Icons[category.icon as keyof typeof Icons];
                return (
                  <Card
                    key={category.id}
                    className="hover:shadow-lg transition-shadow border-primary/10"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-6 w-6 text-primary" />}
                        <CardTitle>{category.title}</CardTitle>
                      </div>
                      <CardDescription>
                        {searchQuery
                          ? `${category.articles.length} match(es)`
                          : `${category.articles.length} articles`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.articles.map(article => (
                          <li key={article.id}>
                            <Link
                              href={`/help/${category.id}/${article.id}`}
                              className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                              {article.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                  <SearchIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-muted-foreground">
                  Try searching for different keywords or browse the categories below.
                </p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear search
                </Button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          {!searchQuery && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Popular Topics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/help/subscriptions/billing-dashboard">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.CreditCard className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Subscriptions</span>
                    <span className="text-xs text-muted-foreground">Billing & renewals</span>
                  </Button>
                </Link>
                <Link href="/help/tax-management/tax-declarations">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.Calculator className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Tax Management</span>
                    <span className="text-xs text-muted-foreground">Forecasting & reporting</span>
                  </Button>
                </Link>
                <Link href="/help/pos-production/recipe-management">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.Factory className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">POS Production</span>
                    <span className="text-xs text-muted-foreground">Recipes & stock control</span>
                  </Button>
                </Link>
                <Link href="/help/procurement/supplier-management">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.ShoppingCart className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Procurement</span>
                    <span className="text-xs text-muted-foreground">Suppliers & POs</span>
                  </Button>
                </Link>
                <Link href="/help/orders/create-order">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.Package className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Order Management</span>
                    <span className="text-xs text-muted-foreground">Creation & tracking</span>
                  </Button>
                </Link>
                <Link href="/help/financial/wallet-management">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.Wallet className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Financials</span>
                    <span className="text-xs text-muted-foreground">Wallets & payouts</span>
                  </Button>
                </Link>
                <Link href="/help/support/create-ticket">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.Headphones className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Customer Support</span>
                    <span className="text-xs text-muted-foreground">Tickets & assistance</span>
                  </Button>
                </Link>
                <Link href="/help/products/manual-product-entry">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-6 flex flex-col items-start gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Icons.Package className="h-5 w-5 mb-1 text-primary" />
                    <span className="font-semibold">Product Catalog</span>
                    <span className="text-xs text-muted-foreground">Manual & bulk entry</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
