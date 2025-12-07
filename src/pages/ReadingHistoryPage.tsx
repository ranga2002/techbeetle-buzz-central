import { useAuth } from "@/contexts/AuthContext";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const ReadingHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { useReadingHistoryQuery, useRecommendationsQuery } = useReadingHistory(user?.id);
  
  const { data: history, isLoading: historyLoading } = useReadingHistoryQuery();
  const { data: recommendations, isLoading: recommendationsLoading } = useRecommendationsQuery();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Reading History | TechBeetle</title>
          <meta name="description" content="Sign in to see your reading history and recommendations." />
        </Helmet>
        <Header />
        <main className="container mx-auto px-4 py-8 text-center space-y-4">
          <History className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">Sign in to view your reading history</h1>
          <p className="text-muted-foreground">Track what you have read and get personalized picks.</p>
          <button
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition"
            onClick={() => navigate("/auth")}
          >
            Go to sign in
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Reading History | TechBeetle</title>
        <meta name="description" content="Track your reading history and get personalized recommendations on TechBeetle." />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your Reading Journey
          </h1>
          <p className="text-muted-foreground">
            Track your reading history and discover personalized recommendations
          </p>
        </div>

        {/* Reading History */}
        <section className="mb-12">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recently Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : !history || history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reading history yet</h3>
                  <p className="text-muted-foreground">
                    Start reading articles to see them appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((article) => (
                    <ContentCard 
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      excerpt={article.excerpt || ''}
                      featuredImage={article.featured_image || ''}
                      contentType={article.content_type}
                      category={article.categories}
                      viewsCount={article.views_count || 0}
                      likesCount={article.likes_count || 0}
                      readingTime={article.reading_time || 5}
                      publishedAt={article.published_at || ''}
                      onClick={() => window.location.href = `/news/${article.slug}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recommendations */}
        <section>
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recommended For You
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : !recommendations || recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground">
                    Read more articles to get personalized recommendations
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((article) => (
                    <ContentCard 
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      excerpt={article.excerpt || ''}
                      featuredImage={article.featured_image || ''}
                      contentType={article.content_type}
                      category={article.categories}
                      viewsCount={article.views_count || 0}
                      likesCount={article.likes_count || 0}
                      readingTime={article.reading_time || 5}
                      publishedAt={article.published_at || ''}
                      onClick={() => window.location.href = `/news/${article.slug}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ReadingHistoryPage;
