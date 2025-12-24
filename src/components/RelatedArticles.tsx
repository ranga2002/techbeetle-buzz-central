import { useContent } from '@/hooks/useContent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface RelatedArticlesProps {
  currentArticleId: string;
  categoryId?: string;
}

export const RelatedArticles = ({ currentArticleId, categoryId }: RelatedArticlesProps) => {
  const { useContentQuery } = useContent();
  const { data: articles = [] } = useContentQuery({
    category: categoryId,
    limit: 4,
  });

  const relatedArticles = articles
    .filter(article => article.id !== currentArticleId)
    .slice(0, 3);

  if (relatedArticles.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-8 bg-primary rounded-full" />
        Related News
      </h3>
      
      <div className="grid gap-6 md:grid-cols-3">
        {relatedArticles.map((article) => (
          <Link
            key={article.id}
            to={article.slug ? `/news/${article.slug}` : "/news"}
            className="block group"
          >
            <Card 
              className="overflow-hidden cursor-pointer card-hover border-border/50 h-full"
            >
              {article.featured_image && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={article.featured_image} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {article.categories && (
                    <Badge 
                      className="absolute top-3 left-3"
                      style={{ 
                        backgroundColor: article.categories.color, 
                        color: 'white' 
                      }}
                    >
                      {article.categories.name}
                    </Badge>
                  )}
                </div>
              )}
              
              <CardContent className="p-5 space-y-3">
                <h4 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {article.published_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                    </div>
                  )}
                  {article.views_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views_count}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
