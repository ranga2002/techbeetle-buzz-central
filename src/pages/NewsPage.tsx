import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsModal from "@/components/NewsModal";
import NewsCard from "@/components/NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ArrowUp, Flame, TrendingUp, Filter, Radio } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useContent } from "@/hooks/useContent";
import { formatLocalTime, pickTimeZone } from "@/lib/time";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";

const NewsPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { useContentQuery, useCategoriesQuery } = useContent();

  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!!slug);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [seoItem, setSeoItem] = useState<any>(null);

  const { data: newsData = [], isLoading } = useContentQuery(
    {
      contentType: "news",
      category: selectedCategory !== "all" ? selectedCategory : undefined,
    },
    {
      refetchInterval: 120000, // refresh every 2 minutes
      refetchOnWindowFocus: true,
      staleTime: 60000,
    }
  );
  const { data: categories = [] } = useCategoriesQuery();

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
      setSeoItem(
        slug
          ? sorted.find((item: any) => item.slug === slug) || sorted[0] || null
          : sorted[0] || null
      );
      setVisibleCount(12);

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

  const handleCategorySelect = (slugValue: string) => {
    setSelectedCategory(slugValue);
    setVisibleCount(12);
  };

  const filtered = selectedCategory === "all"
    ? articles
    : articles.filter((item: any) => item.categories?.slug === selectedCategory || item.category_id === selectedCategory);

  const trending = [...articles]
    .sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5);

  const sourcesCount = filtered.reduce((acc: Record<string, number>, item: any) => {
    const name = item.source_name || item.categories?.name || "Tech";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const regionLabels: Record<string, string> = {
    us: "US",
    ca: "Canada",
    gb: "UK",
    eu: "EU",
    au: "Australia",
    in: "India",
    apac: "APAC",
    latam: "LATAM",
  };

  const regions = Array.from(
    new Set(
      filtered
        .map((item: any) => (item.source_country || "").toLowerCase())
        .filter(Boolean)
    )
  );

  const topSources = Object.entries(sourcesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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

  const cards = filtered.slice(0, visibleCount).map((content: any, idx: number) => {
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
      <Helmet>
        <title>
          {seoItem
            ? `${seoItem.title} | TechBeetle News`
            : "Latest Tech News | TechBeetle"}
        </title>
        <meta
          name="description"
          content={
            seoItem?.summary ||
            seoItem?.excerpt ||
            "Live, region-aware tech headlines on gadgets, AI, laptops, and launches. Updated continuously."
          }
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoItem ? `${seoItem.title} | TechBeetle News` : "Latest Tech News | TechBeetle"} />
        <meta
          property="og:description"
          content={
            seoItem?.summary ||
            seoItem?.excerpt ||
            "Live, region-aware tech headlines on gadgets, AI, laptops, and launches. Updated continuously."
          }
        />
        <meta
          property="og:image"
          content={seoItem?.image || seoItem?.featured_image || "https://techbeetle.org/favicon.ico"}
        />
        <meta
          property="og:url"
          content={slug ? `https://techbeetle.org/news/${slug}` : "https://techbeetle.org/news"}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoItem ? `${seoItem.title} | TechBeetle News` : "Latest Tech News | TechBeetle"} />
        <meta
          name="twitter:description"
          content={
            seoItem?.summary ||
            seoItem?.excerpt ||
            "Live, region-aware tech headlines on gadgets, AI, laptops, and launches. Updated continuously."
          }
        />
        <meta
          name="twitter:image"
          content={seoItem?.image || seoItem?.featured_image || "https://techbeetle.org/favicon.ico"}
        />
        <link
          rel="canonical"
          href={slug ? `https://techbeetle.org/news/${slug}` : "https://techbeetle.org/news"}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://techbeetle.org/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "News",
                item: "https://techbeetle.org/news",
              },
              slug
                ? {
                    "@type": "ListItem",
                    position: 3,
                    name: slug,
                    item: `https://techbeetle.org/news/${slug}`,
                  }
                : undefined,
            ].filter(Boolean),
          })}
        </script>
        {seoItem && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: seoItem.title,
              description:
                seoItem.summary ||
                seoItem.excerpt ||
                "Latest technology news",
              datePublished: seoItem.published_at,
              dateModified: seoItem.updated_at || seoItem.published_at,
              mainEntityOfPage: slug
                ? `https://techbeetle.org/news/${slug}`
                : "https://techbeetle.org/news",
              image: seoItem.image || seoItem.featured_image || undefined,
              author: {
                "@type": "Person",
                name:
                  seoItem.profiles?.full_name ||
                  seoItem.profiles?.username ||
                  "TechBeetle",
              },
              publisher: {
                "@type": "Organization",
                name: "TechBeetle",
                logo: {
                  "@type": "ImageObject",
                  url: "https://techbeetle.org/favicon.ico",
                },
              },
            })}
          </script>
        )}
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <section className="rounded-3xl border bg-gradient-to-b from-background/60 to-card backdrop-blur px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="outline" className="w-fit">Tech Intelligence Center</Badge>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold leading-tight">Signal-first news for builders</h1>
                <p className="text-muted-foreground text-lg">
                  Track AI, hardware, chips, and product updates the moment they drop. Filter instantly, stay ahead effortlessly.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm w-full lg:w-auto">
              <div className="rounded-2xl border bg-card px-5 py-4">
                <p className="text-muted-foreground">Stories this week</p>
                <p className="text-2xl font-semibold">{filtered.length}</p>
              </div>
              <div className="rounded-2xl border bg-card px-5 py-4">
                <p className="text-muted-foreground">Tracked sources</p>
                <p className="text-2xl font-semibold">{topSources.length}</p>
              </div>
              <div className="rounded-2xl border bg-card px-5 py-4 col-span-2">
                <p className="text-muted-foreground">Live coverage regions</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs uppercase tracking-wide">
                  {(regions.length ? regions : ["us", "eu"]).map((region) => (
                    <Badge key={region} variant="secondary">
                      {regionLabels[region] || region.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-2xl p-4">
            {error}
          </div>
        )}

        {isLoading ? renderSkeleton() : cards && cards.length > 0 ? (
          <>
            <div className="lg:hidden">
              <Accordion type="multiple" className="w-full space-y-2">
                <AccordionItem value="filters">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-primary" />
                      Categories & filters
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        onClick={() => handleCategorySelect("all")}
                        className="cursor-pointer"
                      >
                        All
                      </Badge>
                      {categories.map((cat: any) => (
                        <Badge
                          key={cat.slug}
                          variant={selectedCategory === cat.slug ? "default" : "outline"}
                          onClick={() => handleCategorySelect(cat.slug)}
                          className="cursor-pointer"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="trending">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Trending now
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      {trending.map((item: any) => (
                        <li key={item.id}>
                          <button
                            className="text-left text-foreground hover:text-primary transition-colors line-clamp-2"
                            onClick={() => handleNewsClick(item)}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sources">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-primary" />
                      Top sources
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {topSources.map(([name, count]) => (
                        <li key={name} className="flex justify-between">
                          <span className="text-foreground">{name}</span>
                          <span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sponsor">
                  <AccordionTrigger className="text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-primary" />
                      Sponsored slot
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="h-20 rounded-xl bg-muted/60 border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                      Ad space (reserved)
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cards}
                </div>
                {visibleCount < filtered.length && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => setVisibleCount((c) => c + 9)}>
                      Load more
                    </Button>
                  </div>
                )}
              </div>
              <aside className="hidden lg:block lg:col-span-1 space-y-4 lg:sticky lg:top-28 self-start">
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Filter className="w-4 h-4 text-primary" />
                      Categories
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        onClick={() => handleCategorySelect("all")}
                        className="cursor-pointer"
                      >
                        All
                      </Badge>
                      {categories.map((cat: any) => (
                        <Badge
                          key={cat.slug}
                          variant={selectedCategory === cat.slug ? "default" : "outline"}
                          onClick={() => handleCategorySelect(cat.slug)}
                          className="cursor-pointer"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Trending now
                    </div>
                    <ul className="space-y-2 text-sm">
                      {trending.map((item: any) => (
                        <li key={item.id}>
                          <button
                            className="text-left text-foreground hover:text-primary transition-colors line-clamp-2"
                            onClick={() => handleNewsClick(item)}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Radio className="w-4 h-4 text-primary" />
                      Top sources
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {topSources.map(([name, count]) => (
                        <li key={name} className="flex justify-between">
                          <span className="text-foreground">{name}</span>
                          <span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-5 space-y-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Sponsored</p>
                    <div className="h-24 rounded-xl bg-muted/60 border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                      Ad slot
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reserve space for future ad placements without shifting layout.
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
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
