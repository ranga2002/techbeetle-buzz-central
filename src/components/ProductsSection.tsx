import React from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductsSection = () => {
  const { useProductReviewsQuery } = useProducts();
  const { data: products, isLoading } = useProductReviewsQuery({ limit: 6 });

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products?.length) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-current" />
            Affiliate Recommendations
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Top Rated Products
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our hand-picked selection of the best tech products. 
            Each recommendation comes with detailed reviews and honest insights.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-card border rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Looking for More Products?
            </h3>
            <p className="text-muted-foreground mb-6">
              Explore our complete collection of reviewed products with detailed comparisons, 
              ratings, and purchase links.
            </p>
            <Link to="/products">
              <Button size="lg" className="group">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;