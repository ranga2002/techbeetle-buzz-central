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
        "group rounded-3xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_-35px_rgba(0,0,0,0.9)]",
        featured && "lg:col-span-2",
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      <div className={featured ? 'lg:flex lg:items-stretch' : ''}>
        <div
          className={cn(
            "relative overflow-hidden",
            featured ? "lg:w-1/2" : "aspect-[4/3]"
          )}
        >
          <img
            src={image || fallbackImage}
            alt={title}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              featured ? "lg:aspect-auto lg:h-80" : "",
              "group-hover:scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/90 text-primary-foreground shadow rounded-full px-3 py-1 text-xs"
            >
              {category}
            </Badge>
              {featured && (
                <Badge
                  variant="secondary"
                  className="bg-accent/90 text-accent-foreground shadow rounded-full px-3 py-1 text-xs"
                >
                  Featured
                </Badge>
              )}
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-white/80">
              {publishTime}
            </p>
            <h3
              className={cn(
                "mt-1 font-semibold leading-tight line-clamp-2",
                featured ? "text-2xl sm:text-2xl" : "text-lg sm:text-xl"
              )}
            >
              {title}
            </h3>
          </div>
        </div>

        <div className={`p-5 sm:p-6 ${featured ? 'lg:w-1/2' : ''}`}>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80 mb-2">
            {author}
          </p>
          <p
            className={cn(
              "text-slate-200/85 mb-4 line-clamp-3",
              featured ? "text-base lg:text-lg" : "text-sm"
            )}
          >
            {safeExcerpt}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300/80 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-white">{author}</span>
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
            <div className="flex items-center gap-4 text-sm text-slate-300/80">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {comments ?? 0}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {likes ?? 0}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-primary/80 font-semibold group-hover:text-primary/70 group-hover:underline">
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
