import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type InventoryItem = {
  id: string;
  title: string;
  category_id: string | null;
  categories?: { name: string } | null;
  featured_image?: string | null;
  slug?: string | null;
  status?: string | null;
  views_count?: number | null;
  content_type?: string | null;
  external_url?: string | null;
  images?: string[] | null;
  description?: string | null;
  purchase_links?: { price: number | null; product_url: string | null; retailer_name: string | null }[] | null;
  inventory_id?: string | null;
};

const InventoryManagement = () => {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    image_url: '',
    additional_images: '',
    product_url: '',
    affiliate_url: '',
    description: '',
    price: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', filter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('content')
        .select(
          `
          id,
          title,
          slug,
          category_id,
          categories ( name ),
          featured_image,
          status,
          views_count,
          content_type,
          excerpt,
          purchase_links ( price, product_url, retailer_name ),
          inventory_id
        `,
        )
        .eq('content_type', 'product')
        .order('created_at', { ascending: false });

      if (filter) query = query.ilike('title', `%${filter}%`);
      if (categoryFilter !== 'all') query = query.eq('category_id', categoryFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const saveItem = useMutation({
    mutationFn: async () => {
      if (!formData.title) throw new Error('Title is required');
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const imagesArray = formData.additional_images
        ? formData.additional_images.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const priceValue = formData.price ? Number(formData.price) : null;

      // Upsert inventory (match on affiliate or product URL)
      const sourceUrl = formData.product_url || formData.affiliate_url || undefined;
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .upsert({
          title: formData.title,
          affiliate_url: formData.affiliate_url || formData.product_url || null,
          source_url: sourceUrl || null,
          price: priceValue,
          images: imagesArray.length ? imagesArray : null,
          author_id: userId,
        }, { onConflict: 'source_url' })
        .select('id')
        .single();
      if (invError) throw invError;
      const inventoryId = invData?.id;
      if (!inventoryId) throw new Error('Failed to save product details');

      const payload = {
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category_id: formData.category_id || null,
        featured_image: formData.image_url || null,
        external_url: formData.product_url || null,
        affiliate_url: formData.affiliate_url || formData.product_url || null,
        images: imagesArray.length ? imagesArray : null,
        excerpt: formData.description ? formData.description.slice(0, 200) : null,
        content: formData.description ? `# ${formData.title}\n\n${formData.description}` : `# ${formData.title}`,
        content_type: 'product',
        status: 'draft',
        inventory_id: inventoryId,
        author_id: userId,
      };
      let contentId = editing?.id;
      if (editing) {
        const { error } = await supabase.from('content').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('content').insert({
          ...payload,
        }).select('id').single();
        if (error) throw error;
        contentId = data?.id || contentId;
      }

      // Upsert primary purchase/affiliate link with price
      if (contentId && (formData.product_url || formData.affiliate_url || formData.price)) {
        // clear existing primary links to avoid unique conflicts
        await supabase.from('purchase_links').delete().eq('content_id', contentId).eq('is_primary', true);
        await supabase.from('purchase_links').insert({
          content_id: contentId,
          retailer_name: formData.affiliate_url ? 'Affiliate' : 'Amazon',
          product_url: formData.affiliate_url || formData.product_url,
          price: formData.price ? Number(formData.price) : null,
          currency: 'INR',
          is_primary: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Saved', description: 'Product saved.' });
      setEditing(null);
      setFormData({
        title: '',
        category_id: '',
        image_url: '',
        additional_images: '',
        product_url: '',
        affiliate_url: '',
        description: '',
        price: '',
      });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to save item', variant: 'destructive' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Deleted', description: 'Inventory item deleted.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to delete item', variant: 'destructive' });
    },
  });

  const startEdit = (item: InventoryItem) => {
    setEditing(item);
    setFormData({
      title: item.title || '',
      price: (item.purchase_links?.[0]?.price ?? '').toString() || '',
      category_id: item.category_id || '',
      image_url: item.featured_image || '',
      additional_images: (item.images || []).join(', '),
      product_url: item.purchase_links?.[0]?.product_url || item.external_url || '',
      affiliate_url: item.purchase_links?.[0]?.product_url || item.external_url || '',
      description: item.excerpt || '',
    });
  };

  const tableItems = useMemo(() => items || [], [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Affiliate-style inventory of products you recommend.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormData({
              title: '',
              category_id: '',
              image_url: '',
              additional_images: '',
              product_url: '',
              affiliate_url: '',
              description: '',
              price: '',
            });
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Search products..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit Affiliate Product' : 'Add Affiliate Product'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Name" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <Input placeholder="Primary image URL" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
          <Input placeholder="Additional images (comma separated)" value={formData.additional_images} onChange={(e) => setFormData({ ...formData, additional_images: e.target.value })} />
          <Input placeholder="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Amazon link" value={formData.product_url} onChange={(e) => setFormData({ ...formData, product_url: e.target.value })} />
          <Input placeholder="Other affiliate link" value={formData.affiliate_url} onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveItem.mutate()} disabled={saveItem.isPending}>
              {saveItem.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
            {editing && (
              <Button variant="outline" onClick={() => { setEditing(null); setFormData({ title: '', price: '', category_id: '', image_url: '', additional_images: '', product_url: '', affiliate_url: '', description: '' }); }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Affiliate Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      {item.featured_image ? (
                        <img src={item.featured_image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{item.categories?.name || 'Uncategorized'}</TableCell>
                    <TableCell className="capitalize">{item.status || 'draft'}</TableCell>
                    <TableCell>{(item.views_count || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      {item.purchase_links?.[0]?.price ? `₹${item.purchase_links[0].price}` : '-'}
                    </TableCell>
                    <TableCell>
                      {item.purchase_links?.[0]?.product_url || item.external_url ? (
                        <a
                          href={item.purchase_links?.[0]?.product_url || item.external_url || ''}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline text-xs"
                        >
                          Link
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm('Delete this item?')) deleteItem.mutate(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

export default InventoryManagement;
