import { useTrendingArticles } from "@/hooks/useTrendingArticles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Heart, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const TrendingArticles = () => {
  const { data: trending, isLoading } = useTrendingArticles();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!trending || trending.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trending.map((article, index) => (
          <div
            key={article.id}
            className="group flex gap-4 p-3 rounded-lg border border-border/50 bg-background/50 transition-all cursor-pointer"
            onClick={() => navigate(`/content/${article.slug || article.id}`)}
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">#{index + 1}</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                {article.categories && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${article.categories.color}20`, color: article.categories.color }}
                  >
                    {article.categories.name}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {article.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.reading_time || 5}m
                </span>
              </div>
            </div>

            {article.featured_image && (
              <div className="flex-shrink-0">
                <img 
                  src={article.featured_image} 
                  alt={article.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrendingArticles;
