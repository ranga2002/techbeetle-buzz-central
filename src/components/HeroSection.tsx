
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContent } from '@/hooks/useContent';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const { useFeaturedContentQuery } = useContent();
  const { data: featuredContent } = useFeaturedContentQuery();
  const mainStory = featuredContent?.[0];

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="inline-flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Latest in Tech
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Your Gateway to the
                <span className="text-gradient block">Tech Universe</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Stay ahead with the latest tech news, in-depth reviews, and expert insights. 
                From smartphones to AI, we cover everything that matters in technology.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group" asChild>
                <Link to="/news">
                  Explore Latest News
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/reviews">Browse Reviews</Link>
              </Button>
            </div>
          </div>

          {mainStory && (
            <div className="relative">
              <div className="card-hover bg-card rounded-2xl p-6 shadow-2xl border">
                <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden">
                  {mainStory.featured_image ? (
                    <img 
                      src={mainStory.featured_image} 
                      alt={mainStory.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">TB</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Badge variant="outline">
                    {mainStory.categories?.name || 'Featured'}
                  </Badge>
                  <h3 className="text-xl font-bold line-clamp-2">
                    {mainStory.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2">
                    {mainStory.excerpt}
                  </p>
                  <Button variant="ghost" className="p-0 h-auto font-semibold">
                    Read More →
                  </Button>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-xl" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
