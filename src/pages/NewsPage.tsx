import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsModal from "@/components/NewsModal";
import NewsCard from "@/components/NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ArrowUp } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { formatLocalTime, pickTimeZone } from "@/lib/time";

const NewsPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { useContentQuery } = useContent();

  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!slug);
  const [articles, setArticles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: newsData = [], isLoading } = useContentQuery(
    {
      contentType: "news",
    },
    {
      refetchInterval: 120000, // refresh every 2 minutes
      refetchOnWindowFocus: true,
      staleTime: 60000,
    }
  );

  const handleNewsClick = (newsItem: any) => {
    setSelectedNewsItem(newsItem);
    setIsModalOpen(true);
    navigate(`/news/${newsItem.slug}`, { replace: false });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNewsItem(null);
    navigate("/news");
  };

  useEffect(() => {
    try {
      const sorted = [...(newsData || [])].sort((a, b) => {
        const aDate = new Date(a.published_at || "").getTime() || 0;
        const bDate = new Date(b.published_at || "").getTime() || 0;
        return bDate - aDate;
      });
      setArticles(sorted);

      if (slug) {
        const match = sorted.find((item: any) => item.slug === slug);
        if (match) {
          setSelectedNewsItem(match);
          setIsModalOpen(true);
        }
      }
    } catch (err: any) {
      console.error("Error processing news data:", err);
      setError("Unable to load the latest tech news right now.");
    }
  }, [newsData, slug]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="bg-card border rounded-2xl p-10 text-center space-y-3">
      <Sparkles className="w-10 h-10 text-primary mx-auto" />
      <h3 className="text-xl font-semibold">No tech news yet</h3>
      <p className="text-muted-foreground">
        Stay tuned while we pull fresh gadget launches, AI drops, and product updates.
      </p>
      <Button variant="outline" onClick={() => window.location.reload()} className="inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Reload feed
      </Button>
    </div>
  );

  const cards = articles.map((content: any, idx: number) => {
    const category = content.categories?.name || content.source_name || "Tech";
    const author = content.profiles?.full_name || content.profiles?.username || "TechBeetle";
    const publishedAt = formatLocalTime(
      content.published_at,
      pickTimeZone(content.source_country || content.categories?.country)
    );
    const readTime = content.reading_time ? `${content.reading_time} min read` : "5 min read";
    const comments = content.comments_count || 0;
    const likes = content.likes_count || 0;
    const featured = idx === 0;

    return (
      <NewsCard
        key={content.id}
        title={content.title}
        excerpt={content.summary || content.excerpt || "Catch the latest on gadgets, AI, and the next big thing."}
        category={category}
        author={author}
        publishTime={publishedAt}
        readTime={readTime}
        image={content.image || content.featured_image || "https://placehold.co/800x450?text=Tech+Beetle"}
        comments={comments}
        likes={likes}
        featured={featured}
        onClick={() => handleNewsClick(content)}
      />
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <section className="rounded-3xl border bg-card/60 backdrop-blur px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              Technology & Gadgets
            </Badge>
            <h1 className="text-4xl font-bold leading-tight">Latest Tech Briefing</h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Curated drops on gadgets, AI, laptops, and the launches that matter. Updated frequently for your region.
            </p>
          </div>
        </section>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-2xl p-4">
            {error}
          </div>
        )}

        {isLoading ? renderSkeleton() : cards && cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards}
          </div>
        ) : (
          renderEmpty()
        )}

        <NewsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          newsItem={selectedNewsItem}
        />
      </main>
      <Footer />
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default NewsPage;
