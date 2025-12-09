import React from 'react';
import { Helmet } from 'react-helmet-async';

type ArticleProps = {
  headline: string;
  description?: string;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string;
  siteName?: string;
};

export const ArticleJsonLd: React.FC<ArticleProps> = ({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = 'TechBeetle',
  siteName = 'TechBeetle',
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: image ? [image] : undefined,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: `${url.split('/news/')[0]}/favicon.ico` },
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

type ProductProps = {
  name: string;
  description?: string;
  url: string;
  image?: string | null;
  brand?: string;
  price?: number | null;
  currency?: string;
  availability?: string;
};

export const ProductJsonLd: React.FC<ProductProps> = ({
  name,
  description,
  url,
  image,
  brand,
  price,
  currency = 'USD',
  availability = 'https://schema.org/InStock',
}) => {
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name,
    description,
    image: image ? [image] : undefined,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    offers:
      price != null
        ? {
            '@type': 'Offer',
            priceCurrency: currency,
            price,
            availability,
            url,
          }
        : undefined,
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

type ReviewProps = {
  name: string;
  url: string;
  image?: string | null;
  description?: string;
  authorName?: string;
  ratingValue?: number;
  bestRating?: number;
  worstRating?: number;
};

export const ReviewJsonLd: React.FC<ReviewProps> = ({
  name,
  url,
  image,
  description,
  authorName = 'TechBeetle',
  ratingValue,
  bestRating = 5,
  worstRating = 1,
}) => {
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name,
      image: image ? [image] : undefined,
      description,
    },
    author: { '@type': 'Person', name: authorName },
    url,
    datePublished: new Date().toISOString(),
  };

  if (ratingValue != null) {
    jsonLd.reviewRating = {
      '@type': 'Rating',
      ratingValue,
      bestRating,
      worstRating,
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};
