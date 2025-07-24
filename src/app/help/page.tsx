import { Metadata } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import helpContent from '@/data/help-content.json';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help and learn how to use the dashboard effectively',
};

export default function HelpCenter() {
  return (
    <ProtectedRoute requiredPrivilege="help:view">
      <AdminLayout>
        <PageHeader
          title="Help Center"
          description="Get help and learn how to use the dashboard effectively"
          icon={<HelpCircle className="h-6 w-6" />}
        />

        <div className="space-y-8">
          {/* Search Section */}
          <div className="flex items-center gap-2 max-w-lg">
            <Input placeholder="Search help articles..." className="w-full" />
            <Button>Search</Button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpContent.categories.map(category => {
              const Icon = Icons[category.icon as keyof typeof Icons];
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-6 w-6 text-primary" />}
                      <CardTitle>{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.articles.length} articles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.articles.map(article => (
                        <li key={article.id}>
                          <Link
                            href={`/help/${category.id}/${article.id}`}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Popular Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="w-full justify-start">
                <Icons.Package className="mr-2 h-4 w-4" />
                Track an Order
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Icons.Wallet className="mr-2 h-4 w-4" />
                Manage Wallet
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Icons.Users className="mr-2 h-4 w-4" />
                Shopper Performance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Icons.Headphones className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
