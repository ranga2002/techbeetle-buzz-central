import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatLocalTime, pickTimeZone } from "@/lib/time";
import { ArrowLeft, ExternalLink, ShoppingCart, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ReviewRecord = any;
type ReviewDetails = any;
type PurchaseLink = any;

const ReviewDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [review, setReview] = useState<ReviewRecord | null>(null);
  const [details, setDetails] = useState<ReviewDetails | null>(null);
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);

      const { data: reviewData } = await supabase
        .from("content")
        .select("*, categories(*), profiles(*)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!reviewData) {
        toast({
          title: "Review not found",
          description: "Returning to reviews.",
          duration: 3000,
        });
        navigate("/reviews", { replace: true });
        return;
      }

      setReview(reviewData);

      const [{ data: detailData }, { data: purchaseData }] = await Promise.all([
        supabase.from("review_details").select("*").eq("content_id", reviewData.id).maybeSingle(),
        supabase
          .from("purchase_links")
          .select("*")
          .eq("content_id", reviewData.id)
          .order("is_primary", { ascending: false }),
      ]);

      setDetails(detailData || null);
      setPurchaseLinks(purchaseData || []);
      setLoading(false);
      // Increment views
      if (reviewData?.id) {
        await supabase.rpc("increment_content_views", { content_id_param: reviewData.id });
      }
    };

    load();
  }, [slug, navigate, toast]);

  const pageTitle = review ? `${review.title} | TechBeetle Reviews` : "Review | TechBeetle";
  const publishTime = review?.published_at
    ? formatLocalTime(review.published_at, pickTimeZone(review.source_country || review.categories?.country))
    : "";
  const ratingValue = details?.overall_rating;

  const specs = useMemo(() => {
    if (!details?.specifications || typeof details.specifications !== "object") return [];
    return Object.entries(details.specifications as Record<string, string>);
  }, [details]);
  const images = details?.images || [];

  const pros = details?.pros || [];
  const cons = details?.cons || [];

  const heroImage =
    review?.featured_image ||
    details?.images?.[0] ||
    "https://placehold.co/1200x700?text=TechBeetle+Review";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={review?.excerpt || review?.summary || "TechBeetle review"} />
        <link
          rel="canonical"
          href={
            review?.slug ? `https://techbeetle.org/reviews/${review.slug}` : "https://techbeetle.org/reviews"
          }
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={review?.excerpt || review?.summary || ""} />
        <meta property="og:image" content={heroImage} />
        <meta property="article:published_time" content={review?.published_at || ""} />
        <meta property="article:modified_time" content={review?.updated_at || review?.published_at || ""} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={review?.excerpt || review?.summary || ""} />
        <meta name="twitter:image" content={heroImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://techbeetle.org/" },
              { "@type": "ListItem", position: 2, name: "Reviews", item: "https://techbeetle.org/reviews" },
              review?.title
                ? { "@type": "ListItem", position: 3, name: review.title, item: `https://techbeetle.org/reviews/${review.slug}` }
                : null,
            ].filter(Boolean),
          })}
        </script>
        {review && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Review",
              itemReviewed: {
                "@type": "Product",
                name: details?.product_name || review.title,
                brand: details?.brand,
                model: details?.model,
                image: heroImage,
                offers: purchaseLinks?.[0]
                  ? {
                      "@type": "Offer",
                      price: purchaseLinks[0].price,
                      priceCurrency: purchaseLinks[0].currency || "USD",
                      url: purchaseLinks[0].product_url,
                      availability: purchaseLinks[0].availability_status || "InStock",
                    }
                  : undefined,
              },
              author: {
                "@type": "Person",
                name: review.profiles?.full_name || review.profiles?.username || "TechBeetle",
              },
              reviewRating: ratingValue
                ? { "@type": "Rating", ratingValue, bestRating: 5, worstRating: 1 }
                : undefined,
              datePublished: review.published_at,
              headline: review.title,
              reviewBody: review.content || review.excerpt || review.summary || "",
            })}
          </script>
        )}
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/reviews")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to reviews
          </Button>
          {publishTime && <span className="text-xs text-muted-foreground">{publishTime}</span>}
        </div>

        {loading || !review ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-80" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-4">
                <img
                  src={heroImage}
                  alt={details?.product_name || review.title}
                  className="w-full rounded-3xl object-cover"
                  loading="eager"
                />
                {images.length > 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {images.slice(1, 3).map((img: string) => (
                      <img
                        key={img}
                        src={img}
                        alt={`${details?.product_name || review.title} gallery`}
                        className="w-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {review.categories?.name && (
                    <Badge variant="secondary">{review.categories.name}</Badge>
                  )}
                  {review.source_country && (
                    <Badge variant="outline">{review.source_country.toUpperCase()}</Badge>
                  )}
                  {details?.overall_rating && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {details.overall_rating}/5
                    </Badge>
                  )}
                </div>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <h1 className="text-4xl font-bold leading-tight">{review.title}</h1>
                  <p className="text-muted-foreground text-lg">{review.excerpt || review.summary}</p>
                  <div className="space-y-4 text-foreground">
                    {(review.content || "")
                      .split("\n\n")
                      .filter((p: string) => p.trim().length > 0)
                      .map((p: string, idx: number) => (
                        <p key={idx}>{p.trim()}</p>
                      ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Star className="w-4 h-4 text-primary" />
                      Snapshot
                    </div>
                    <div className="space-y-2 text-sm">
                      {details?.product_name && (
                        <p className="font-semibold text-foreground">
                          {details.product_name} {details.model ? `(${details.model})` : ""}{" "}
                          {details.brand && `— ${details.brand}`}
                        </p>
                      )}
                      {details?.overall_rating && (
                        <p className="text-muted-foreground">Rating: {details.overall_rating}/5</p>
                      )}
                      {review.reading_time && (
                        <p className="text-muted-foreground">Read time: {review.reading_time} min</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {pros.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-2">
                      <p className="text-sm font-semibold">Pros</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                        {pros.map((p: string) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {cons.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-2">
                      <p className="text-sm font-semibold">Cons</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                        {cons.map((c: string) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {specs.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-2">
                      <p className="text-sm font-semibold">Key specs</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {specs.map(([label, value]) => (
                          <div key={label} className="flex flex-col">
                            <span className="text-foreground font-medium">{label}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {purchaseLinks.length > 0 && (
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                        Where to buy
                      </div>
                      <div className="space-y-2">
                        {purchaseLinks.map((link) => (
                          <Button
                            key={link.product_url}
                            variant={link.is_primary ? "default" : "outline"}
                            className="w-full justify-between"
                            onClick={() => window.open(link.product_url, "_blank", "noopener")}
                          >
                            <span>{link.retailer_name}</span>
                            <span className="flex items-center gap-1 text-sm">
                              {link.price ? `$${Number(link.price).toFixed(2)}` : "See offer"}
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReviewDetailPage;
