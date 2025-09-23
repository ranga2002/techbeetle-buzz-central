
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import CategoryTabs from "@/components/CategoryTabs";
import FeaturedSection from "@/components/FeaturedSection";
import LatestNews from "@/components/LatestNews";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProductsSection />
        <CategoryTabs />
        <FeaturedSection />
        <LatestNews />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
