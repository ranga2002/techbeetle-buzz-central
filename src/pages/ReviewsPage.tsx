import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useContent } from "@/hooks/useContent";
import { formatLocalTime, pickTimeZone } from "@/lib/time";
import { Filter, RefreshCw, Star, Wand2, Search, SortDesc } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ReviewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { useContentQuery } = useContent();
  const {
    data: reviewsContent = [],
    isLoading,
    isError,
    error: reviewsError,
  } = useContentQuery({
    contentType: "review",
    limit: 50,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "top" | "views">("newest");
  const [search, setSearch] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});

  const sorted = useMemo(
    () =>
      [...reviewsContent].sort((a: any, b: any) => {
        const aDate = new Date(a.published_at || "").getTime() || 0;
        const bDate = new Date(b.published_at || "").getTime() || 0;
        return bDate - aDate;
      }),
    [reviewsContent]
  );

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    reviewsContent.forEach((item: any) => {
      if (item.categories?.slug) {
        map.set(item.categories.slug, item.categories.name || item.categories.slug);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [reviewsContent]);

  const filtered =
    selectedCategory === "all"
      ? sorted
      : sorted.filter((item: any) => item.categories?.slug === selectedCategory);

  const searched = useMemo(
    () =>
      filtered.filter((item: any) => {
        if (!search) return true;
        const hay = `${item.title} ${item.excerpt || ""} ${item.categories?.name || ""}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      }),
    [filtered, search]
  );

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const ids = filtered.map((item: any) => item.id).filter(Boolean);
      if (!ids.length) {
        if (!cancelled) setRatingsMap({});
        return;
      }

      try {
        const { data, error } = await supabase
          .from("review_details")
          .select("content_id, overall_rating")
          .in("content_id", ids);

        if (error) throw error;

        const map: Record<string, number> = {};
        (data || []).forEach((row: any) => {
          if (row.overall_rating) {
            map[row.content_id] = row.overall_rating;
          }
        });
        if (!cancelled) setRatingsMap(map);
      } catch (error: any) {
        if (!cancelled) {
          toast({
            title: "Unable to load ratings",
            description: error?.message || "Please try again shortly.",
            duration: 2500,
            variant: "destructive",
          });
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [filtered, toast]);

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, search, sortBy]);

  const orderedReviews = useMemo(() => {
    const list = [...searched];
    if (sortBy === "top") {
      return list.sort((a, b) => (ratingsMap[b.id] || 0) - (ratingsMap[a.id] || 0));
    }
    if (sortBy === "views") {
      return list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    }
    return list;
  }, [searched, sortBy, ratingsMap]);

  const pageTitle = "Tech Reviews | TechBeetle";

  const averageRating =
    searched.length > 0
      ? (
          searched.reduce((acc: number, item: any) => acc + (ratingsMap[item.id] || 0), 0) /
          Math.max(searched.length, 1)
        ).toFixed(1)
      : "0.0";

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
      <Wand2 className="w-10 h-10 text-primary mx-auto" />
      <h3 className="text-xl font-semibold">No reviews yet</h3>
      <p className="text-muted-foreground">
        Check back soon for deep dives on laptops, phones, audio, and more.
      </p>
      <Button variant="outline" onClick={() => window.location.reload()} className="inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Reload
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="In-depth, fast-turn tech reviews on laptops, phones, audio, and chips. Region-aware timestamps, updated frequently."
        />
        <link rel="canonical" href="https://techbeetle.org/reviews" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tech Reviews | TechBeetle" />
        <meta
          property="og:description"
          content="In-depth, fast-turn tech reviews on laptops, phones, audio, and chips. Updated frequently."
        />
        <meta property="og:url" content="https://techbeetle.org/reviews" />
        <meta property="og:image" content="https://techbeetle.org/favicon.ico" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tech Reviews | TechBeetle" />
        <meta
          name="twitter:description"
          content="In-depth, fast-turn tech reviews on laptops, phones, audio, and chips."
        />
        <meta name="twitter:image" content="https://techbeetle.org/favicon.ico" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://techbeetle.org/" },
              { "@type": "ListItem", position: 2, name: "Reviews", item: "https://techbeetle.org/reviews" },
            ],
          })}
        </script>
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="rounded-3xl border bg-gradient-to-r from-background/70 via-card to-accent/5 backdrop-blur px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="outline" className="w-fit">
                Product Reviews
              </Badge>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold leading-tight">Verdicts that ship fast</h1>
                <p className="text-muted-foreground text-lg max-w-3xl">
                  Concise takes on laptops, phones, audio, and components — region-aware and time-stamped.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="w-4 h-4" /> Avg rating: {averageRating}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="w-4 h-4" /> {categories.length || "No"} categories
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm w-full lg:w-auto">
              <div className="rounded-2xl border bg-card px-5 py-4">
                <p className="text-muted-foreground">Reviews live</p>
                <p className="text-2xl font-semibold">{orderedReviews.length}</p>
              </div>
              <div className="rounded-2xl border bg-card px-5 py-4">
                <p className="text-muted-foreground">Latest publish</p>
                <p className="text-sm font-semibold">
                  {orderedReviews[0]?.published_at
                    ? formatLocalTime(orderedReviews[0].published_at, pickTimeZone(orderedReviews[0].source_country))
                    : "TBD"}
                </p>
              </div>
            </div>

          </div>
          
        </section>
        {isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            We couldn't load reviews right now. Please retry in a moment.
            {reviewsError && typeof reviewsError === "object" && "message" in reviewsError && (
              <span className="block text-xs opacity-80">{(reviewsError as any).message}</span>
            )}
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-3 items-center">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedCategory("all");
                setVisibleCount(12);
              }}
            >
              All
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.slug}
                variant={selectedCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setVisibleCount(12);
                }}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SortDesc className="w-4 h-4 text-muted-foreground" />
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setVisibleCount(12);
              }}
            >
              <option value="newest">Newest</option>
              <option value="top">Top rated</option>
              <option value="views">Most viewed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              placeholder="Search title or brand..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(12);
              }}
            />
          </div>
        </div>

        {isLoading
          ? renderSkeleton()
          : orderedReviews.length === 0
          ? renderEmpty()
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderedReviews.slice(0, visibleCount).map((content: any) => {
                const publishedAt = formatLocalTime(
                  content.published_at,
                  pickTimeZone(content.source_country || content.categories?.country)
                );
                const readTime = content.reading_time ? `${content.reading_time} min read` : undefined;
                return (
                  <Card key={content.id} className="border-border/70 hover:border-primary transition-colors">
                    <CardContent className="p-0">
                      <ContentCard
                        id={content.id}
                        title={content.title}
                        excerpt={content.excerpt || undefined}
                        featuredImage={content.featured_image || undefined}
                        contentType={content.content_type}
                        category={content.categories as any}
                        author={content.profiles as any}
                        viewsCount={content.views_count || 0}
                        likesCount={content.likes_count || 0}
                        readingTime={readTime}
                        publishedAt={publishedAt}
                        badgeExtra={
                          ratingsMap[content.id] ? `Rating: ${ratingsMap[content.id]}/5` : undefined
                        }
                        onClick={() => {
                          if (content.slug) {
                            navigate(`/reviews/${content.slug}`);
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        {visibleCount < orderedReviews.length && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setVisibleCount((c) => c + 9)}>
              Load more
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReviewsPage;
