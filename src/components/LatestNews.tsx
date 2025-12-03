
import React, { useState, useEffect } from 'react';
import { useContent } from '@/hooks/useContent';
import NewsCard from './NewsCard';
import NewsModal from './NewsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LatestNews = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [country, setCountry] = useState<string>('us');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { useContentQuery, useCategoriesQuery } = useContent();
  const { toast } = useToast();
  
  const { data: content, isLoading } = useContentQuery({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    contentType: 'news',
    limit: 10,
  });
  
  const { data: categories } = useCategoriesQuery();

  // Auto-detect user's city on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Use a reverse geocoding service to get city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            if (data.city) {
              setLocation(data.city);
            }
            if (data.countryCode) {
              setCountry(data.countryCode.toLowerCase());
            }
          }, (error) => {
            console.log('Location detection failed:', error);
            // Fallback to a default city
            setLocation('Toronto');
            const langCountry = navigator.language?.split('-')[1]?.toLowerCase();
            setCountry(langCountry || 'ca');
          });
        } else {
          setLocation('Toronto');
          const langCountry = navigator.language?.split('-')[1]?.toLowerCase();
          setCountry(langCountry || 'ca');
        }
      } catch (error) {
        console.log('Location detection error:', error);
        setLocation('Toronto');
        const langCountry = navigator.language?.split('-')[1]?.toLowerCase();
        setCountry(langCountry || 'us');
      }
    };

    detectLocation();
  }, []);

  // Search functionality
  const performSearch = async () => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for news.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Create search query
      let query = location.trim();
      if (selectedCategory !== 'All') {
        // Find the category name instead of slug
        const categoryName = categories?.find(cat => cat.slug === selectedCategory)?.name || selectedCategory;
        query = `${categoryName} AND ${location.trim()}`;
      }

      console.log('Searching with query:', query);

      // Call the news-router edge function (geo + multi-provider)
      const { data, error } = await supabase.functions.invoke('news-router', {
        headers: { 'x-country': country || 'us' },
        body: { query }
      });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search Failed",
          description: "Failed to fetch news. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Parse the response data
      const articles = data?.items || data?.articles || [];
      const sortedArticles = [...articles].sort((a: any, b: any) => {
        const aDate = new Date(a.published_at || a.publishedAt || "").getTime() || 0;
        const bDate = new Date(b.published_at || b.publishedAt || "").getTime() || 0;
        return bDate - aDate;
      });
      
      setSearchResults(sortedArticles);
      setHasSearched(true);
      
      toast({
        title: "Search Complete",
        description: `Found ${articles.length} articles for "${query}"`,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    // Auto-search when category changes if location is available
    if (location.trim()) {
      setTimeout(() => performSearch(), 100);
    }
  };

  const handleNewsClick = (newsItem: any) => {
    setSelectedNewsItem(newsItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNewsItem(null);
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const sortedContent = content
    ? [...content].sort((a: any, b: any) => {
        const aDate = new Date(a.published_at || "").getTime() || 0;
        const bDate = new Date(b.published_at || "").getTime() || 0;
        return bDate - aDate;
      })
    : [];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
        
        {/* Location Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Enter your city..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
            />
          </div>
          <Button 
            onClick={performSearch} 
            disabled={isSearching || !location.trim()}
            className="min-w-[100px]"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            onClick={() => handleCategoryClick('All')}
            size="sm"
          >
            All
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? 'default' : 'outline'}
              onClick={() => handleCategoryClick(category.slug)}
              size="sm"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Display search results or regular content */}
        {hasSearched ? (
          searchResults?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((item, index) => (
                <NewsCard
                  key={`search-${index}`}
                  title={item.title}
                  excerpt={item.description || item.excerpt || undefined}
                  category={item.source?.name || 'Tech'}
                  author={item.author || 'TechBeetle'}
                  publishTime={item.publishedAt || item.published_at || 'Recently'}
                  readTime={item.reading_time ? `${item.reading_time} min read` : '5 min read'}
                  image={item.urlToImage || item.featured_image || ''}
                  onClick={() => handleNewsClick(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No articles found for your search.</p>
              <p className="text-sm text-muted-foreground mt-2">Try a different location or category.</p>
            </div>
          )
        ) : (
          sortedContent?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedContent.map((item) => (
                <NewsCard
                  key={item.id}
                  title={item.title}
                  excerpt={item.excerpt || undefined}
                  category={item.categories?.name || 'Tech'}
                  author={item.profiles?.full_name || item.profiles?.username || 'TechBeetle'}
                  publishTime={item.published_at || 'Recently'}
                  readTime={item.reading_time ? `${item.reading_time} min read` : '5 min read'}
                  image={item.featured_image || ''}
                  onClick={() => handleNewsClick(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No content available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Try searching for news in your area.</p>
            </div>
          )
        )}
        
        <NewsModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          newsItem={selectedNewsItem}
        />
      </div>
    </section>
  );
};

export default LatestNews;
