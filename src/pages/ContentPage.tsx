import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Clock, ArrowLeft, Sparkles } from "lucide-react";
import { useContent } from "@/hooks/useContent";

const fallbackImage = "https://placehold.co/1200x630?text=TechBeetle";

const ContentPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { useContentQuery, incrementViews } = useContent();

  const { data, isLoading } = useContentQuery({
    slug,
    status: "published",
  });

  const article = data?.[0];

  useEffect(() => {
    if (article?.id) {
      incrementViews.mutate(article.id);
    }
  }, [article?.id, incrementViews]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-80 w-full" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-muted-foreground">No story found.</p>
          <Button onClick={() => navigate(-1)}>Go back</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const publishedLabel = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : "Just now";
  const image = article.featured_image || fallbackImage;
  const bodyHtml = article.content || article.content_raw || article.excerpt || "<p>No content yet.</p>";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {article.content_type ? article.content_type.replace("_", " ") : "content"}
          </span>
        </div>

        <article className="space-y-6">
          <div className="space-y-3">
            {article.categories?.name && (
              <Badge
                variant="secondary"
                className="w-fit"
                style={{ backgroundColor: article.categories.color, color: "#fff" }}
              >
                {article.categories.name}
              </Badge>
            )}
            <h1 className="text-4xl font-bold leading-tight">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.profiles?.full_name && (
                <span className="font-semibold text-foreground">{article.profiles.full_name}</span>
              )}
              <div className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{publishedLabel}</span>
              </div>
              {article.reading_time && <span>{article.reading_time} min read</span>}
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border">
            <img src={image} alt={article.title} className="w-full h-[420px] object-cover" />
          </div>

          {article.excerpt && (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="p-6">
                <p className="text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
              </CardContent>
            </Card>
          )}

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90">
            <div
              dangerouslySetInnerHTML={{
                __html: bodyHtml,
              }}
            />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ContentPage;
