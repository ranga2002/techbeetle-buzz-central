
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import LatestInsights from "@/components/LatestInsights";
import ProductsSection from "@/components/ProductsSection";
import TrendingArticles from "@/components/TrendingArticles";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, MousePointerClick, SlidersHorizontal, BookOpenCheck } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />
      <main className="space-y-12">
        <HeroSection />

        <section className="container mx-auto px-4 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {pathways.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="rounded-full text-xs px-3 py-1">
                    {item.pill}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">{item.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-12">
              <LatestInsights />
              <ProductsSection />
              <Card className="border-dashed">
                <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">New</p>
                    <h3 className="text-2xl font-semibold">Guided gadget picks</h3>
                    <p className="text-muted-foreground">
                      Start with the gadget type, drill into OS, brand, and specs. We’ll hand you the right how-to.
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <Link to="/how-to">Launch How-To Flow</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <aside className="xl:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                <TrendingArticles />
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground mb-2">
                    Personalize
                  </p>
                  <h3 className="text-2xl font-semibold mb-2">
                    Tune TechBeetle to you
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Follow categories, set newsletter cadence, and keep your feed sharp.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={user ? "/preferences" : "/auth"}>
                      {user ? "Update preferences" : "Sign in to personalize"}
                    </Link>
                  </Button>
                </div>
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
