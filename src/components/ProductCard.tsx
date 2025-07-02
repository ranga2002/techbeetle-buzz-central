
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, Star, ShoppingCart, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProductCardProps {
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
  rating?: number;
  price?: number;
  purchaseLinks?: Array<{
    retailer_name: string;
    product_url: string;
    price: number;
    is_primary: boolean;
  }>;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
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
  rating,
  price,
  purchaseLinks,
  onClick,
}) => {
  const primaryLink = purchaseLinks?.find(link => link.is_primary) || purchaseLinks?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      {featuredImage && (
        <div className="aspect-video overflow-hidden relative">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {rating && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
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
          {contentType === 'review' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Review
            </Badge>
          )}
        </div>
        
        <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        {excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {excerpt}
          </p>
        )}

        {price && (
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-green-600">
              ${price.toLocaleString()}
            </div>
            {primaryLink && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(primaryLink.product_url, '_blank');
                }}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                {primaryLink.retailer_name}
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
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
              <span>{readingTime} min read</span>
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

        {purchaseLinks && purchaseLinks.length > 1 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Compare prices:</div>
            <div className="flex flex-wrap gap-1">
              {purchaseLinks.slice(0, 3).map((link, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(link.product_url, '_blank');
                  }}
                >
                  {link.retailer_name}: ${link.price}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
