import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Globe, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";

type ContentRow = {
  content_type: string | null;
  status: string | null;
  is_indexable: boolean | null;
};

type SitemapInfo = {
  url: string;
  ok: boolean;
  urlCount: number;
  lastModified?: string | null;
  error?: string;
};

type TaggingStatus = {
  hasGtag: boolean;
  hasDataLayer: boolean;
  consentChoice?: string | null;
};

const ADMIN_SITE_URL = import.meta.env.VITE_SITE_URL || "https://techbeetle.org";

const SeoAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [contentStats, setContentStats] = useState<{
    total: number;
    indexable: number;
    byType: Record<string, number>;
  }>({ total: 0, indexable: 0, byType: {} });
  const [sitemaps, setSitemaps] = useState<{ main?: SitemapInfo; news?: SitemapInfo }>({});
  const [robotsOk, setRobotsOk] = useState<{ ok: boolean; message?: string }>({ ok: false });
  const [tagging, setTagging] = useState<TaggingStatus>({ hasGtag: false, hasDataLayer: false });
  const [error, setError] = useState<string | null>(null);

  const fetchContentStats = async () => {
    const { data, error: fetchError } = await supabase
      .from("content")
      .select("content_type,status,is_indexable");

    if (fetchError) throw new Error(fetchError.message);
    const rows = (data || []) as ContentRow[];
    const byType: Record<string, number> = {};
    let indexable = 0;
    rows.forEach((row) => {
      if (!row.content_type) return;
      byType[row.content_type] = (byType[row.content_type] || 0) + 1;
      if (row.status === "published" && row.is_indexable) indexable += 1;
    });
    setContentStats({ total: rows.length, indexable, byType });
  };

  const fetchSitemap = async (url: string): Promise<SitemapInfo> => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const count = (text.match(/<url>/g) || []).length;
      return {
        url,
        ok: res.ok,
        urlCount: count,
        lastModified: res.headers.get("last-modified"),
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (e: any) {
      return { url, ok: false, urlCount: 0, error: e?.message };
    }
  };

  const fetchRobots = async () => {
    try {
      const res = await fetch(`${ADMIN_SITE_URL.replace(/\/+$/, "")}/robots.txt`);
      const text = await res.text();
      const hasNews = text.includes("news-sitemap.xml");
      const hasMain = text.includes("sitemap.xml");
      setRobotsOk({ ok: res.ok && hasNews && hasMain, message: res.ok ? undefined : `HTTP ${res.status}` });
    } catch (e: any) {
      setRobotsOk({ ok: false, message: e?.message });
    }
  };

  const detectTagging = () => {
    if (typeof window === "undefined") return;
    const hasGtag = typeof (window as any).gtag === "function";
    const hasDataLayer = Array.isArray((window as any).dataLayer);
    const consentChoice = (typeof localStorage !== "undefined" && localStorage.getItem("tb-consent-choice")) || null;
    setTagging({ hasGtag, hasDataLayer, consentChoice });
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchContentStats();
      const [main, news] = await Promise.all([
        fetchSitemap(`${ADMIN_SITE_URL.replace(/\/+$/, "")}/sitemap.xml`),
        fetchSitemap(`${ADMIN_SITE_URL.replace(/\/+$/, "")}/news-sitemap.xml`),
      ]);
      setSitemaps({ main, news });
      await fetchRobots();
      detectTagging();
    } catch (e: any) {
      setError(e?.message || "Unable to load SEO data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const issues = useMemo(() => {
    const list: string[] = [];
    if (sitemaps.news && sitemaps.news.urlCount === 0) list.push("News sitemap has 0 URLs");
    if (sitemaps.main && sitemaps.main.urlCount === 0) list.push("Main sitemap has 0 URLs");
    if (!robotsOk.ok) list.push("robots.txt missing sitemap links or not reachable");
    if (!tagging.hasGtag) list.push("GA/gtag not detected on this page load");
    if (!tagging.hasDataLayer) list.push("GTM dataLayer not detected");
    return list;
  }, [sitemaps, robotsOk, tagging]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>SEO & Analytics | Admin</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO & Analytics</h1>
          <p className="text-muted-foreground">Live signals for sitemaps, robots, tagging, and indexable content.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Total content</CardTitle>
              <CardDescription>All rows in content</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-semibold">{contentStats.total}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Indexable (published)</CardTitle>
              <CardDescription>status=published & is_indexable</CardDescription>
            </div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-semibold">{contentStats.indexable}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Main sitemap URLs</CardTitle>
              <CardDescription>https://techbeetle.org/sitemap.xml</CardDescription>
            </div>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !sitemaps.main ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-semibold">{sitemaps.main.urlCount}</p>
                <p className="text-xs text-muted-foreground">
                  {sitemaps.main.ok ? "OK" : "Error"} {sitemaps.main.lastModified ? `• ${sitemaps.main.lastModified}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>News sitemap URLs</CardTitle>
              <CardDescription>https://techbeetle.org/news-sitemap.xml</CardDescription>
            </div>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !sitemaps.news ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-semibold">{sitemaps.news.urlCount}</p>
                <p className="text-xs text-muted-foreground">
                  {sitemaps.news.ok ? "OK" : "Error"} {sitemaps.news.lastModified ? `• ${sitemaps.news.lastModified}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indexable content by type</CardTitle>
          <CardDescription>Counts by content_type (all rows)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {loading ? (
            <>
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-24" />
            </>
          ) : (
            Object.entries(contentStats.byType).map(([type, count]) => (
              <Badge key={type} variant="secondary" className="text-sm">
                {type}: {count}
              </Badge>
            ))
          )}
          {!loading && Object.keys(contentStats.byType).length === 0 && (
            <p className="text-muted-foreground text-sm">No content found.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Robots & tagging</CardTitle>
            <CardDescription>robots.txt, GA/GTM presence, consent state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={robotsOk.ok ? "secondary" : "destructive"}>
                {robotsOk.ok ? "robots.txt OK" : "robots.txt issue"}
              </Badge>
              {!robotsOk.ok && <span className="text-sm text-muted-foreground">{robotsOk.message || "Missing sitemap links?"}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tagging.hasGtag ? "secondary" : "destructive"}>
                {tagging.hasGtag ? "GA/gtag detected" : "GA/gtag missing"}
              </Badge>
              <Badge variant={tagging.hasDataLayer ? "secondary" : "destructive"}>
                {tagging.hasDataLayer ? "GTM dataLayer present" : "dataLayer missing"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Consent choice (local): {tagging.consentChoice || "not set"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues</CardTitle>
            <CardDescription>Automatic checks from current fetch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </>
            ) : issues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <ShieldCheck className="h-4 w-4" />
                No blocking issues detected.
              </div>
            ) : (
              issues.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeoAnalytics;
