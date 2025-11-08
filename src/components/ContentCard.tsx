
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
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50" onClick={onClick}>
      {featuredImage && (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-60" />
          
          {/* Category badge on image */}
          {category && (
            <Badge 
              className="absolute top-4 left-4 shadow-lg" 
              style={{ backgroundColor: category.color, color: 'white' }}
            >
              {category.name}
            </Badge>
          )}
        </div>
      )}
      
      <CardContent className="p-6 space-y-4">
        {/* Title with better typography */}
        <h3 className="text-2xl font-bold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {title}
        </h3>
        
        {/* Excerpt with reading-focused styling */}
        {excerpt && (
          <p className="text-muted-foreground leading-relaxed line-clamp-3 text-base">
            {excerpt}
          </p>
        )}

        {/* Metadata bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.full_name}
                    className="w-7 h-7 rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {author.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium text-foreground">{author.full_name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{readingTime} min</span>
              </div>
            )}
            {publishedAt && (
              <span className="text-xs">
                {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCard;
