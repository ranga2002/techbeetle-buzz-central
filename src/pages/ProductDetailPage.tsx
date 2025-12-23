import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ExternalLink, ArrowLeft } from "lucide-react";
import { ProductJsonLd } from "@/components/seo/StructuredData";

type PurchaseLink = {
  retailer_name: string | null;
  product_url: string | null;
  price: number | null;
  currency?: string | null;
  is_primary?: boolean | null;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  content_type?: string | null;
  published_at?: string | null;
  categories?: { name: string; slug: string; color?: string | null } | null;
  purchase_links?: PurchaseLink[];
  inventory?: {
    id: string;
    price?: number | null;
    images?: string[] | null;
    affiliate_url?: string | null;
    source_url?: string | null;
    specs?: Record<string, unknown> | null;
  } | null;
};

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("content")
        .select(
          `
            *,
            categories(*),
            purchase_links(*),
            inventory:inventory_id (*)
          `,
        )
        .eq("slug", slug)
        .eq("content_type", "product")
        .eq("status", "published")
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else if (!data) {
        setError("Product not found");
      } else {
        setProduct(data as Product);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  const primaryLink = useMemo(
    () =>
      product?.purchase_links?.find((l) => l.is_primary) ||
      product?.purchase_links?.[0],
    [product],
  );

  const displayPrice = useMemo(() => {
    const price = primaryLink?.price ?? product?.inventory?.price ?? null;
    if (price === null || price === undefined) return null;
    const currency = primaryLink?.currency || "USD";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  }, [primaryLink, product?.inventory?.price]);

  const heroImage = product?.featured_image || product?.inventory?.images?.[0];
  const gallery = product?.inventory?.images || (product?.featured_image ? [product.featured_image] : []);
  const specsEntries = product?.inventory?.specs
    ? Object.entries(product.inventory.specs).filter(([_, v]) => Boolean(v))
    : [];
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const canonical = product?.slug ? `${siteUrl.replace(/\/+$/, "")}/products/${product.slug}` : undefined;
  const metaDescription =
    product?.excerpt ||
    (product?.content ? product.content.slice(0, 155) : undefined) ||
    "Explore product details, specs, and buying options on Tech Beetle.";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product?.title || "Product"}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product?.title || "Product"} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
        {canonical && <meta property="og:url" content={canonical} />}
        {(heroImage || product?.featured_image) && (
          <meta property="og:image" content={heroImage || product?.featured_image || ""} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product?.title || "Product"} />
        {metaDescription && <meta name="twitter:description" content={metaDescription} />}
        {(heroImage || product?.featured_image) && (
          <meta name="twitter:image" content={heroImage || product?.featured_image || ""} />
        )}
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="aspect-video" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && product && (
          <article className="space-y-8">
            {product && canonical && (
              <ProductJsonLd
                name={product.title}
                description={metaDescription || undefined}
                url={canonical}
                image={heroImage}
                brand={product.categories?.name}
                price={primaryLink?.price ?? product.inventory?.price ?? undefined}
                currency={primaryLink?.currency || "USD"}
                availability="https://schema.org/InStock"
              />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              <Link to="/products" className="hover:text-primary transition-colors">Back to products</Link>
            </div>

            <div className="rounded-3xl border bg-gradient-to-br from-card via-background to-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {product.categories?.name && (
                  <Badge
                    variant="outline"
                    style={
                      product.categories.color
                        ? {
                            backgroundColor: `${product.categories.color}20`,
                            color: product.categories.color,
                          }
                        : undefined
                    }
                  >
                    {product.categories.name}
                  </Badge>
                )}
                <Badge variant="secondary">Product</Badge>
                {product.published_at && (
                  <span className="text-sm text-muted-foreground">
                    Published {new Date(product.published_at).toDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h1 className="text-4xl font-bold leading-tight">{product.title}</h1>
                  {product.excerpt && (
                    <p className="text-lg text-muted-foreground">{product.excerpt}</p>
                  )}
                  {heroImage && (
                    <div className="overflow-hidden rounded-2xl border">
                      <img
                        src={heroImage}
                        alt={product.title}
                        className="w-full object-cover"
                      />
                    </div>
                  )}
                  {gallery && gallery.length > 1 && (
                    <div className="flex flex-wrap gap-3">
                      {gallery.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${product.title}-${idx}`}
                          className="w-24 h-24 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="text-sm text-muted-foreground">Starting at</div>
                    <div className="text-3xl font-semibold text-green-600 mt-1">
                      {displayPrice || "—"}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Prices may vary by retailer and region.
                    </p>
                    {primaryLink?.product_url && (
                      <Button
                        size="lg"
                        className="w-full mt-4 flex items-center gap-2"
                        onClick={() => window.open(primaryLink.product_url || "", "_blank")}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy now
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {specsEntries.length > 0 && (
                    <div className="rounded-2xl border bg-card p-5 space-y-3">
                      <h3 className="text-lg font-semibold">Key specs</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {specsEntries.map(([key, val]) => (
                          <div key={key} className="flex flex-col rounded-lg border bg-muted/40 px-3 py-2">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-medium text-foreground">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {product.content && (
                  <div className="rounded-2xl border bg-card p-6">
                    <div
                      className="prose prose-slate dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.content }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {product.purchase_links && product.purchase_links.length > 0 && (
                  <div className="rounded-2xl border bg-card p-5 space-y-3">
                    <h3 className="text-lg font-semibold">Purchase options</h3>
                    <div className="space-y-2">
                      {product.purchase_links.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{link.retailer_name || "Retailer"}</span>
                            {link.price !== null && link.price !== undefined && (
                              <span className="text-sm text-muted-foreground">
                                {new Intl.NumberFormat(undefined, {
                                  style: "currency",
                                  currency: link.currency || "USD",
                                  maximumFractionDigits: 0,
                                }).format(link.price || 0)}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(link.product_url || "", "_blank")}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
