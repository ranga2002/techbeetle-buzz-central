
import React from 'react';
import { useContent } from '@/hooks/useContent';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';

const HowToPage = () => {
  const { useContentQuery } = useContent();
  const { data: howToContent, isLoading } = useContentQuery({
    contentType: 'how_to',
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">How-To Guides</h1>
          <p className="text-muted-foreground text-lg">
            Step-by-step tutorials and tech tips to help you master technology
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {howToContent?.map((content) => (
              <ContentCard
                key={content.id}
                id={content.id}
                title={content.title}
                excerpt={content.excerpt || undefined}
                featuredImage={content.featured_image || undefined}
                contentType={content.content_type}
                category={content.categories as any}
                author={content.profiles as any}
                viewsCount={content.views_count || 0}
                likesCount={content.likes_count || 0}
                readingTime={content.reading_time || undefined}
                publishedAt={content.published_at || undefined}
                onClick={() => {
                  console.log('Navigate to how-to:', content.slug);
                }}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default HowToPage;
