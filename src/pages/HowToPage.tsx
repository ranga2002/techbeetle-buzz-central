
import React, { useMemo, useState } from 'react';
import { useContent } from '@/hooks/useContent';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Laptop, Smartphone, Headphones, ChevronsRight } from 'lucide-react';

const deviceOptions = [
  { value: 'laptop', label: 'Laptop', icon: <Laptop className="w-4 h-4" /> },
  { value: 'phone', label: 'Phone', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'audio', label: 'Audio', icon: <Headphones className="w-4 h-4" /> },
];

const osOptions = {
  laptop: [
    { value: 'mac', label: 'macOS' },
    { value: 'windows', label: 'Windows' },
    { value: 'linux', label: 'Linux' },
  ],
  phone: [
    { value: 'ios', label: 'iOS' },
    { value: 'android', label: 'Android' },
  ],
  audio: [
    { value: 'anc', label: 'Noise cancelling' },
    { value: 'studio', label: 'Studio/monitor' },
    { value: 'gaming', label: 'Gaming' },
  ],
};

const brandOptions = {
  windows: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft'],
  mac: ['MacBook Air', 'MacBook Pro 14', 'MacBook Pro 16'],
  ios: ['iPhone 16', 'iPhone 15', 'iPhone SE'],
  android: ['Samsung', 'Pixel', 'OnePlus', 'Xiaomi'],
  anc: ['Sony', 'Bose', 'Sennheiser', 'Apple'],
  studio: ['Audio-Technica', 'Beyerdynamic', 'Sennheiser'],
  gaming: ['SteelSeries', 'Razer', 'Corsair'],
};

const specOptions = {
  laptop: {
    processor: ['M3', 'M3 Pro', 'M3 Max', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'Ryzen 7'],
    ram: ['8GB', '16GB', '32GB', '64GB'],
    storage: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'],
  },
  phone: {
    storage: ['128GB', '256GB', '512GB'],
    battery: ['4,500mAh', '5,000mAh', '5,500mAh'],
  },
  audio: {
    connectivity: ['Bluetooth 5.3', 'USB-C wired', 'Dual wireless/wired'],
    features: ['ANC', 'Transparency', 'Spatial audio'],
  },
};

const HowToPage = () => {
  const { useContentQuery } = useContent();
  const { data: howToContent, isLoading } = useContentQuery({
    contentType: 'how_to',
    limit: 12,
  });

  const [device, setDevice] = useState<string>('laptop');
  const [os, setOs] = useState<string>('windows');
  const [brand, setBrand] = useState<string>('');
  const [spec, setSpec] = useState<Record<string, string>>({});

  const osList = osOptions[device] || [];
  const brandList = brandOptions[os] || [];
  const specsForDevice = specOptions[device] || {};

  const summary = useMemo(() => {
    const specStrings = Object.entries(spec)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    return [
      device ? `Device: ${device}` : null,
      os ? `Platform: ${os}` : null,
      brand ? `Brand: ${brand}` : null,
      ...specStrings,
    ].filter(Boolean).join(' • ');
  }, [device, os, brand, spec]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="rounded-3xl border bg-card/60 backdrop-blur px-6 py-8 shadow-sm">
          <div className="flex items-start gap-3">
            <Badge variant="secondary">How-To Guides</Badge>
            <div>
              <h1 className="text-4xl font-bold mb-2">Step-by-step tech helpers</h1>
              <p className="text-muted-foreground text-lg">
                Build a guided path to the right gadget: pick category, platform, brand, and specs to get a tailored how-to.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Guided chooser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Device</p>
                  <div className="grid grid-cols-2 gap-2">
                    {deviceOptions.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={device === opt.value ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => {
                          setDevice(opt.value);
                          setOs(osOptions[opt.value]?.[0]?.value || '');
                          setBrand('');
                          setSpec({});
                        }}
                      >
                        {opt.icon}
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Platform</p>
                  <Select
                    value={os}
                    onValueChange={(v) => {
                      setOs(v);
                      setBrand('');
                      setSpec({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose OS" />
                    </SelectTrigger>
                    <SelectContent>
                      {osList.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Brand / Series</p>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandList.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Specs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(specsForDevice).map(([key, values]) => (
                      <Select
                        key={key}
                        value={spec[key] || ''}
                        onValueChange={(v) => setSpec((prev) => ({ ...prev, [key]: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={key} />
                        </SelectTrigger>
                        <SelectContent>
                          {values.map((v: string) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="bg-muted/40 border-dashed">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Current path</p>
                  <p className="text-foreground font-semibold">
                    {summary || 'Start selecting options to build your guide.'}
                  </p>
                </CardContent>
              </Card>

              <Button asChild size="lg" className="w-full">
                <Link to="/search?q=how%20to%20set%20up%20laptop">
                  Find guides for this setup
                  <ChevronsRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Featured how-to guides</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                ) : howToContent?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {howToContent.map((item) => (
                      <ContentCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        excerpt={item.excerpt || undefined}
                        featuredImage={item.featured_image || undefined}
                        contentType={item.content_type}
                        category={item.categories as any}
                        author={item.profiles as any}
                        viewsCount={item.views_count || 0}
                        likesCount={item.likes_count || 0}
                        readingTime={item.reading_time || undefined}
                        publishedAt={item.published_at || undefined}
                        onClick={() => {
                          window.location.href = `/how-to/${item.slug || ''}`;
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No guides yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowToPage;
