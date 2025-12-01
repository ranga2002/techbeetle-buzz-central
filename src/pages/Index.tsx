
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import CategoryTabs from "@/components/CategoryTabs";
import FeaturedSection from "@/components/FeaturedSection";
import LatestNews from "@/components/LatestNews";
import TrendingArticles from "@/components/TrendingArticles";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const quickLinks = [
    {
      title: "Newsroom",
      description: "Fresh drops and daily briefs straight from the tech desk.",
      to: "/news",
      tone: "from-primary/10 via-primary/5 to-accent/10",
    },
    {
      title: "Review Lab",
      description: "Deep dives on gear that matters, tested and rated.",
      to: "/reviews",
      tone: "from-accent/10 via-primary/5 to-muted/40",
    },
    {
      title: "How-To Studio",
      description: "Step-by-steps that turn tricky setups into easy wins.",
      to: "/how-to",
      tone: "from-muted/40 via-primary/5 to-accent/10",
    },
    {
      title: "Compare Deck",
      description: "Side-by-side breakdowns so you can choose fast.",
      to: "/compare",
      tone: "from-primary/5 via-muted/30 to-accent/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />
      <main className="space-y-12">
        <HeroSection />
        <section className="container mx-auto px-4 -mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${item.tone} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Shortcut
                  </p>
                  <span className="text-sm font-semibold text-primary">→</span>
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
              <FeaturedSection />
              <LatestNews />
              <ProductsSection />
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
