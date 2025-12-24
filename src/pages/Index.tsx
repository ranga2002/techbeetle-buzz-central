
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import LatestNews from "@/components/LatestNews";
import ProductsSection from "@/components/ProductsSection";
import TrendingArticles from "@/components/TrendingArticles";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, MousePointerClick, SlidersHorizontal, BookOpenCheck, Bell, Compass } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const { user } = useAuth();

  const pathways = [
    {
      title: "How-To Studio",
      description: "Step-by-step flows to pick the right laptop, phone, or accessory.",
      to: "/how-to",
      icon: <BookOpenCheck className="w-5 h-5" />,
      pill: "Guided",
    },
    {
      title: "Compare Deck",
      description: "Line up devices side-by-side and choose in minutes.",
      to: "/compare",
      icon: <SlidersHorizontal className="w-5 h-5" />,
      pill: "Fast pick",
    },
    {
      title: "Review Lab",
      description: "Tested takes on gear that matters with real pros/cons.",
      to: "/reviews",
      icon: <Sparkles className="w-5 h-5" />,
      pill: "Trusted",
    },
    {
      title: "Products",
      description: "Curated gadgets with links, specs, and buying advice.",
      to: "/products",
      icon: <MousePointerClick className="w-5 h-5" />,
      pill: "Shop-ready",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <Helmet>
        <title>Tech Beetle | Live Tech Briefings, Reviews, How-Tos & Picks</title>
        <meta
          name="description"
          content="Stay ahead with live tech news, tested reviews, guided how-tos, comparisons, and curated gadget picks tailored to you."
        />
        <link rel="canonical" href="https://techbeetle.org/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TechBeetle | Live Tech Briefings, Reviews, How-Tos & Picks" />
        <meta
          property="og:description"
          content="Live tech headlines, trusted reviews, guided how-tos, and curated gadget picks in one place."
        />
        <meta property="og:url" content="https://techbeetle.org/" />
        <meta property="og:image" content="https://techbeetle.org/assets/logo_main.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tech Beetle | Live Tech Briefings, Reviews, How-Tos & Picks" />
        <meta
          name="twitter:description"
          content="Live tech headlines, trusted reviews, guided how-tos, and curated gadget picks in one place."
        />
        <meta name="twitter:image" content="https://techbeetle.org/assets/logo_main.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "TechBeetle Home",
            url: "https://techbeetle.org/",
            description:
              "Live tech news, reviews, how-to guides, comparisons, and curated gadget picks.",
          })}
        </script>
      </Helmet>
      <Header />
      <main className="space-y-12">
        <HeroSection />

        <section className="container mx-auto px-4">
          <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_25px_90px_-40px_rgba(0,0,0,0.8)]">
            <CardContent className="p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80">Quick start</p>
                <h2 className="text-2xl font-semibold">Pick your track</h2>
                <p className="text-slate-200/80 max-w-2xl">
                  Jump straight to live news, deep reviews, or how-to guides tailored to making faster buying decisions.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                  <Link to="/news">News</Link>
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link to="/reviews">Reviews</Link>
                </Button>
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" asChild>
                  <Link to="/how-to">How-To Guides</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {pathways.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_90px_-40px_rgba(0,0,0,0.8)] backdrop-blur"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="rounded-full text-xs px-3 py-1 bg-white/10 text-white">
                    {item.pill}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">{item.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-200/80 leading-relaxed">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-12">
              <LatestNews />
              <ProductsSection />
              <Card className="border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_25px_90px_-40px_rgba(0,0,0,0.8)]">
                <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80">New</p>
                    <h3 className="text-2xl font-semibold">Guided gadget picks</h3>
                    <p className="text-slate-200/80">
                      Start with the gadget type, drill into OS, brand, and specs. We'll hand you the right how-to.
                    </p>
                  </div>
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                    <Link to={user ? "/how-to" : "/auth"}>
                      {user ? "Launch How-To Flow" : "Sign in to personalize"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <aside className="xl:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                <TrendingArticles />
                {/* <Card className="border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80 mb-1">Discover</p>
                      <h3 className="text-xl font-semibold">Explore by channel</h3>
                      <div className="flex flex-wrap gap-2">
                        <Link to="/videos">
                          <Badge variant="secondary">Videos</Badge>
                        </Link>
                        <Link to="/compare">
                          <Badge variant="secondary">Compare</Badge>
                        </Link>
                        <Link to="/products">
                          <Badge variant="secondary">Products</Badge>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
                  <p className="text-sm uppercase tracking-[0.14em] text-slate-300/80 mb-2">
                    Personalize
                  </p>
                  <h3 className="text-2xl font-semibold mb-2">
                    Tune Tech Beetle to you
                  </h3>
                  <p className="text-slate-200/80 text-sm mb-4">
                    Follow categories, set newsletter cadence, and keep your feed sharp.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={user ? "/preferences" : "/auth"}>
                      {user ? "Update preferences" : "Sign in to personalize"}
                    </Link>
                  </Button>
                </div> */}
                <Card className="border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80 mb-1">Stay updated</p>
                      <h3 className="text-xl font-semibold">Get the briefing</h3>
                      <p className="text-sm text-slate-200/80">
                        Subscribe to quick drops and weekly rundowns tuned to your categories.
                      </p>
                      <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <Link to={user ? "/preferences" : "/auth"}>
                          {user ? "Manage newsletter" : "Sign in to subscribe"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
