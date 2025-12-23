
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useContent } from '@/hooks/useContent';
import NewsCard from './NewsCard';
import NewsModal from './NewsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatLocalTime, pickTimeZone } from '@/lib/time';
import { dedupeNewsItems } from '@/lib/news';

const GEO_CITY_KEY = 'tb_geo_city';
const GEO_COUNTRY_KEY = 'tb_geo_country';
const GEO_COUNTRY_NAME_KEY = 'tb_geo_country_name';

const countryNameFromCode = (code?: string | null) => {
  if (!code) return null;
  try {
    const formatter =
      typeof Intl !== 'undefined' && (Intl as any).DisplayNames
        ? new (Intl as any).DisplayNames(['en'], { type: 'region' })
        : null;
    return (formatter?.of(code.toUpperCase()) as string | undefined) || code.toUpperCase();
  } catch (_e) {
    return code.toUpperCase();
  }
};

const LatestNews = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [country, setCountry] = useState<string>('us');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState(false);
  
  const { useContentQuery, useCategoriesQuery } = useContent();
  const { toast } = useToast();
  
  const {
    data: content,
    isLoading,
    isError,
    error,
  } = useContentQuery({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    contentType: 'news',
    isIndexable: true,
    limit: 9,
  }, {
    refetchInterval: 120000, // keep homepage fresh every 2 minutes
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });
  
  const { data: categories, isError: categoriesError } = useCategoriesQuery();
  const hasError = isError || categoriesError;

  const sortedContent = useMemo(() => {
    if (!content) return [];
    return dedupeNewsItems(content).sort((a: any, b: any) => {
      const aDate = new Date(a.published_at || "").getTime() || 0;
      const bDate = new Date(b.published_at || "").getTime() || 0;
      return bDate - aDate;
    });
  }, [content]);

  // Auto-detect user's location (country-first) on component mount
  useEffect(() => {
    // Reuse saved location to avoid extra prompts if the user already granted access.
    const storedCountryName = typeof window !== 'undefined' ? localStorage.getItem(GEO_COUNTRY_NAME_KEY) : null;
    const storedCity = typeof window !== 'undefined' ? localStorage.getItem(GEO_CITY_KEY) : null;
    const storedCountry = typeof window !== 'undefined' ? localStorage.getItem(GEO_COUNTRY_KEY) : null;
    const displayLocation =
      storedCountryName ||
      (storedCountry ? countryNameFromCode(storedCountry) : null) ||
      storedCity ||
      null;

    if (displayLocation) {
      setLocation(displayLocation);
      if (storedCountry && !storedCountryName && typeof window !== 'undefined') {
        localStorage.setItem(GEO_COUNTRY_NAME_KEY, displayLocation);
      }
    }
    if (storedCountry) setCountry(storedCountry);
    if (displayLocation && storedCountry) return;

    const detectLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Use a reverse geocoding service to get country name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            const countryCode = data.countryCode?.toLowerCase();
            const countryName = data.countryName || countryNameFromCode(countryCode);

            if (countryCode) {
              setCountry(countryCode);
              localStorage.setItem(GEO_COUNTRY_KEY, countryCode);
            }
            if (countryName) {
              setLocation(countryName);
              localStorage.setItem(GEO_COUNTRY_NAME_KEY, countryName);
              localStorage.setItem(GEO_CITY_KEY, countryName);
            } else if (data.city) {
              setLocation(data.city);
              localStorage.setItem(GEO_CITY_KEY, data.city);
            }
          }, (error) => {
            console.log('Location detection failed:', error);
            const langCountry = navigator.language?.split('-')[1]?.toLowerCase();
            const resolvedCountry = langCountry || 'ca';
            const resolvedCountryName = countryNameFromCode(resolvedCountry) || resolvedCountry.toUpperCase();
            setLocation(resolvedCountryName);
            setCountry(resolvedCountry);
            localStorage.setItem(GEO_CITY_KEY, resolvedCountryName);
            localStorage.setItem(GEO_COUNTRY_KEY, resolvedCountry);
            localStorage.setItem(GEO_COUNTRY_NAME_KEY, resolvedCountryName);
          });
        } else {
          const langCountry = navigator.language?.split('-')[1]?.toLowerCase();
          const resolvedCountry = langCountry || 'ca';
          const resolvedCountryName = countryNameFromCode(resolvedCountry) || resolvedCountry.toUpperCase();
          setLocation(resolvedCountryName);
          setCountry(resolvedCountry);
          localStorage.setItem(GEO_CITY_KEY, resolvedCountryName);
          localStorage.setItem(GEO_COUNTRY_KEY, resolvedCountry);
          localStorage.setItem(GEO_COUNTRY_NAME_KEY, resolvedCountryName);
        }
      } catch (error) {
        console.log('Location detection error:', error);
        const langCountry = navigator.language?.split('-')[1]?.toLowerCase();
        const resolvedCountry = langCountry || 'us';
        const resolvedCountryName = countryNameFromCode(resolvedCountry) || resolvedCountry.toUpperCase();
        setLocation(resolvedCountryName);
        setCountry(resolvedCountry);
        localStorage.setItem(GEO_CITY_KEY, resolvedCountryName);
        localStorage.setItem(GEO_COUNTRY_KEY, resolvedCountry);
        localStorage.setItem(GEO_COUNTRY_NAME_KEY, resolvedCountryName);
      }
    };

    detectLocation();
  }, []);

  const fetchNewsForQuery = useCallback(
    async (query: string) => {
      const { data, error } = await supabase.functions.invoke('news-router', {
        headers: { 'x-country': country || 'us' },
        body: { query },
      });

      if (error) throw error;

      const articles = data?.items || data?.articles || [];
      const sortedArticles = [...articles].sort((a: any, b: any) => {
        const aDate = new Date(a.published_at || a.publishedAt || "").getTime() || 0;
        const bDate = new Date(b.published_at || b.publishedAt || "").getTime() || 0;
        return bDate - aDate;
      });

      return dedupeNewsItems(sortedArticles);
    },
    [country]
  );

  // Search functionality with graceful fallbacks
  const performSearch = useCallback(async () => {
    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter a country or city to search for news.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setAutoSearchTriggered(true);

    try {
      const categoryName =
        selectedCategory !== 'All'
          ? categories?.find((cat) => cat.slug === selectedCategory)?.name || selectedCategory
          : null;

      const primaryQuery = categoryName ? `${categoryName} AND ${location.trim()}` : location.trim();
      const primaryResults = await fetchNewsForQuery(primaryQuery);

      if (primaryResults.length === 0) {
        // Try a broader, country-level query before giving up.
        const fallbackQuery = `${country?.toUpperCase() || 'US'} technology`;
        const fallbackResults = await fetchNewsForQuery(fallbackQuery);

        if (fallbackResults.length) {
          setSearchResults(fallbackResults);
          setHasSearched(true);
          toast({
            title: "Showing nearby tech headlines",
            description: `No matches for "${location.trim()}". Showing top ${country?.toUpperCase() || 'US'} stories instead.`,
          });
        } else if (sortedContent.length) {
          setSearchResults(sortedContent);
          setHasSearched(true);
          toast({
            title: "No local matches yet",
            description: `Showing the latest Tech Beetle headlines while we look for "${location.trim()}".`,
          });
        } else {
          setSearchResults([]);
          setHasSearched(true);
          toast({
            title: "No articles found",
            description: `Try a nearby city or a broader keyword than "${location.trim()}".`,
            variant: "destructive",
          });
        }
        return;
      }

      setSearchResults(primaryResults);
      setHasSearched(true);
      toast({
        title: "Search complete",
        description: `Found ${primaryResults.length} article${primaryResults.length === 1 ? '' : 's'} for "${primaryQuery}"`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [categories, country, fetchNewsForQuery, location, selectedCategory, sortedContent, toast]);

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

  // If we have no CMS content, automatically run a search once location is known.
  useEffect(() => {
    if (autoSearchTriggered || isSearching) return;
    if (location && sortedContent.length === 0) {
      performSearch();
      setAutoSearchTriggered(true);
    }
  }, [autoSearchTriggered, isSearching, location, performSearch, sortedContent.length]);

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Latest News</h2>

        {hasError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            We couldn't load the latest headlines right now. Please retry or check back shortly.
            {error && typeof error === 'object' && 'message' in error && (
              <span className="ml-1 text-xs opacity-80">{(error as any).message}</span>
            )}
          </div>
        )}
        
        {/* Location Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Enter your country or city..."
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
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {searchResults.map((item, index) => {
                const excerpt = item.summary || item.description || item.excerpt || "";
                const categoryLabel = item.source_name || item.source?.name || item.categories?.name || 'Tech';
                const authorLabel =
                  item.author ||
                  item.profiles?.full_name ||
                  item.profiles?.username ||
                  item.source_name ||
                  'TechBeetle';
                const publishTime = item.publishedAt || item.published_at || 'Recently';
                const readTime = item.reading_time ? `${item.reading_time} min read` : '5 min read';
                const image = item.featured_image || item.image || item.urlToImage || '';

                const publishedLabel = formatLocalTime(
                  publishTime,
                  pickTimeZone(item.source_country || item.categories?.country)
                );

                return (
                  <NewsCard
                    key={`search-${index}`}
                    title={item.title}
                    excerpt={excerpt}
                    category={categoryLabel}
                    author={authorLabel}
                    publishTime={publishedLabel}
                    readTime={readTime}
                    image={image}
                    onClick={() => handleNewsClick(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No articles found for your search.</p>
              <p className="text-sm text-muted-foreground mt-2">Try a different location or category.</p>
            </div>
          )
        ) : (
          sortedContent?.length ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedContent.map((item) => {
                  const publishedLabel = formatLocalTime(
                    item.published_at,
                    pickTimeZone(item.source_country || item.categories?.country)
                  );
                  return (
                    <NewsCard
                      key={item.id}
                      title={item.title}
                      excerpt={item.excerpt || undefined}
                      category={item.categories?.name || 'Tech'}
                      author={item.profiles?.full_name || item.profiles?.username || 'TechBeetle'}
                      publishTime={publishedLabel}
                      readTime={item.reading_time ? `${item.reading_time} min read` : '5 min read'}
                      image={item.featured_image || ''}
                      onClick={() => handleNewsClick(item)}
                    />
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button asChild>
                  <a href="/news">View More</a>
                </Button>
              </div>
            </>
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
