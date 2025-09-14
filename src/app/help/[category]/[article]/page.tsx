import { Metadata } from 'next';
import helpContent from '@/data/help-content.json';
import { Button } from '@/components/ui/button';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';

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
    description: article.content.slice(0, 160),
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

      <div className="max-w-3xl space-y-8">
        {/* Article Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <Markdown>{article.content}</Markdown>
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
