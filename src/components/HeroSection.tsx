
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, ArrowRight } from 'lucide-react';

const HeroSection = () => {
  const heroNews = {
    title: "Apple Vision Pro 2 Rumors: Everything We Know About the Next-Gen Mixed Reality Headset",
    excerpt: "From improved displays to lighter design, here's what industry insiders are saying about Apple's upcoming Vision Pro successor that could reshape the AR/VR landscape.",
    category: "Apple",
    author: "Sarah Chen",
    publishTime: "2 hours ago",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1592478411213-6153e4ebc696?q=80&w=2012&auto=format&fit=crop",
  };

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              🔥 Trending Now
            </Badge>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              {heroNews.title}
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              {heroNews.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline" className="border-accent text-accent">
                {heroNews.category}
              </Badge>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {heroNews.author}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {heroNews.publishTime}
              </div>
              <span>{heroNews.readTime}</span>
            </div>
            
            <Button size="lg" className="group glow">
              Read Full Story
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden glow">
              <img
                src={heroNews.image}
                alt={heroNews.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
