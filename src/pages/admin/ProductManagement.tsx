import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  brand: string;
  model: string;
  rating: number;
  imageUrl: string;
  categoryId: string;
  productUrl: string;
  retailerName: string;
  specifications: Record<string, string>;
}

const ProductManagement = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    brand: '',
    model: '',
    rating: 0,
    imageUrl: '',
    categoryId: '',
    productUrl: '',
    retailerName: '',
    specifications: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
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
      return data;
    }
  });

  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      let contentData;
      if (editingId) {
        // Update existing product
        const { data, error } = await supabase
          .from('content')
          .update({
            title: formData.title,
            slug,
            excerpt: formData.description.substring(0, 200) + '...',
            content: `# ${formData.title}\n\n${formData.description}`,
            featured_image: formData.imageUrl,
            category_id: formData.categoryId,
            meta_title: formData.title,
            meta_description: formData.description.substring(0, 160),
          })
          .eq('id', editingId)
          .select()
          .single();
        
        if (error) throw error;
        contentData = data;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('content')
          .insert({
            title: formData.title,
            slug,
            excerpt: formData.description.substring(0, 200) + '...',
            content: `# ${formData.title}\n\n${formData.description}`,
            featured_image: formData.imageUrl,
            content_type: 'review',
            status: 'published',
            author_id: user.id,
            category_id: formData.categoryId,
            meta_title: formData.title,
            meta_description: formData.description.substring(0, 160),
            reading_time: 5
          })
          .select()
          .single();
        
        if (error) throw error;
        contentData = data;
      }

      // Update or create review details
      const { error: reviewError } = await supabase
        .from('review_details')
        .upsert({
          content_id: contentData.id,
          product_name: formData.title,
          brand: formData.brand,
          model: formData.model,
          price: formData.price,
          overall_rating: formData.rating,
          specifications: formData.specifications,
          pros: ['Great features', 'Good value for money'],
          cons: ['Could be improved'],
          images: [formData.imageUrl]
        });

      if (reviewError) throw reviewError;

      // Update or create purchase link
      const { error: linkError } = await supabase
        .from('purchase_links')
        .upsert({
          content_id: contentData.id,
          retailer_name: formData.retailerName || 'Store',
          product_url: formData.productUrl,
          price: formData.price,
          currency: 'INR',
          is_primary: true,
          availability_status: 'in_stock'
        });

      if (linkError) throw linkError;
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
      price: 0,
      brand: '',
      model: '',
      rating: 0,
      imageUrl: '',
      categoryId: '',
      productUrl: '',
      retailerName: '',
      specifications: {}
    });
    setEditingId(null);
  };

  const handleEdit = (product: any) => {
    const reviewDetails = product.review_details?.[0];
    const purchaseLink = product.purchase_links?.[0];
    
    setFormData({
      title: product.title,
      description: product.excerpt?.replace('...', '') || '',
      price: reviewDetails?.price || 0,
      brand: reviewDetails?.brand || '',
      model: reviewDetails?.model || '',
      rating: reviewDetails?.overall_rating || 0,
      imageUrl: product.featured_image || '',
      categoryId: product.category_id || '',
      productUrl: purchaseLink?.product_url || '',
      retailerName: purchaseLink?.retailer_name || '',
      specifications: reviewDetails?.specifications || {}
    });
    setEditingId(product.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.categoryId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground mt-1">Add and manage your product reviews manually</p>
        </div>
      </div>

      {/* Product Form */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {editingId ? 'Update product details' : 'Fill in the product information to create a new review'}
          </p>
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
                    placeholder="Enter product title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
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
                      placeholder="Brand name"
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
                    placeholder="Enter product description"
                    className="h-32"
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
                  <Label htmlFor="productUrl">Purchase URL</Label>
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

            <div className="flex justify-end gap-4 pt-6 border-t">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit"
                disabled={saveProductMutation.isPending}
                className="min-w-[140px]"
              >
                {saveProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
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
          <CardTitle>All Products</CardTitle>
          <p className="text-sm text-muted-foreground">Manage your existing product reviews</p>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.featured_image && (
                          <img
                            src={product.featured_image}
                            alt={product.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium line-clamp-1">{product.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.profiles?.full_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.categories && (
                        <Badge 
                          variant="secondary" 
                          style={{ 
                            backgroundColor: product.categories.color + '20', 
                            color: product.categories.color 
                          }}
                        >
                          {product.categories.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.review_details?.[0]?.price ? 
                        `₹${product.review_details[0].price.toLocaleString()}` : 
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
                    <TableCell>{product.views_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/products`, '_blank')}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.title}"? This action cannot be undone.
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;