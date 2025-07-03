
import React, { useState } from 'react';
import { useContent } from '@/hooks/useContent';
import ContentCard from './ContentCard';
import NewsModal from './NewsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const LatestNews = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { useContentQuery, useCategoriesQuery } = useContent();
  
  const { data: content, isLoading } = useContentQuery({
    category: selectedCategory || undefined,
    contentType: 'news',
    limit: 12,
  });
  
  const { data: categories } = useCategoriesQuery();

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
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('')}
            size="sm"
          >
            All
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.slug)}
              size="sm"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {content?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => (
              <ContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                excerpt={item.excerpt || undefined}
                featuredImage={item.featured_image || undefined}
                contentType={item.content_type}
                category={item.categories as any}
                author={item.profiles as any}
                viewsCount={item.views_count || 0}
                likesCount={item.likes_count || 0}
                readingTime={item.reading_time || undefined}
                publishedAt={item.published_at || undefined}
                onClick={() => handleNewsClick(item)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No content available yet.</p>
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
