import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, Star } from 'lucide-react';

const ProductsPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    minRating: 0,
    maxPrice: 5000,
  });

  const { useProductReviewsQuery } = useProducts();
  const { data: products, isLoading } = useProductReviewsQuery(filters);

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
                    <span className="text-sm">Up to ${filters.maxPrice}</span>
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
          ) : products && products.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{products.length} Products Found</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
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
                    rating={product.review_details?.[0]?.overall_rating}
                    price={product.review_details?.[0]?.price}
                    purchaseLinks={product.purchase_links || []}
                    onClick={() => {
                      console.log('Navigate to product:', product.slug);
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