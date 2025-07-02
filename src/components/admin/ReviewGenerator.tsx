
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useContent } from '@/hooks/useContent';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';

interface ProductTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: 'B0BDHB9Y8H',
    name: 'iPhone 15 Pro Max',
    category: 'smartphones',
    description: 'Latest iPhone with titanium design and A17 Pro chip'
  },
  {
    id: 'B0C63GV3JB',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'smartphones',
    description: 'Flagship Android with S Pen and 200MP camera'
  },
  {
    id: 'custom',
    name: 'Custom Product',
    category: 'custom',
    description: 'Create a custom review with your own product data'
  }
];

const ReviewGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customProductId, setCustomProductId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { useCategoriesQuery } = useContent();
  const { data: categories } = useCategoriesQuery();
  const { user } = useAdminAuth();
  const { toast } = useToast();

  const generateReview = async () => {
    if (!selectedTemplate || !user?.id) {
      setError('Please select a product template and ensure you are logged in');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting review generation process...');

      // Step 1: Scrape product data
      const productId = selectedTemplate === 'custom' ? customProductId : selectedTemplate;
      const { data: productData, error: scrapeError } = await supabase.functions.invoke('scrape-product-data', {
        body: { 
          product_id: productId,
          source_type: 'amazon'
        }
      });

      if (scrapeError || !productData?.success) {
        throw new Error(scrapeError?.message || 'Failed to fetch product data');
      }

      console.log('Product data fetched:', productData);

      // Step 2: Find category
      const template = PRODUCT_TEMPLATES.find(t => t.id === selectedTemplate);
      const category = categories?.find(c => 
        c.slug === template?.category || 
        c.name.toLowerCase().includes(template?.category || '')
      );

      if (!category) {
        throw new Error('Category not found for this product type');
      }

      // Step 3: Generate review
      const { data: reviewData, error: reviewError } = await supabase.functions.invoke('generate-review', {
        body: {
          productData: productData.product,
          authorId: user.id,
          categoryId: category.id
        }
      });

      if (reviewError || !reviewData?.success) {
        throw new Error(reviewError?.message || 'Failed to generate review');
      }

      console.log('Review generated:', reviewData);

      // Step 4: Add purchase links
      if (productData.pricing && reviewData.content_id) {
        const purchaseLinks = productData.pricing.map((retailer: any) => ({
          content_id: reviewData.content_id,
          retailer_name: retailer.name,
          product_url: retailer.url,
          price: retailer.price,
          currency: 'USD',
          is_primary: retailer.name === 'Amazon'
        }));

        const { error: linksError } = await supabase
          .from('purchase_links')
          .insert(purchaseLinks);

        if (linksError) {
          console.error('Error adding purchase links:', linksError);
        }
      }

      setResult({
        ...reviewData,
        productName: productData.product.title,
        pricing: productData.pricing
      });

      toast({
        title: "Review Generated Successfully",
        description: `Created comprehensive review for ${productData.product.title}`,
      });

    } catch (err: any) {
      console.error('Error generating review:', err);
      setError(err.message || 'An error occurred while generating the review');
      toast({
        title: "Generation Failed",
        description: err.message || 'Failed to generate review',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMultipleReviews = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const templates = PRODUCT_TEMPLATES.filter(t => t.id !== 'custom');
      let successCount = 0;
      let errorCount = 0;

      for (const template of templates) {
        try {
          setSelectedTemplate(template.id);
          
          const { data: productData } = await supabase.functions.invoke('scrape-product-data', {
            body: { 
              product_id: template.id,
              source_type: 'amazon'
            }
          });

          if (productData?.success) {
            const category = categories?.find(c => c.slug === template.category);
            
            if (category) {
              const { data: reviewData } = await supabase.functions.invoke('generate-review', {
                body: {
                  productData: productData.product,
                  authorId: user?.id,
                  categoryId: category.id
                }
              });

              if (reviewData?.success) {
                successCount++;
              } else {
                errorCount++;
              }
            }
          }
        } catch (err) {
          console.error(`Error generating review for ${template.name}:`, err);
          errorCount++;
        }
      }

      setResult({
        batch: true,
        successCount,
        errorCount,
        message: `Generated ${successCount} reviews successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      });

      toast({
        title: "Batch Generation Complete",
        description: `Generated ${successCount} reviews successfully`,
      });

    } catch (err: any) {
      setError(err.message || 'Batch generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Product Review Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="template">Product Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product template" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customId">Custom Product ID</Label>
              <Input 
                id="customId"
                value={customProductId}
                onChange={(e) => setCustomProductId(e.target.value)}
                placeholder="Enter Amazon ASIN or product ID"
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={generateReview} 
            disabled={isGenerating || !selectedTemplate}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Review...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Generate Single Review
              </>
            )}
          </Button>

          <Button 
            onClick={generateMultipleReviews} 
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate All Templates
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                {result.batch ? (
                  <>
                    <div><strong>Batch Generation Complete</strong></div>
                    <div><strong>Success:</strong> {result.successCount} reviews</div>
                    <div><strong>Errors:</strong> {result.errorCount}</div>
                    <div><strong>Message:</strong> {result.message}</div>
                  </>
                ) : (
                  <>
                    <div><strong>Review Generated Successfully!</strong></div>
                    <div><strong>Product:</strong> {result.productName}</div>
                    <div><strong>Content ID:</strong> {result.content_id}</div>
                    {result.pricing && (
                      <div><strong>Purchase Links:</strong> {result.pricing.length} retailers added</div>
                    )}
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Fetches real product data including specs, pricing, and images</li>
            <li>Generates comprehensive reviews with pros/cons analysis</li>
            <li>Creates purchase links from multiple retailers</li>
            <li>Adds detailed technical specifications</li>
            <li>Optimizes content for SEO and readability</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewGenerator;
