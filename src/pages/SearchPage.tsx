import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import NewsModal from '@/components/NewsModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [contentTypeFilter, setContentTypeFilter] = useState(searchParams.get('type') || 'all');
  const [authorFilter, setAuthorFilter] = useState(searchParams.get('author') || 'all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, categoryFilter, contentTypeFilter, authorFilter, dateFrom, dateTo]);

  const fetchFiltersData = async () => {
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);
    
    const { data: auths } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .limit(50);

    setCategories(cats || []);
    setAuthors(auths || []);
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      let searchQuery = supabase
        .from('content')
        .select(`
          *,
          categories(*),
          profiles(*)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
        .order('published_at', { ascending: false });

      if (categoryFilter !== 'all') {
        searchQuery = searchQuery.eq('category_id', categoryFilter);
      }

      if (contentTypeFilter !== 'all') {
        searchQuery = searchQuery.eq('content_type', contentTypeFilter as any);
      }

      if (authorFilter !== 'all') {
        searchQuery = searchQuery.eq('author_id', authorFilter);
      }

      if (dateFrom) {
        searchQuery = searchQuery.gte('published_at', dateFrom.toISOString());
      }

      if (dateTo) {
        searchQuery = searchQuery.lte('published_at', dateTo.toISOString());
      }

      const { data, error } = await searchQuery;

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      performSearch();
    }
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setContentTypeFilter('all');
    setAuthorFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleNewsClick = (newsItem: any) => {
    setSelectedNewsItem(newsItem);
    setIsModalOpen(true);
  };

  const highlightText = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-700">{part}</mark> : 
        part
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Search</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles, reviews, news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content Type</label>
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="review">Reviews</SelectItem>
                      <SelectItem value="how_to">How To</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Author</label>
                  <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All authors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All authors</SelectItem>
                      {authors.map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          {author.full_name || author.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {query && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  {isLoading ? 'Searching...' : `${results.length} results for "${query}"`}
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-video" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((content) => (
                  <ContentCard
                    key={content.id}
                    id={content.id}
                    title={content.title}
                    excerpt={content.excerpt}
                    featuredImage={content.featured_image}
                    contentType={content.content_type}
                    category={content.categories}
                    author={content.profiles}
                    viewsCount={content.views_count || 0}
                    likesCount={content.likes_count || 0}
                    readingTime={content.reading_time}
                    publishedAt={content.published_at}
                    onClick={() => handleNewsClick(content)}
                  />
                ))}
              </div>
            ) : query ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search or filters
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <NewsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          newsItem={selectedNewsItem}
        />
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
