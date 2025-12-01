import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  className?: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishTime: string;
  readTime: string;
  image: string;
  comments?: number;
  likes?: number;
  featured?: boolean;
  onClick?: () => void;
}

const NewsCard = ({ 
  className,
  title, 
  excerpt, 
  category, 
  author, 
  publishTime, 
  readTime, 
  image, 
  comments = 0, 
  likes = 0, 
  featured = false,
  onClick
}: NewsCardProps) => {
  const fallbackImage = "https://placehold.co/800x450?text=Tech+Beetle";
  const safeExcerpt = excerpt || "Catch the latest on gadgets, AI, and the next big thing.";

  return (
    <article
      className={cn(
        "bg-card rounded-2xl border border-border overflow-hidden card-hover group shadow-sm transition-all",
        featured && "lg:col-span-2",
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className={featured ? 'lg:flex lg:items-center' : ''}>
        <div className={cn(
          "relative overflow-hidden",
          featured ? "lg:w-1/2" : "aspect-[4/3]"
        )}>
          <img
            src={image || fallbackImage}
            alt={title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              featured ? "lg:aspect-auto lg:h-80" : "",
              "group-hover:scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <Badge
            variant="secondary"
            className="absolute top-4 left-4 bg-primary/90 text-primary-foreground shadow rounded-full px-3 py-1 text-xs"
          >
            {category}
          </Badge>
          {featured && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-accent/90 text-accent-foreground shadow rounded-full px-3 py-1 text-xs">
                Featured
              </Badge>
            </div>
          )}
        </div>
        
        <div className={`p-6 ${featured ? 'lg:w-1/2' : ''}`}>
          <h3 className={cn(
            "font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors",
            featured ? "text-2xl lg:text-3xl" : "text-lg"
          )}>
            {title}
          </h3>
          
          <p className={cn(
            "text-muted-foreground mb-4 line-clamp-3",
            featured ? "text-base lg:text-lg" : "text-sm"
          )}>
            {safeExcerpt}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-foreground">{author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{publishTime}</span>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full">
              {readTime}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {comments ?? 0}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {likes ?? 0}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-primary font-medium group-hover:underline">
              Read more
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
