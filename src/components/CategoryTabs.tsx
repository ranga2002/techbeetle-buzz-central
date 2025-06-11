
import React from 'react';
import { useContent } from '@/hooks/useContent';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const CategoryTabs = () => {
  const { useCategoriesQuery } = useContent();
  const { data: categories, isLoading } = useCategoriesQuery();

  if (isLoading) {
    return (
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 border-b bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Explore Categories</h2>
          <p className="text-muted-foreground">
            Discover content by your favorite tech categories
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {categories?.map((category) => (
            <Link key={category.id} to={`/news?category=${category.slug}`}>
              <Badge 
                variant="outline" 
                className="px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                style={{ borderColor: category.color }}
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryTabs;
