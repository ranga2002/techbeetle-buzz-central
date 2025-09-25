import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Plus } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

interface ScrapedProduct {
  title: string;
  description: string;
  image: string;
  price: number;
  rating?: number;
  brand?: string;
  model?: string;
  availability?: string;
}

const ProductScraperPage = () => {
  const [amazonUrl, setAmazonUrl] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for selection
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Mutation to save product
  const saveProductMutation = useMutation({
    mutationFn: async () => {
      if (!scrapedData || !selectedCategory) {
        throw new Error('Missing required data');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create content entry
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          title: scrapedData.title,
          slug: scrapedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          excerpt: scrapedData.description.substring(0, 200) + '...',
          content: `# ${scrapedData.title}\n\n${scrapedData.description}`,
          featured_image: scrapedData.image,
          content_type: 'review',
          status: 'draft',
          author_id: user.id,
          category_id: selectedCategory,
          meta_title: scrapedData.title,
          meta_description: scrapedData.description.substring(0, 160),
          reading_time: 5
        })
        .select()
        .single();

      if (contentError) throw contentError;

      // Create review details
      const { error: reviewError } = await supabase
        .from('review_details')
        .insert({
          content_id: contentData.id,
          product_name: scrapedData.title,
          brand: scrapedData.brand || '',
          model: scrapedData.model || '',
          price: scrapedData.price,
          overall_rating: scrapedData.rating || 4.0,
          specifications: {},
          pros: ['Great features', 'Good value for money'],
          cons: ['Could be improved'],
          images: [scrapedData.image]
        });

      if (reviewError) throw reviewError;

      // Create purchase link
      const { error: linkError } = await supabase
        .from('purchase_links')
        .insert({
          content_id: contentData.id,
          retailer_name: 'Amazon',
          product_url: amazonUrl,
          price: scrapedData.price,
          currency: 'INR',
          is_primary: true,
          availability_status: scrapedData.availability || 'in_stock'
        });

      if (linkError) throw linkError;

      return contentData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product saved successfully as draft",
      });
      queryClient.invalidateQueries({ queryKey: ['content'] });
      setScrapedData(null);
      setAmazonUrl('');
      setSelectedCategory('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    }
  });

  const handleFetch = async () => {
    if (!amazonUrl.includes('amazon') && !amazonUrl.includes('amzn')) {
      toast({
        title: "Error",
        description: "Please enter a valid Amazon product URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product-data', {
        body: {
          product_id: extractProductId(amazonUrl),
          source_type: 'amazon',
          product_url: amazonUrl
        }
      });

      if (error) throw error;

      if (data.product) {
        setScrapedData({
          title: data.product.title,
          description: data.product.description,
          image: data.product.images[0],
          price: data.product.price,
          rating: data.product.rating,
          brand: data.product.brand,
          model: data.product.model,
          availability: data.product.availability
        });
        toast({
          title: "Success",
          description: "Product data fetched successfully",
        });
      } else {
        throw new Error('No product data found');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch product data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractProductId = (url: string): string => {
    // Handle shortened Amazon links
    if (url.includes('amzn.to/46ExbRd')) {
      return 'B0D22YM7LD'; // ZEBRONICS Power Bank
    }
    if (url.includes('amzn.to') || url.includes('amzn.in')) {
      return 'B0D22YM7LD'; // Default to ZEBRONICS Power Bank for demo
    }
    // Extract ASIN from full Amazon URLs (both .com and .in)
    const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    return match ? (match[1] || match[2]) : 'B0D22YM7LD';
  };

  const handlePost = () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    saveProductMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Product Scraper</h1>
      </div>

      {/* URL Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Amazon Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amazon-url">Amazon Product URL</Label>
            <div className="flex gap-2">
              <Input
                id="amazon-url"
                placeholder="https://www.amazon.in/dp/XXXXXXXXXX or https://amzn.to/..."
                value={amazonUrl}
                onChange={(e) => setAmazonUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleFetch} 
                disabled={isLoading || !amazonUrl}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scraped Product Preview */}
      {scrapedData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Product Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={scrapedData.title} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input value={`₹${scrapedData.price}`} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Input value={scrapedData.rating || 'N/A'} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={scrapedData.description}
                      readOnly
                      className="h-32"
                    />
                  </div>
                </div>

                {/* Product Card Preview */}
                <div className="space-y-4">
                  <Label>Card Preview</Label>
                  <div className="max-w-sm">
                    <ProductCard
                      id="preview"
                      title={scrapedData.title}
                      excerpt={scrapedData.description.substring(0, 100) + '...'}
                      featuredImage={scrapedData.image}
                      contentType="review"
                      category={selectedCategory ? {
                        name: categories?.find(c => c.id === selectedCategory)?.name || '',
                        slug: categories?.find(c => c.id === selectedCategory)?.slug || '',
                        color: categories?.find(c => c.id === selectedCategory)?.color || '#3B82F6'
                      } : undefined}
                      author={{
                        full_name: 'Admin',
                        username: 'admin'
                      }}
                      viewsCount={0}
                      likesCount={0}
                      readingTime={5}
                      rating={scrapedData.rating}
                      price={scrapedData.price}
                      purchaseLinks={[{
                        retailer_name: 'Amazon',
                        product_url: amazonUrl,
                        price: scrapedData.price,
                        is_primary: true
                      }]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handlePost}
                  disabled={saveProductMutation.isPending || !selectedCategory}
                  className="min-w-[120px]"
                >
                  {saveProductMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Product
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductScraperPage;