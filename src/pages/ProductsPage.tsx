import React, { useEffect, useMemo, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const ProductsPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    minRating: 0,
    maxPrice: 5000,
  });
  const [currency, setCurrency] = useState<'USD' | 'CAD' | 'INR'>('USD');
  const [rates, setRates] = useState<{ [k: string]: number }>({ USD: 1 });
  const [loadingRates, setLoadingRates] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);

  const { useProductCatalogQuery } = useProducts();
  const { data: products, isLoading } = useProductCatalogQuery(filters);

  useEffect(() => {
    const region = (Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] || 'US').toUpperCase();
    const mappedCurrency = region === 'CA' ? 'CAD' : region === 'IN' ? 'INR' : 'USD';
    setCurrency(mappedCurrency as any);
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      setLoadingRates(true);
      try {
        const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=USD,CAD,INR');
        const json = await res.json();
        if (json?.rates) {
          setRates(json.rates);
          setFxError(null);
        }
      } catch (e) {
        console.error('Failed to load rates', e);
        setFxError('Live currency rates unavailable. Showing USD.');
        setCurrency('USD');
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  const convertedProducts = useMemo(() => {
    if (!products) return [];
    const rate = rates[currency] || 1;
    return products.map((p) => {
      const primaryLink = p.purchase_links?.find((link) => link.is_primary) || p.purchase_links?.[0];
      const basePrice = primaryLink?.price ?? p.inventory?.price ?? undefined;
      const convertedPrice = basePrice !== undefined ? basePrice * rate : undefined;
      const formattedPrice =
        convertedPrice !== undefined
          ? new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: currency,
              maximumFractionDigits: 0,
            }).format(convertedPrice)
          : undefined;
      return { ...p, convertedPrice, formattedPrice };
    });
  }, [products, rates, currency]);

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category: category === 'all' ? '' : category }));
  };

  const handleRatingChange = (rating: number[]) => {
    setFilters(prev => ({ ...prev, minRating: rating[0] }));
  };

  const handlePriceChange = (price: number[]) => {
    setFilters(prev => ({ ...prev, maxPrice: price[0] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Products | TechBeetle</title>
        <meta
          name="description"
          content="Browse curated tech products with ratings, prices, and purchase links. Filter by category, rating, and budget."
        />
        <link rel="canonical" href="https://techbeetle.org/products" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Products | TechBeetle" />
        <meta
          property="og:description"
          content="Curated gadget picks with reviews, ratings, and purchase links."
        />
        <meta property="og:image" content="https://techbeetle.org/favicon.ico" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Products | TechBeetle" />
        <meta
          name="twitter:description"
          content="Curated gadget picks with reviews, ratings, and purchase links."
        />
        <meta name="twitter:image" content="https://techbeetle.org/favicon.ico" />
      </Helmet>
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Recommended Products
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the best tech products with our expert reviews and affiliate recommendations.
              Find your perfect match with detailed comparisons and honest insights.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Filter Products</h3>
            </div>

            {fxError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">
                {fxError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="smartphones">Smartphones</SelectItem>
                    <SelectItem value="laptops">Laptops</SelectItem>
                    <SelectItem value="wearables">Wearables</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Rating</label>
                <div className="px-2">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={handleRatingChange}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex items-center justify-center mt-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-sm">{filters.minRating}+ rating</span>
                  </div>
                </div>
              </div>

              {/* Price Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Price</label>
                <div className="px-2">
                  <Slider
                    value={[filters.maxPrice]}
                    onValueChange={handlePriceChange}
                    max={5000}
                    step={50}
                    className="w-full"
                  />
                  <div className="text-center mt-2">
                    <span className="text-sm">
                      Up to {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(filters.maxPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ))}
            </div>
          ) : convertedProducts && convertedProducts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{convertedProducts.length} Products Found</Badge>
                  <Badge variant="outline">Currency: {currency}</Badge>
                  {loadingRates && <span className="text-xs text-muted-foreground">Updating rates…</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {convertedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    excerpt={product.excerpt || undefined}
                    featuredImage={product.featured_image || undefined}
                    contentType={product.content_type}
                    category={product.categories as any}
                    author={product.profiles as any}
                    viewsCount={product.views_count || 0}
                    likesCount={product.likes_count || 0}
                    readingTime={product.reading_time || undefined}
                    publishedAt={product.published_at || undefined}
                    price={product.convertedPrice}
                    priceCurrency={currency}
                    formattedPrice={product.formattedPrice}
                    purchaseLinks={product.purchase_links || []}
                    onClick={() => {
                      window.location.href = `/products/${product.slug}`;
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters to find more products.
              </p>
              <button
                onClick={() => setFilters({ category: '', minRating: 0, maxPrice: 5000 })}
                className="text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductsPage;
