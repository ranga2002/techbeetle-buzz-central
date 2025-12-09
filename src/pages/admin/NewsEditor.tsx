import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

type Category = { id: string; name: string };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const NewsEditor = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    why: '',
    keyPoints: '',
    takeaways: '',
    body: '',
    seoTitle: '',
    seoDescription: '',
    image: '',
    categoryId: '',
    indexable: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  const handleSave = async () => {
    if (!form.title || !form.body) {
      toast({ title: 'Missing fields', description: 'Title and body are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const authorId = userData.user?.id || null;
      const slug = form.slug ? slugify(form.slug) : slugify(form.title);
      const now = new Date().toISOString();
      const keyPoints = form.keyPoints
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const takeaways = form.takeaways
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const composedBody = [
        form.summary ? `## Summary\n${form.summary}` : '',
        form.why ? `## Why it matters\n${form.why}` : '',
        keyPoints.length ? `## Key points\n${keyPoints.map((p) => `- ${p}`).join('\n')}` : '',
        takeaways.length ? `## Takeaways\n${takeaways.map((p) => `- ${p}`).join('\n')}` : '',
        form.body,
      ]
        .filter(Boolean)
        .join('\n\n');

      const { error } = await supabase.from('content').upsert(
        {
          title: form.title,
          slug,
          excerpt: form.summary?.slice(0, 200) || null,
          content: composedBody,
          featured_image: form.image || null,
          content_type: 'news',
          status: form.indexable ? 'published' : 'draft',
          author_id: authorId,
          category_id: form.categoryId || null,
          published_at: now,
          meta_title: form.seoTitle || form.title.slice(0, 60),
          meta_description: form.seoDescription || form.summary.slice(0, 155),
          is_featured: false,
          reading_time: 5,
          views_count: 0,
          likes_count: 0,
          updated_at: now,
        },
        { onConflict: 'slug' },
      );

      if (error) throw error;

      toast({ title: 'Saved', description: 'News explainer saved successfully.' });
      setForm({
        title: '',
        slug: '',
        summary: '',
        why: '',
        keyPoints: '',
        takeaways: '',
        body: '',
        seoTitle: '',
        seoDescription: '',
        image: '',
        categoryId: '',
        indexable: true,
      });
    } catch (err: any) {
      toast({
        title: 'Error saving',
        description: err?.message || 'Unable to save news item.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">News Explainer Editor</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if empty" />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div>
            <Label>Why it matters</Label>
            <Textarea value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} />
          </div>
          <div>
            <Label>Key points (one per line)</Label>
            <Textarea value={form.keyPoints} onChange={(e) => setForm({ ...form, keyPoints: e.target.value })} />
          </div>
          <div>
            <Label>Takeaways (one per line)</Label>
            <Textarea value={form.takeaways} onChange={(e) => setForm({ ...form, takeaways: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Body (explainer)</Label>
            <Textarea
              className="min-h-[200px]"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="400–700 words"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>SEO title</Label>
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </div>
          <div>
            <Label>SEO description</Label>
            <Input
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              placeholder="~155 characters"
            />
          </div>
          <div>
            <Label>Featured image URL</Label>
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="indexable"
              checked={form.indexable}
              onCheckedChange={(v) => setForm({ ...form, indexable: v })}
            />
            <Label htmlFor="indexable">Indexable (publish)</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsEditor;
