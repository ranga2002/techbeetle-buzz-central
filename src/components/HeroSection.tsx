import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContent } from '@/hooks/useContent';
import { ArrowRight, Flame, Sparkle, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const resolveStoryPath = (story?: any) => {
  if (!story) return "/news";
  const slug = story.slug ? `/${story.slug}` : "";

  switch (story.content_type) {
    case "review":
      return slug ? `/reviews${slug}` : "/reviews";
    case "product":
      return slug ? `/products${slug}` : "/products";
    case "news":
      return slug ? `/news${slug}` : "/news";
    case "video":
      return "/videos";
    case "how_to":
      return "/how-to";
    case "comparison":
      return "/compare";
    default:
      return slug || "/news";
  }
};

const HeroSection = () => {
  const { useFeaturedContentQuery } = useContent();
  const { data: featuredContent } = useFeaturedContentQuery();
  const [featuredIndex, setFeaturedIndex] = React.useState(0);

  // Rotate through featured stories every 15 seconds so the hero stays fresh.
  React.useEffect(() => {
    if (!featuredContent?.length) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredContent.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [featuredContent]);

  // Reset the index whenever the featured list changes.
  React.useEffect(() => {
    setFeaturedIndex(0);
  }, [featuredContent?.length]);

  const mainStory = featuredContent?.[featuredIndex];
  const storyPath = resolveStoryPath(mainStory);
  const navigate = useNavigate();
  const signal = [
    { label: "Daily drops", value: "24", footnote: "New pieces this week" },
    { label: "Reviews lab", value: "4.6", footnote: "Avg rating across latest gear" },
    { label: "Community", value: "12k+", footnote: "Readers tuning in monthly" },
  ];

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-20 w-[30rem] h-[30rem] bg-primary/20 blur-[150px]" />
        <div className="absolute right-[-10%] top-10 w-[36rem] h-[32rem] bg-cyan-400/12 blur-[180px]" />
        <div className="absolute left-1/3 bottom-10 w-80 h-80 bg-emerald-400/10 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%)]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-14 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-primary/90 ring-1 ring-white/10 shadow-lg shadow-primary/30 backdrop-blur">
              <Flame className="w-4 h-4" />
              Live signal brief
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black leading-tight tracking-tight">
                Navigate the noise,
                <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-cyan-300 bg-clip-text text-transparent">
                  get the signal in tech!!
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-200/80 leading-relaxed max-w-3xl">
                Curated headlines, hands-on reviews, and comparisons built for people who want
                to decide faster—whether you are tracking AI, wearables, or the next drop.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-base font-semibold shadow-lg shadow-primary/30"
                asChild
              >
                <Link to="/news">
                  Dive into today's briefing
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link to="/products">See our gear picks</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {signal.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_70px_-35px_rgba(0,0,0,0.8)] backdrop-blur-lg"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80 mb-1">
                    {item.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{item.value}</span>
                    <Sparkle className="w-4 h-4 text-primary/80" />
                  </div>
                  <p className="text-xs text-slate-300/80 mt-1">{item.footnote}</p>
                </div>
              ))}
            </div>
          </div>

          {mainStory && (
            <Link
              to={storyPath}
              className="group relative block rounded-[28px] border border-white/10 bg-white/5 shadow-[0_25px_90px_-30px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-xl"
            >
              <div className="relative aspect-[4/3] w-full max-w-lg mx-auto min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]">
                {mainStory.featured_image ? (
                  <img
                    src={mainStory.featured_image}
                    alt={mainStory.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center rounded-[24px]">
                    <span className="text-4xl font-bold text-slate-300">TB</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                {mainStory.categories?.name && (
                  <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    {mainStory.categories.name}
                  </Badge>
                )}
                {mainStory.content_type && (
                  <Badge className="absolute right-4 top-4 bg-white/20 text-white border border-white/30">
                    {mainStory.content_type}
                  </Badge>
                )}
              </div>
              <div className="p-6 sm:p-7 lg:p-8 space-y-3 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/80">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-slate-300/80">
                  <span className="inline-flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Featured story
                  </span>
                  <span className="text-emerald-300/90">Updated live</span>
                </div>
                <h3 className="text-2xl font-semibold leading-snug text-white">
                  {mainStory.title}
                </h3>
                <p className="text-slate-200/80 line-clamp-3">
                  {mainStory.excerpt}
                </p>
                <div className="inline-flex items-center gap-2 font-semibold text-primary/80 transition-transform group-hover:translate-x-1">
                  Read the story
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
