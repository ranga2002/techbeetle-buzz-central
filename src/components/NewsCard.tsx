import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsCardProps {
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

  return (
    <article
      className={cn(
        "bg-card rounded-2xl border border-border overflow-hidden card-hover group shadow-sm",
        featured && "lg:col-span-2"
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className={`${featured ? 'lg:flex lg:items-center' : ''}`}>
        <div className={`relative overflow-hidden ${featured ? 'lg:w-1/2' : 'aspect-[16/10]'}`}>
          <img
            src={image || fallbackImage}
            alt={title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${featured ? 'aspect-[16/10] lg:aspect-auto lg:h-80' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground shadow">
              {category}
            </Badge>
          </div>
          {featured && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-accent/90 text-accent-foreground shadow">
                Featured
              </Badge>
            </div>
          )}
        </div>
        
        <div className={`p-6 ${featured ? 'lg:w-1/2' : ''}`}>
          <h3 className={`font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors ${featured ? 'text-2xl lg:text-3xl' : 'text-lg'}`}>
            {title}
          </h3>
          
          <p className={`text-muted-foreground mb-4 line-clamp-3 ${featured ? 'text-base lg:text-lg' : 'text-sm'}`}>
            {excerpt}
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
                {comments}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {likes}
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
