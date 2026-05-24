import { Metadata } from 'next';
import helpContent from '@/data/help-content.json';
import { Button } from '@/components/ui/button';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import HelpMarkdown from '@/components/help/HelpMarkdown';

interface ArticlePageProps {
  params: {
    category: string;
    article: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const category = helpContent.categories.find(c => c.id === params.category);
  const article = category?.articles.find(a => a.id === params.article);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} - Help Center`,
    description: ((article as any).overview || (article as any).content || '').slice(0, 160),
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const category = helpContent.categories.find(c => c.id === params.category);
  const article = category?.articles.find(a => a.id === params.article);

  if (!category || !article) {
    notFound();
  }

  return (
    <AdminLayout>
      <PageHeader
        title={article.title}
        description={`${category.title} > ${article.title}`}
        icon={<HelpCircle className="h-6 w-6" />}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/help" className="flex items-center text-muted-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Help Center
            </Link>
          </Button>
        }
      />

      <div className="max-w-4xl space-y-10 pb-20">
        {/* Article Content */}
        <div className="space-y-8">
          {/* Overview */}
          {(article as any).overview && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Overview
              </h3>
              <p className="text-muted-foreground leading-relaxed">{(article as any).overview}</p>
            </div>
          )}

          {/* Legacy Content Fallback */}
          {(article as any).content && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <HelpMarkdown content={(article as any).content} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Who Uses This */}
            {(article as any).who_uses_this && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Who Uses This?</h3>
                <div className="flex flex-wrap gap-2">
                  {(article as any).who_uses_this.map((role: string) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features / Fields */}
            {((article as any).key_features || (article as any).key_fields) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {(article as any).key_features ? 'Key Features' : 'Key Fields'}
                </h3>
                <ul className="space-y-2">
                  {((article as any).key_features || (article as any).key_fields).map(
                    (item: string) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Steps */}
          {(article as any).steps && (
            <div className="space-y-4 bg-muted/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold">Step-by-Step Guide</h3>
              <div className="space-y-4">
                {(article as any).steps.map((step: string, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="pt-1 text-muted-foreground font-medium">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {(article as any).example && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="bg-muted px-4 py-2 text-sm font-semibold border-b">
                  Business Example
                </div>
                <div className="p-6 space-y-4">
                  <p className="font-medium">{(article as any).example.scenario}</p>
                  <pre className="text-xs bg-slate-950 text-blue-300 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(
                      (article as any).example.data || (article as any).example,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              {(article as any).financial_example && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
                  <div className="bg-primary/10 px-4 py-2 text-sm font-semibold border-b border-primary/20">
                    Financial Impact & Calculations
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      {Object.entries((article as any).financial_example).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center text-sm border-b border-primary/10 pb-1"
                          >
                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="font-mono font-bold text-primary">
                              {typeof value === 'number' ? `$${value}` : value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                    {/* Explanation */}
                    {(article as any).explanation && (
                      <div className="mt-4 text-sm italic text-muted-foreground border-l-4 border-primary pl-4">
                        {(article as any).explanation}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Articles */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Related Articles</h2>
          <ul className="space-y-2">
            {category.articles
              .filter(a => a.id !== article.id)
              .map(relatedArticle => (
                <li key={relatedArticle.id}>
                  <Link
                    href={`/help/${category.id}/${relatedArticle.id}`}
                    className="text-primary hover:underline"
                  >
                    {relatedArticle.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        {/* Feedback Section */}
        <div className="border-t pt-8 text-center">
          <h2 className="text-lg font-medium mb-4">Was this article helpful?</h2>
          <div className="flex justify-center gap-4">
            <Button variant="outline">Yes</Button>
            <Button variant="outline">No</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
