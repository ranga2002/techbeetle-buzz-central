import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ContentCard from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";

const fetchLatestInsights = async () => {
  const { data, error } = await supabase
    .from("content")
    .select(`*, categories(*), profiles(*)`)
    .eq("status", "published")
    .in("content_type", ["review", "video", "how_to", "comparison"])
    .order("published_at", { ascending: false })
    .limit(12);

  if (error) throw error;
  return data || [];
};

const LatestInsights = () => {
  const navigate = useNavigate();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["latest-insights"],
    queryFn: fetchLatestInsights,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            Fresh drops
          </p>
          <h2 className="text-3xl font-bold">Latest from the Lab</h2>
          <p className="text-muted-foreground max-w-2xl">
            Recently published reviews, how-tos, and comparison guides. No headline noise, just helpful takes.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
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
              onClick={() => navigate(`/content/${item.slug || item.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-muted/30 p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-primary mx-auto" />
          <p className="text-lg font-semibold">Nothing to show yet</p>
          <p className="text-muted-foreground">
            Publish a review, guide, or video to see it land here.
          </p>
          <Button onClick={() => navigate("/admin/content")} variant="secondary">
            Add new story
          </Button>
        </div>
      )}
    </section>
  );
};

export default LatestInsights;
