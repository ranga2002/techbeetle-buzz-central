
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useContent } from '@/hooks/useContent';

const CategoryTabs = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const { useCategoriesQuery } = useContent();
  const { data: categories } = useCategoriesQuery();
  
  const allCategories = ['All', ...(categories?.map(cat => cat.name) || [])];

  return (
    <div className="border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-4">
          {allCategories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap ${
                activeCategory === category 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
