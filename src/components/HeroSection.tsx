import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContent } from '@/hooks/useContent';
import { ArrowRight, Flame, Sparkle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const { useFeaturedContentQuery } = useContent();
  const { data: featuredContent } = useFeaturedContentQuery();
  const mainStory = featuredContent?.[0];
  const signal = [
    { label: "Daily drops", value: "24", footnote: "New pieces this week" },
    { label: "Reviews lab", value: "4.6", footnote: "Avg rating across latest gear" },
    { label: "Community", value: "12k+", footnote: "Readers tuning in monthly" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 top-10 w-64 h-64 bg-primary/15 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-72 h-72 bg-accent/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Flame className="w-4 h-4" />
              On the wire now
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-tight">
                Navigate the noise,
                <span className="text-gradient block">get the signal in tech.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                Curated headlines, hands-on reviews, and comparisons built for people who want
                to decide faster, whether you are tracking AI, wearables, or the next drop.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group" asChild>
                <Link to="/news">
                  Dive into today's briefing
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/products">See our gear picks</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {signal.map((item) => (
                <div key={item.label} className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1">
                    {item.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{item.value}</span>
                    <Sparkle className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.footnote}</p>
                </div>
              ))}
            </div>
          </div>

          {mainStory && (
            <div className="relative">
              <div className="card-hover rounded-3xl border bg-card shadow-2xl overflow-hidden">
                <div className="relative aspect-video w-full">
                  {mainStory.featured_image ? (
                    <img
                      src={mainStory.featured_image}
                      alt={mainStory.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">TB</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
                  {mainStory.categories?.name && (
                    <Badge className="absolute left-4 top-4">
                      {mainStory.categories.name}
                    </Badge>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    Featured story
                  </p>
                  <h3 className="text-2xl font-semibold leading-snug">
                    {mainStory.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3">
                    {mainStory.excerpt}
                  </p>
                  <Button variant="ghost" className="p-0 h-auto font-semibold" asChild>
                    <Link to={`/news/${mainStory.slug || ""}`} className="inline-flex items-center gap-2">
                      Read the story
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="absolute -top-8 -right-6 w-28 h-28 bg-accent/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary/25 rounded-full blur-3xl" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
