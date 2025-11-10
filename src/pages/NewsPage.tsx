import React, { useState, useEffect } from "react";
import { useContent } from "@/hooks/useContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import NewsModal from "@/components/NewsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const NewsPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();

  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!slug);

  const { useContentQuery } = useContent();
  const { data: newsContent, isLoading } = useContentQuery({
    contentType: "news",
    limit: 20,
  });

  // 🔹 When user clicks a card
  const handleNewsClick = (newsItem: any) => {
    setSelectedNewsItem(newsItem);
    setIsModalOpen(true);
    // Update the URL to /news/{slug}
    navigate(`/news/${newsItem.slug}`, { replace: false });
  };

  // 🔹 When modal closes
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNewsItem(null);
    // Return to /news
    navigate("/news");
  };

  // 🔹 When page loads with a slug in the URL (e.g., shared link)
  useEffect(() => {
    if (slug && newsContent && newsContent.length > 0) {
      const article = newsContent.find((item) => item.slug === slug);
      if (article) {
        setSelectedNewsItem(article);
        setIsModalOpen(true);
      }
    }
  }, [slug, newsContent]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Latest Tech News</h1>
          <p className="text-muted-foreground text-lg">
            Stay updated with the latest happenings in the tech world
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
            {newsContent?.map((content) => (
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
                onClick={() => handleNewsClick(content)}
              />
            ))}
          </div>
        )}

        <NewsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          newsItem={selectedNewsItem}
        />
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
