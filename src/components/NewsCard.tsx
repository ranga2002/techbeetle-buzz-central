import { Badge } from '@/components/ui/badge';
import { Clock, User, MessageCircle, Heart, ArrowRight } from 'lucide-react';

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
  return (
    <article
      className={`bg-card rounded-2xl border border-border overflow-hidden card-hover group ${featured ? 'lg:col-span-2' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className={`${featured ? 'lg:flex lg:items-center' : ''}`}>
        <div className={`relative overflow-hidden ${featured ? 'lg:w-1/2' : 'aspect-[16/10]'}`}>
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${featured ? 'aspect-[16/10] lg:aspect-auto lg:h-80' : ''}`}
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              {category}
            </Badge>
          </div>
          {featured && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
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
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {author}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {publishTime}
            </div>
            <span>{readTime}</span>
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
