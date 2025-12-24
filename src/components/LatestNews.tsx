
import React, { useMemo, useState } from 'react';
import { useContent } from '@/hooks/useContent';
import NewsCard from './NewsCard';
import NewsModal from './NewsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatLocalTime, pickTimeZone } from '@/lib/time';
import { dedupeNewsItems } from '@/lib/news';

const LatestNews = () => {
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { useContentQuery } = useContent();

  const {
    data: content,
    isLoading,
    isError,
    error,
  } = useContentQuery({
    contentType: 'news',
    isIndexable: true,
    limit: 9,
  }, {
    refetchInterval: 120000, // keep homepage fresh every 2 minutes
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });

  const hasError = isError;

  const sortedContent = useMemo(() => {
    if (!content) return [];
    return dedupeNewsItems(content).sort((a: any, b: any) => {
      const aDate = new Date(a.published_at || "").getTime() || 0;
      const bDate = new Date(b.published_at || "").getTime() || 0;
      return bDate - aDate;
    });
  }, [content]);

  const handleNewsClick = (newsItem: any) => {
    setSelectedNewsItem(newsItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNewsItem(null);
  };

  if (isLoading) {
    return (
      <section className="">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
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

  return (
    <section className="">
      <div className="container mx-auto px-4 text-white">
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-[0.14em] text-slate-300/80 mb-2">Fresh briefs</p>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-amber-200 to-cyan-300 bg-clip-text text-transparent inline-block">
            Latest News
          </h2>
        </div>

        {hasError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            We couldn't load the latest headlines right now. Please retry or check back shortly.
            {error && typeof error === 'object' && 'message' in error && (
              <span className="ml-1 text-xs opacity-80">{(error as any).message}</span>
            )}
          </div>
        )}

        {sortedContent?.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedContent.map((item) => {
                const publishedLabel = formatLocalTime(
                  item.published_at,
                  pickTimeZone(item.source_country || item.categories?.country)
                );
                return (
                  <NewsCard
                    key={item.id}
                    className="border-white/10 bg-white/5 text-white"
                    title={item.title}
                    excerpt={item.excerpt || undefined}
                    category={item.categories?.name || 'Tech'}
                    author={item.profiles?.full_name || item.profiles?.username || 'TechBeetle'}
                    publishTime={publishedLabel}
                    readTime={item.reading_time ? `${item.reading_time} min read` : '5 min read'}
                    image={item.featured_image || ''}
                    onClick={() => handleNewsClick(item)}
                  />
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                <a href="/news">View More</a>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg text-slate-200/90">No content available yet.</p>
            <p className="text-sm text-slate-300/80 mt-2">Check back soon for the latest tech headlines.</p>
          </div>
        )}
        
        <NewsModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          newsItem={selectedNewsItem}
        />
      </div>
    </section>
  );
};

export default LatestNews;
