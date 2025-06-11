
import React from 'react';
import { useContent } from '@/hooks/useContent';
import ContentCard from './ContentCard';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedSection = () => {
  const { useFeaturedContentQuery } = useContent();
  const { data: featuredContent, isLoading } = useFeaturedContentQuery();

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!featuredContent?.length) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Featured Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredContent.map((content) => (
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
                // TODO: Navigate to content page
                console.log('Navigate to content:', content.slug);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
