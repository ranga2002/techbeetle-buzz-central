
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContentCardProps {
  id: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  contentType: string;
  category?: {
    name: string;
    slug: string;
    color: string;
  };
  author?: {
    full_name: string;
    username: string;
    avatar_url?: string;
  };
  viewsCount: number;
  likesCount: number;
  readingTime?: number;
  publishedAt?: string;
  onClick?: () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  excerpt,
  featuredImage,
  contentType,
  category,
  author,
  viewsCount,
  likesCount,
  readingTime,
  publishedAt,
  onClick,
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      {featuredImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}
      
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <Badge variant="secondary" style={{ backgroundColor: category.color + '20', color: category.color }}>
              {category.name}
            </Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {contentType.replace('_', ' ')}
          </Badge>
        </div>
        
        <h3 className="text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
          {title}
        </h3>
        
        {excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {excerpt}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{viewsCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{likesCount}</span>
            </div>
            {readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {author && (
            <div className="flex items-center gap-2">
              {author.avatar_url && (
                <img
                  src={author.avatar_url}
                  alt={author.full_name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium">{author.full_name}</span>
            </div>
          )}
          
          {publishedAt && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCard;
