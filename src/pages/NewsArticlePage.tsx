import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { ArticleJsonLd } from '@/components/seo/StructuredData';

type Article = {
  title: string;
  slug: string;
  content: string | null;
  content_type?: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_indexable: boolean | null;
  featured_image?: string | null;
  published_at?: string | null;
  status?: string | null;
};

type Related = {
  slug: string;
  title: string;
};

const NewsArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<Related[]>([]);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('content')
        .select('title, slug, content, meta_title, meta_description, is_indexable, featured_image, published_at, status, content_type')
        .eq('status', 'published')
        .eq('slug', slug)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else if (!data) {
        setError('Article not found');
      } else {
        setArticle(data as Article);
        // fetch related once main is loaded
        const { data: relatedData } = await supabase
          .from('content')
          .select('slug, title')
          .eq('content_type', (data as any).content_type || 'news')
          .eq('is_indexable', true)
          .neq('slug', slug)
          .order('published_at', { ascending: false })
          .limit(4);
        setRelated((relatedData as Related[] | null) || []);
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
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const canonical = article?.slug ? `${siteUrl.replace(/\/+$/, '')}/news/${article.slug}` : undefined;
  const sanitizedContent = article?.content
    ? DOMPurify.sanitize(article.content)
    : '<p>No content available.</p>';

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content={robots} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        {canonical && <meta property="og:url" content={canonical} />}
        {article?.featured_image && <meta property="og:image" content={article.featured_image} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description && <meta name="twitter:description" content={description} />}
        {article?.featured_image && <meta name="twitter:image" content={article.featured_image} />}
      </Helmet>
      {article && canonical && (
        <ArticleJsonLd
          headline={article.title}
          description={description}
          url={canonical}
          image={article.featured_image}
          datePublished={article.published_at}
          dateModified={article.published_at}
          authorName="TechBeetle"
          siteName="TechBeetle"
        />
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && article && (
        <>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <article
            className="prose prose-slate dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Related articles</h2>
              <ul className="list-disc list-inside space-y-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link className="text-primary hover:underline" to={`/news/${item.slug}`}>
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default NewsArticlePage;
