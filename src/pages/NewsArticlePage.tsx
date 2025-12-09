import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';

type Article = {
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_indexable: boolean | null;
};

const NewsArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('content')
        .select('title, slug, content, meta_title, meta_description, is_indexable')
        .eq('content_type', 'news')
        .eq('slug', slug)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else if (!data) {
        setError('Article not found');
      } else {
        setArticle(data as Article);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [slug]);

  const robots = article?.is_indexable ? 'index,follow' : 'noindex,follow';
  const title = article?.meta_title || article?.title || 'News';
  const description =
    article?.meta_description ||
    (article?.content ? article.content.slice(0, 155) : 'TechBeetle news article');
  const sanitizedContent = article?.content
    ? DOMPurify.sanitize(article.content)
    : '<p>No content available.</p>';

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content={robots} />
        {article?.slug && (
          <link
            rel="canonical"
            href={`${import.meta.env.VITE_SITE_URL || window.location.origin}/news/${article.slug}`}
          />
        )}
      </Helmet>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && article && (
        <>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <article
            className="prose prose-slate dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </>
      )}
    </main>
  );
};

export default NewsArticlePage;
