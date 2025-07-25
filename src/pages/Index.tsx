
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContentCard from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState('');
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect user location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location using browser geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Use reverse geocoding to get city name
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                const city = data.city || data.locality || '';
                if (city) {
                  setLocation(city);
                }
              } catch (error) {
                console.log('Failed to get city name from coordinates');
              }
            },
            (error) => {
              console.log('Geolocation failed:', error);
            },
            { timeout: 5000 }
          );
        }
      } catch (error) {
        console.log('Location detection failed:', error);
      }
    };

    detectLocation();
  }, []);

  const handleSearch = async () => {
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a location to search for news",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { location: location.trim() }
      });

      if (error) throw error;

      // Fetch the newly added news articles from the database
      const { data: articles, error: fetchError } = await supabase
        .from('content')
        .select(`
          *,
          categories(*),
          profiles(*)
        `)
        .eq('content_type', 'news')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      setNewsArticles(articles || []);
      
      toast({
        title: "News updated!",
        description: data.message || "Successfully fetched location-based news",
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        {/* Location Search Section */}
        <section className="py-8 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Local Tech News</h2>
              <p className="text-muted-foreground mb-6">
                Get the latest technology news relevant to your location
              </p>
              <div className="flex gap-4 max-w-lg mx-auto">
                <Input
                  placeholder="Enter your city (e.g., New York, London)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* News Results Section */}
        {(isLoading || newsArticles.length > 0) && (
          <section className="py-8">
            <div className="container mx-auto px-4">
              <h3 className="text-xl font-semibold mb-6">
                {location && `Tech News for ${location}`}
              </h3>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-video" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newsArticles.map((article) => (
                    <ContentCard
                      key={article.id}
                      id={article.id}
                      title={article.title}
                      excerpt={article.excerpt || undefined}
                      featuredImage={article.featured_image || undefined}
                      contentType={article.content_type}
                      category={article.categories as any}
                      author={article.profiles as any}
                      viewsCount={article.views_count || 0}
                      likesCount={article.likes_count || 0}
                      readingTime={article.reading_time || undefined}
                      publishedAt={article.published_at || undefined}
                      onClick={() => console.log('Article clicked:', article.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
