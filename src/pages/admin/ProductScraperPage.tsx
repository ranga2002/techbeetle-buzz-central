import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [formData, setFormData] = useState<ScrapedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

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

      const payload = formData || scrapedData;

      // Create content entry as product
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          title: payload.title,
          slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          excerpt: payload.description.substring(0, 200) + '...',
          content: `# ${payload.title}\n\n${payload.description}`,
          featured_image: payload.image,
          content_type: 'products',
          status: 'draft',
          author_id: user.id,
          category_id: selectedCategory,
          meta_title: payload.title,
          meta_description: payload.description.substring(0, 160),
          reading_time: 5
        })
        .select()
        .single();

      if (contentError) throw contentError;

      // Create purchase link
      const { error: linkError } = await supabase
        .from('purchase_links')
        .insert({
          content_id: contentData.id,
          retailer_name: 'Amazon',
          product_url: amazonUrl,
          price: payload.price,
          currency: 'INR',
          is_primary: true,
          availability_status: payload.availability || 'in_stock'
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
      setFormData(null);
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
    if (!amazonUrl.trim()) {
      setFieldError('Please enter a product URL.');
      toast({ title: 'Error', description: 'Product URL is required', variant: 'destructive' });
      return;
    }
    if (!amazonUrl.startsWith('http')) {
      setFieldError('Enter a valid URL starting with http/https.');
      toast({ title: 'Error', description: 'Enter a valid URL starting with http/https', variant: 'destructive' });
      return;
    }
    if (!amazonUrl.includes('amazon') && !amazonUrl.includes('amzn')) {
      setFieldError('Please enter a valid Amazon URL.');
      toast({
        title: "Error",
        description: "Please enter a valid Amazon product URL",
        variant: "destructive",
      });
      return;
    }
    setFieldError(null);
    setIsLoading(true);
    setLastError(null);
    try {
      // Call edge function that scrapes Amazon; expects { product } response
      const { data, error } = await supabase.functions.invoke('amazon-product-scraper', {
        body: {
          product_url: amazonUrl,
          apiKey: apiKey || undefined,
        },
      });

      if (error) {
        console.error('Scraper edge function error', {
          message: error.message,
          status: error.context?.response?.status,
          context: error.context,
        });
        // surface status text when available (CORS/preflight failures often land here)
        if (error.context?.response?.text) {
          try {
            const text = await error.context.response.text();
            console.error('Edge response body:', text);
            setLastError(text || error.message);
          } catch {}
        }
        if (!error.context?.response?.status) {
          setLastError('Request blocked (likely CORS/preflight). Ensure the edge function allows https://techbeetle.org and responds to OPTIONS with 200.');
        }
        throw error;
      }

      const product = data?.product || (Array.isArray(data?.items) ? data.items[0] : null);
      if (product) {
        const mapped: ScrapedProduct = {
          title: product.title,
          description: product.description || product.body || '',
          image: product.images?.[0] || product.image,
          price: Number(product.price) || 0,
          rating: product.rating,
          brand: product.brand,
          model: product.model,
          availability: product.availability,
        };
        setScrapedData(mapped);
        setFormData(mapped);
        toast({
          title: "Success",
          description: "Product data fetched successfully",
        });
      } else {
        throw new Error('No product data found');
      }
    } catch (error: any) {
      console.error('Scraping error:', error);
      setLastError(error?.message || 'Edge function returned an error. Check CORS/edge logs.');
      toast({
        title: "Scraping Failed",
        description: error?.message || "Edge function returned an error. Check CORS/edge logs.",
        variant: "destructive",
      });
      
      // Show additional suggestions if available
      if (error.suggestions && Array.isArray(error.suggestions)) {
        setTimeout(() => {
          toast({
            title: "Suggestions",
            description: error.suggestions.join('. '),
            variant: "default",
          });
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = () => {
    if (!formData || !formData.title?.trim() || !formData.description?.trim()) {
      toast({
        title: "Error",
        description: "Product title and description are required",
        variant: "destructive",
      });
      return;
    }
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast({
        title: "Error",
        description: "Price must be greater than zero",
        variant: "destructive",
      });
      return;
    }
    saveProductMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Product Scraper</h1>
          <p className="text-muted-foreground mt-1">Extract product data from Amazon URLs and save as products</p>
        </div>
      </div>

      {/* API Connector */}
      <Card className="border-2 bg-gradient-to-br from-blue-50/70 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Free Amazon API Scraper</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Plug in your Amazon scraping API key (share it here and we’ll wire it up), or use the built-in edge function.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter your Amazon API key (optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use the default scraper. Provide a key if you want to use an external free API—send it to us and we’ll plug it in.
          </p>
        </CardContent>
      </Card>

      {/* URL Input Form */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Add Amazon Product</CardTitle>
          <p className="text-sm text-muted-foreground">Paste an Amazon product URL to automatically extract product details</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amazon-url">Amazon Product URL</Label>
            <div className="flex gap-3">
              <Input
                id="amazon-url"
                placeholder="https://www.amazon.in/dp/XXXXXXXXXX or https://amzn.to/..."
                value={amazonUrl}
                onChange={(e) => setAmazonUrl(e.target.value)}
                className="flex-1 h-12"
              />
              {fieldError && <p className="text-xs text-destructive mt-1">{fieldError}</p>}
              <Button 
                onClick={handleFetch} 
                disabled={isLoading || !amazonUrl}
                className="min-w-[120px] h-12 text-base font-medium"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Product'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scraped Product Preview */}
      {scrapedData && (
          <>
          <Card className="border-2 border-green-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-green-700">Product Preview</CardTitle>
              <p className="text-sm text-muted-foreground">Review the extracted product details and select a category</p>
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
                    <Input
                      value={formData?.title || ''}
                      onChange={(e) => setFormData((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      value={formData?.price ?? ''}
                      onChange={(e) => setFormData((prev) => prev ? { ...prev, price: Number(e.target.value) || 0 } : prev)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Input
                      value={formData?.rating ?? ''}
                      onChange={(e) => setFormData((prev) => prev ? { ...prev, rating: Number(e.target.value) || 0 } : prev)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData?.description || ''}
                      onChange={(e) => setFormData((prev) => prev ? { ...prev, description: e.target.value } : prev)}
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
                      title={formData?.title || ''}
                      excerpt={(formData?.description || '').substring(0, 100) + '...'}
                      featuredImage={formData?.image}
                      contentType="products"
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
                      rating={formData?.rating}
                      price={formData?.price}
                      purchaseLinks={[{
                        retailer_name: 'Amazon',
                        product_url: amazonUrl,
                        price: formData?.price || 0,
                        is_primary: true
                      }]}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handlePost}
                  disabled={saveProductMutation.isPending || !selectedCategory}
                  className="min-w-[140px] h-12 text-base font-medium"
                  size="lg"
                >
                  {saveProductMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Publish Review
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {lastError && (
        <Card className="border border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-sm">Scraper error details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{lastError}</p>
            <p className="text-xs text-muted-foreground mt-2">
              If this mentions CORS/preflight, allow https://techbeetle.org in Supabase CORS and handle OPTIONS in the edge function.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductScraperPage;
