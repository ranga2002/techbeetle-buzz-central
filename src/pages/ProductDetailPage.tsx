import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ExternalLink } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product?.title || "Product"}</title>
        {product?.excerpt && (
          <meta name="description" content={product.excerpt} />
        )}
        {product?.featured_image && (
          <meta property="og:image" content={product.featured_image} />
        )}
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
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
          <article className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
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
              <h1 className="text-3xl font-bold leading-tight">
                {product.title}
              </h1>
              {product.excerpt && (
                <p className="text-muted-foreground">{product.excerpt}</p>
              )}
            </div>

            {product.featured_image && (
              <div className="overflow-hidden rounded-2xl border">
                <img
                  src={product.featured_image}
                  alt={product.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {displayPrice && (
                <div className="text-3xl font-semibold text-green-600">
                  {displayPrice}
                </div>
              )}
              {primaryLink?.product_url && (
                <Button
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={() => window.open(primaryLink.product_url || "", "_blank")}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Buy now
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>

            {product.content && (
              <div
                className="prose prose-slate dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: product.content }}
              />
            )}

            {product.purchase_links && product.purchase_links.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Other purchase options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.purchase_links.map((link, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => window.open(link.product_url || "", "_blank")}
                    >
                      {link.retailer_name || "Retailer"}
                      {link.price !== null && link.price !== undefined && (
                        <span className="text-muted-foreground">
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: link.currency || "USD",
                            maximumFractionDigits: 0,
                          }).format(link.price || 0)}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
