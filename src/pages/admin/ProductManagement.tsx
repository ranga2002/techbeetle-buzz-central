import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Plus, Edit, Trash2, Eye, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  brand: string;
  model: string;
  rating: string;
  imageUrl: string;
  categoryId: string;
  productUrl: string;
  retailerName: string;
}

const ProductManagement = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    brand: '',
    model: '',
    rating: '',
    imageUrl: '',
    categoryId: '',
    productUrl: '',
    retailerName: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fetchUrl, setFetchUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch products
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          categories (name, color),
          profiles (full_name),
          review_details (*),
          purchase_links (*)
        `)
        .eq('content_type', 'review')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!formData.title || !formData.categoryId) {
        throw new Error('Title and category are required');
      }

      const slug = formData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const priceNum = formData.price ? parseFloat(formData.price) : null;
      const ratingNum = formData.rating ? parseFloat(formData.rating) : null;

      let contentData;
      if (editingId) {
        // Update existing product
        const { data, error } = await supabase
          .from('content')
          .update({
            title: formData.title,
            slug,
            excerpt: formData.description ? formData.description.substring(0, 200) : '',
            content: `# ${formData.title}\n\n${formData.description}`,
            featured_image: formData.imageUrl || null,
            category_id: formData.categoryId,
            meta_title: formData.title,
            meta_description: formData.description ? formData.description.substring(0, 160) : '',
          })
          .eq('id', editingId)
          .select()
          .single();
        
        if (error) throw error;
        contentData = data;

        // Update review details
        const { error: reviewError } = await supabase
          .from('review_details')
          .upsert({
            content_id: contentData.id,
            product_name: formData.title,
            brand: formData.brand || null,
            model: formData.model || null,
            price: priceNum,
            overall_rating: ratingNum,
            specifications: {},
            pros: ['High quality product', 'Great value'],
            cons: ['Could be improved'],
            images: formData.imageUrl ? [formData.imageUrl] : []
          }, {
            onConflict: 'content_id'
          });

        if (reviewError) throw reviewError;

        // Update purchase link
        if (formData.productUrl) {
          const { error: linkError } = await supabase
            .from('purchase_links')
            .upsert({
              content_id: contentData.id,
              retailer_name: formData.retailerName || 'Store',
              product_url: formData.productUrl,
              price: priceNum,
              currency: 'INR',
              is_primary: true,
              availability_status: 'in_stock'
            });

          if (linkError) throw linkError;
        }
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('content')
          .insert({
            title: formData.title,
            slug,
            excerpt: formData.description ? formData.description.substring(0, 200) : '',
            content: `# ${formData.title}\n\n${formData.description}`,
            featured_image: formData.imageUrl || null,
            content_type: 'review',
            status: 'published',
            author_id: user.id,
            category_id: formData.categoryId,
            meta_title: formData.title,
            meta_description: formData.description ? formData.description.substring(0, 160) : '',
            reading_time: 5,
            published_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        contentData = data;

        // Create review details
        const { error: reviewError } = await supabase
          .from('review_details')
          .insert({
            content_id: contentData.id,
            product_name: formData.title,
            brand: formData.brand || null,
            model: formData.model || null,
            price: priceNum,
            overall_rating: ratingNum,
            specifications: {},
            pros: ['High quality product', 'Great value'],
            cons: ['Could be improved'],
            images: formData.imageUrl ? [formData.imageUrl] : []
          });

        if (reviewError) throw reviewError;

        // Create purchase link
        if (formData.productUrl) {
          const { error: linkError } = await supabase
            .from('purchase_links')
            .insert({
              content_id: contentData.id,
              retailer_name: formData.retailerName || 'Store',
              product_url: formData.productUrl,
              price: priceNum,
              currency: 'INR',
              is_primary: true,
              availability_status: 'in_stock'
            });

          if (linkError) throw linkError;
        }
      }

      return contentData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingId ? "Product updated successfully" : "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      brand: '',
      model: '',
      rating: '',
      imageUrl: '',
      categoryId: '',
      productUrl: '',
      retailerName: ''
    });
    setEditingId(null);
  };

  const handleEdit = (product: any) => {
    const reviewDetails = product.review_details?.[0];
    const purchaseLink = product.purchase_links?.[0];
    
    setFormData({
      title: product.title,
      description: product.excerpt?.replace('...', '') || '',
      price: reviewDetails?.price ? reviewDetails.price.toString() : '',
      brand: reviewDetails?.brand || '',
      model: reviewDetails?.model || '',
      rating: reviewDetails?.overall_rating ? reviewDetails.overall_rating.toString() : '',
      imageUrl: product.featured_image || '',
      categoryId: product.category_id || '',
      productUrl: purchaseLink?.product_url || '',
      retailerName: purchaseLink?.retailer_name || ''
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFetchProduct = async () => {
    if (!fetchUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an Amazon product URL",
        variant: "destructive",
      });
      return;
    }

    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-product-data', {
        body: { productUrl: fetchUrl }
      });

      if (error) throw error;

      if (data.success && data.data) {
        const product = data.data;
        setFormData(prev => ({
          ...prev,
          title: product.title || prev.title,
          description: product.description || prev.description,
          price: product.price ? product.price.toString() : prev.price,
          brand: product.brand || prev.brand,
          model: product.model || prev.model,
          rating: product.rating ? product.rating.toString() : prev.rating,
          imageUrl: product.images?.[0] || prev.imageUrl,
          productUrl: fetchUrl,
          retailerName: fetchUrl.includes('amazon') ? 'Amazon' : prev.retailerName,
        }));

        toast({
          title: "Success",
          description: "Product details fetched successfully!",
        });
        setFetchUrl('');
      } else {
        throw new Error(data.error || 'Failed to fetch product details');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error fetching product",
        description: error.message || "Failed to fetch product details from Amazon",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProductMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground mt-1">Add and manage your product reviews</p>
        </div>
      </div>

      {/* Product Fetcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Fetch Product from Amazon
          </CardTitle>
          <CardDescription>
            Enter an Amazon product URL to automatically fetch product details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="https://www.amazon.in/dp/..."
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
              disabled={isFetching}
              className="flex-1"
            />
            <Button 
              onClick={handleFetchProduct}
              disabled={isFetching || !fetchUrl.trim()}
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Fetch Details'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Supports Amazon.in, Amazon.com and short links (amzn.in/...)
          </p>
        </CardContent>
      </Card>

      {/* Product Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
          <CardDescription>
            {editingId ? 'Update product details' : 'Fill in the product information or use the fetcher above'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., iPhone 15 Pro Max"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    disabled={loadingCategories}
                  >
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="99999"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                      placeholder="4.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Apple, Samsung, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Model number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter detailed product description..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Product Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productUrl">Purchase Link (Amazon, Flipkart, etc.)</Label>
                  <Input
                    id="productUrl"
                    value={formData.productUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, productUrl: e.target.value }))}
                    placeholder="https://amazon.in/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retailerName">Retailer Name</Label>
                  <Input
                    id="retailerName"
                    value={formData.retailerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, retailerName: e.target.value }))}
                    placeholder="Amazon, Flipkart, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit"
                disabled={saveProductMutation.isPending}
              >
                {saveProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({products?.length || 0})</CardTitle>
          <CardDescription>Manage your existing product reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.featured_image && (
                            <img
                              src={product.featured_image}
                              alt={product.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{product.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.profiles?.full_name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.categories && (
                          <Badge 
                            variant="secondary" 
                            style={{ 
                              backgroundColor: `${product.categories.color}20`, 
                              color: product.categories.color 
                            }}
                          >
                            {product.categories.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.review_details?.[0]?.price ? 
                          `₹${product.review_details[0].price.toLocaleString('en-IN')}` : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {product.review_details?.[0]?.overall_rating ? 
                          `${product.review_details[0].overall_rating}/5` : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.views_count.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/products`, '_blank')}
                            title="View product"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" title="Delete product">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.title}"? This action cannot be undone and will also delete all associated review details and purchase links.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products yet</h3>
              <p className="text-muted-foreground">Create your first product using the form above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;
