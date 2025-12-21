import React, { useEffect, useMemo, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, Star, Sparkles, Gauge } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const ProductsPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    minRating: 0,
    maxPrice: 200000,
  });
  const [currency, setCurrency] = useState<'USD' | 'CAD' | 'INR'>('USD');
  const [rates, setRates] = useState<{ [k: string]: number }>({ USD: 1 });
  const [loadingRates, setLoadingRates] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [userSetCurrency, setUserSetCurrency] = useState(false);

  const { useProductCatalogQuery } = useProducts();
  const { data: products, isLoading } = useProductCatalogQuery(filters);

  useEffect(() => {
    const region = (Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] || 'US').toUpperCase();
    const mappedCurrency = region === 'CA' ? 'CAD' : region === 'IN' ? 'INR' : 'USD';
    setCurrency(mappedCurrency as 'USD' | 'CAD' | 'INR');
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

  // If products come with a currency (from purchase_links), default to it unless the user already picked.
  useEffect(() => {
    if (userSetCurrency || !products?.length) return;
    const primary = products[0]?.purchase_links?.find((link) => link.is_primary) || products[0]?.purchase_links?.[0];
    const detectedCurrency = primary?.currency as 'USD' | 'CAD' | 'INR' | undefined;
    if (detectedCurrency) {
      setCurrency(detectedCurrency);
    }
  }, [products, userSetCurrency]);

  const convertedProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => {
      const primaryLink = p.purchase_links?.find((link) => link.is_primary) || p.purchase_links?.[0];
      const basePrice = primaryLink?.price ?? p.inventory?.price ?? undefined;
      const baseCurrency = (primaryLink?.currency as 'USD' | 'CAD' | 'INR' | undefined) || 'INR';
      const rateTarget = rates[currency] || 1;
      const rateBase = rates[baseCurrency] || 1;
      const convertedPrice =
        basePrice !== undefined && rateBase
          ? (basePrice * rateTarget) / rateBase
          : basePrice;
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
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Helmet>
        <title>Products | Tech Beetle</title>
        <meta
          name="description"
          content="Browse curated tech products with ratings, prices, and purchase links. Filter by category, rating, and budget."
        />
        <link rel="canonical" href="https://techbeetle.org/products" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Products | Tech Beetle" />
        <meta
          property="og:description"
          content="Curated gadget picks with reviews, ratings, and purchase links."
        />
        <meta property="og:image" content="https://techbeetle.org/favicon.ico" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Products | Tech Beetle" />
        <meta
          name="twitter:description"
          content="Curated gadget picks with reviews, ratings, and purchase links."
        />
        <meta name="twitter:image" content="https://techbeetle.org/favicon.ico" />
      </Helmet>
      <Header />
      
      <main className="py-10">
        <div className="container mx-auto px-4 space-y-10">
          {/* Hero / intro */}
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-white to-purple-50 dark:from-primary/10 dark:via-background dark:to-background p-8 md:p-12">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Curated picks, updated daily
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Recommended Products
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover the best tech with verified specs, live prices, and trustworthy purchase links. Filter by category, rating, and budget to find your perfect match.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Star className="mr-1 h-4 w-4" /> {filters.minRating}+ rating
                </Badge>
                <Badge variant="secondary">
                  <Gauge className="mr-1 h-4 w-4" />
                  Max {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(filters.maxPrice)}
                </Badge>
                <Badge variant="outline">Currency: {currency}</Badge>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
          </div>

          {/* Layout: filters + results */}
          <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
            {/* Filters */}
            <aside className="space-y-4">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Filter Products</h3>
                </div>

                {fxError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">
                    {fxError}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Minimum Rating
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </label>
                    <div className="px-1">
                      <Slider
                        value={[filters.minRating]}
                        onValueChange={handleRatingChange}
                        max={5}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span>{filters.minRating}+</span>
                        <span>5</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Max Price
                      <Gauge className="w-4 h-4 text-primary" />
                    </label>
                    <div className="px-1">
                      <Slider
                        value={[filters.maxPrice]}
                        onValueChange={handlePriceChange}
                        max={200000}
                        step={500}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span>
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(filters.maxPrice)}
                        </span>
                        <span>200k</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <Select
                      value={currency}
                      onValueChange={(val) => {
                        setCurrency(val as 'USD' | 'CAD' | 'INR');
                        setUserSetCurrency(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                    {loadingRates && <p className="text-xs text-muted-foreground">Updating rates…</p>}
                  </div>

                  <button
                    onClick={() => setFilters({ category: '', minRating: 0, maxPrice: 200000 })}
                    className="w-full rounded-lg border border-input bg-muted/30 py-2 text-sm font-medium hover:bg-muted/50 transition"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <section className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-[4/5] rounded-xl" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : convertedProducts && convertedProducts.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{convertedProducts.length} Products</Badge>
                      <Badge variant="outline">Currency: {currency}</Badge>
                      {loadingRates && <span className="text-xs text-muted-foreground">Updating rates…</span>}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Tap a card to view full specs and purchase links.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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
                <div className="text-center rounded-xl border bg-card py-12 px-6 shadow-sm">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Filter className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or resetting them to see more products.
                  </p>
                  <button
                    onClick={() => setFilters({ category: '', minRating: 0, maxPrice: 200000 })}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:shadow-md transition"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductsPage;
