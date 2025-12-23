
import React from 'react';
import { useContent } from '@/hooks/useContent';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

const VideosPage = () => {
  const { useContentQuery } = useContent();
  const { data: videoContent, isLoading } = useContentQuery({
    contentType: 'video',
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Videos | Tech Beetle</title>
        <meta name="description" content="Watch the latest Tech Beetle videos, reviews, tutorials, and explainers." />
        <link rel="canonical" href="https://techbeetle.org/videos" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Videos | Tech Beetle" />
        <meta property="og:description" content="Watch the latest Tech Beetle videos, reviews, tutorials, and explainers." />
        <meta property="og:image" content="https://techbeetle.org/assets/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Videos | Tech Beetle" />
        <meta name="twitter:description" content="Watch the latest Tech Beetle videos, reviews, tutorials, and explainers." />
        <meta name="twitter:image" content="https://techbeetle.org/assets/logo.png" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tech Videos</h1>
          <p className="text-muted-foreground text-lg">
            Watch the latest tech reviews, tutorials, and explainers
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
            {videoContent?.map((content) => (
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
                onClick={content.slug ? () => (window.location.href = `/news/${content.slug}`) : undefined}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default VideosPage;
