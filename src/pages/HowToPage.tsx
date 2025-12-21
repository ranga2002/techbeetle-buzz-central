import React, { useMemo, useState } from "react";
import { useContent } from "@/hooks/useContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContentCard from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Laptop,
  Smartphone,
  Headphones,
  Wrench,
  Clock,
  Filter,
  RefreshCw,
  BookOpen,
} from "lucide-react";

type LocalGuide = {
  id: string;
  title: string;
  summary: string;
  device: string;
  platform: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  tags: string[];
  steps: string[];
  prerequisites?: string[];
  tools?: string[];
  source?: string;
};

const deviceOptions = [
  { value: "laptop", label: "Laptop", icon: <Laptop className="w-4 h-4" /> },
  { value: "phone", label: "Phone", icon: <Smartphone className="w-4 h-4" /> },
  { value: "audio", label: "Audio", icon: <Headphones className="w-4 h-4" /> },
];

const osOptions: Record<string, { value: string; label: string }[]> = {
  laptop: [
    { value: "mac", label: "macOS" },
    { value: "windows", label: "Windows" },
    { value: "linux", label: "Linux" },
  ],
  phone: [
    { value: "ios", label: "iOS" },
    { value: "android", label: "Android" },
  ],
  audio: [
    { value: "anc", label: "Noise cancelling" },
    { value: "studio", label: "Studio/monitor" },
    { value: "gaming", label: "Gaming" },
  ],
};

const brandOptions: Record<string, string[]> = {
  windows: ["Dell XPS", "Lenovo ThinkPad", "ASUS Zephyrus", "Acer Swift", "HP Spectre"],
  mac: ["MacBook Air", "MacBook Pro 14", "MacBook Pro 16"],
  linux: ["Framework", "System76", "ThinkPad"],
  ios: ["iPhone 16", "iPhone 15", "iPhone SE"],
  android: ["Samsung Galaxy", "Pixel", "OnePlus", "Xiaomi"],
  anc: ["Sony WH-1000XM5", "Bose QC Ultra", "Sennheiser Momentum"],
  studio: ["Beyerdynamic DT 770", "Sennheiser HD600", "Audio-Technica M50x"],
  gaming: ["SteelSeries Arctis", "Razer BlackShark", "Corsair HS"],
};

const curatedGuides: LocalGuide[] = [
  {
    id: "guide-laptop-setup",
    title: "Set up a new laptop for productivity",
    summary: "Clean install, privacy-first tweaks, and performance checks for a brand-new laptop.",
    device: "laptop",
    platform: "windows",
    difficulty: "beginner",
    durationMinutes: 35,
    tags: ["setup", "privacy", "performance"],
    prerequisites: ["Stable internet", "8GB USB drive (optional)"],
    tools: ["Windows Update", "O&O ShutUp", "Ninite"],
    steps: [
      "Sign in with a local account or Microsoft account and run Windows Update.",
      "Remove bloatware via Apps & Features, then reboot.",
      "Enable Privacy & Security permissions to limit camera/microphone access.",
      "Install essentials with a package installer (Ninite) and reboot.",
      "Turn on BitLocker (Pro) or Device Encryption (Home) and save the recovery key.",
      "Create a restore point and back up drivers with system protection.",
    ],
    source: "Curated checklist",
  },
  {
    id: "guide-mac-battery",
    title: "Optimize macOS battery life",
    summary: "Dial in macOS settings to balance battery health and performance.",
    device: "laptop",
    platform: "mac",
    difficulty: "beginner",
    durationMinutes: 20,
    tags: ["battery", "mac", "maintenance"],
    prerequisites: ["macOS Sonoma or newer"],
    tools: ["System Settings", "Activity Monitor"],
    steps: [
      "System Settings > Battery: set Low Power on battery; enable Optimize Battery Charging.",
      "Disable Power Nap and wake for network access on battery.",
      "Reduce display sleep, enable auto-lock, and dim keyboard backlight.",
      "Activity Monitor: sort by Energy Impact; uninstall background-heavy apps.",
      "Disable unneeded menu bar agents and browser extensions; prefer efficient browsers.",
    ],
    source: "Apple platform best practices",
  },
  {
    id: "guide-android-privacy",
    title: "Harden Android privacy & security",
    summary: "Lock down permissions, tracking, and backups on a new Android phone.",
    device: "phone",
    platform: "android",
    difficulty: "intermediate",
    durationMinutes: 25,
    tags: ["privacy", "security", "android"],
    prerequisites: ["Android 13 or newer"],
    tools: ["Permission Manager", "Private DNS"],
    steps: [
      "Set a strong screen lock (PIN >6 digits) and enable biometrics.",
      "Privacy > Permission Manager: revoke background location/mic/camera for non-essential apps.",
      "Enable Private DNS (Quad9 or Cloudflare).",
      "Disable ad personalization and OEM analytics where possible.",
      "Remove or disable carrier/OEM bloat; keep only needed services.",
      "Enable automatic backups; test a restore once.",
    ],
    source: "Android security community guides",
  },
  {
    id: "guide-ios-setup",
    title: "iOS clean start with safety in mind",
    summary: "Reduce tracking, tighten iCloud, and set sensible defaults on a fresh iPhone.",
    device: "phone",
    platform: "ios",
    difficulty: "beginner",
    durationMinutes: 18,
    tags: ["privacy", "ios", "setup"],
    prerequisites: ["iOS 17 or newer"],
    tools: ["Screen Time", "iCloud Keychain"],
    steps: [
      "Privacy & Security: disable Significant Locations if not needed.",
      'Tracking: turn off "Allow Apps to Request to Track"; review existing toggles.',
      "Screen Time: set Downtime, app limits, and enable Communication Safety.",
      "iCloud: enable Advanced Data Protection; review app sync settings.",
      "Safari: enable cross-site tracking prevention and hide IP from trackers.",
      "Use a password manager (Keychain/Bitwarden) and enable passkeys where available.",
    ],
    source: "Apple security checklist",
  },
  {
    id: "guide-headphones-anc",
    title: "Dial in ANC headphones for travel",
    summary: "Fit, EQ, and firmware tweaks to get the best noise cancelling on flights.",
    device: "audio",
    platform: "anc",
    difficulty: "beginner",
    durationMinutes: 15,
    tags: ["audio", "travel", "anc"],
    prerequisites: ["Headphones with companion app"],
    tools: ["Headphone app", "Test tones"],
    steps: [
      "Update firmware; enable adaptive ANC if available.",
      "Test ear tips/pads for seal; re-run ANC fit test.",
      "Set a gentle V-shaped EQ or keep flat for neutral listening.",
      "Download offline noise tracks and playlists for flights.",
      "Disable touch controls during sleep to avoid accidental taps.",
    ],
    source: "Audio community playbook",
  },
];

const tagOptions = ["privacy", "battery", "setup", "performance", "audio", "travel", "security", "maintenance"];

const faqs = [
  {
    question: "How often are guides updated?",
    answer: "We refresh weekly and whenever major OS versions or security changes ship.",
  },
  {
    question: "Can I trust the steps for my exact device?",
    answer: "Use the device and platform filters to narrow to your hardware; curated notes cover common edge cases.",
  },
  {
    question: "What if I have only 15 minutes?",
    answer: "Slide the time budget down to 15-20 minutes and pick beginner difficulty to get shorter flows.",
  },
  {
    question: "Can I combine privacy and performance?",
    answer: "Yes. Select both tags; we rank guides that optimize for both without heavy trade-offs.",
  },
];

const HowToPage = () => {
  const { useContentQuery } = useContent();
  const { data: howToContent, isLoading } = useContentQuery({
    contentType: "how_to",
    limit: 12,
  });

  const [device, setDevice] = useState<string>("laptop");
  const [os, setOs] = useState<string>("windows");
  const [brand, setBrand] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"any" | LocalGuide["difficulty"]>("any");
  const [maxTime, setMaxTime] = useState<number>(45);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<LocalGuide | null>(curatedGuides[0]);

  const osList = osOptions[device] || [];
  const brandList = brandOptions[os] || [];

  const supabaseGuides: LocalGuide[] = useMemo(() => {
    return (howToContent || []).map((item) => {
      const rawContent = (item.content_raw || item.content || "") as string;
      const cleanSteps = rawContent
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|li)>/gi, "\n")
        .replace(/<[^>]*>/g, " ")
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 8);

      const tagsValue = item.tags;
      const parsedTags = Array.isArray(tagsValue)
        ? tagsValue
        : typeof tagsValue === "string"
          ? tagsValue.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

      const difficultyValue =
        (item as any)?.difficulty && ["beginner", "intermediate", "advanced"].includes((item as any).difficulty)
          ? ((item as any).difficulty as LocalGuide["difficulty"])
          : "intermediate";

      return {
        id: item.id,
        title: item.title,
        summary: item.excerpt || "Step-by-step guide",
        device: item.categories?.slug || "general",
        platform: item.categories?.slug || "general",
        difficulty: difficultyValue,
        durationMinutes: item.reading_time ? item.reading_time * 2 : 20,
        tags: parsedTags,
        steps: cleanSteps.length ? cleanSteps : ["Read the full guide for detailed steps."],
        prerequisites: [],
        tools: [],
        source: item.categories?.name || "TechBeetle",
      };
    });
  }, [howToContent]);

  const allGuides = useMemo(() => [...supabaseGuides, ...curatedGuides], [supabaseGuides]);

  const filteredGuides = useMemo(() => {
    return allGuides.filter((guide) => {
      const matchesDevice = guide.device === device || guide.device === "general";
      const matchesPlatform = guide.platform === os || guide.platform === "general";
      const matchesDifficulty = difficulty === "any" || guide.difficulty === difficulty;
      const matchesTime = guide.durationMinutes <= maxTime + 5;
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => guide.tags.includes(tag));
      const matchesSearch =
        !search ||
        guide.title.toLowerCase().includes(search.toLowerCase()) ||
        guide.summary.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = !brand || guide.summary.toLowerCase().includes(brand.toLowerCase());
      return matchesDevice && matchesPlatform && matchesDifficulty && matchesTime && matchesTags && matchesSearch && matchesBrand;
    });
  }, [allGuides, device, os, difficulty, maxTime, selectedTags, search, brand]);

  const summary = useMemo(() => {
    const pieces = [
      device && `Device: ${device}`,
      os && `Platform: ${os}`,
      brand && `Brand: ${brand}`,
      difficulty !== "any" && `Difficulty: ${difficulty}`,
      `Max time: ${maxTime} min`,
      selectedTags.length ? `Focus: ${selectedTags.join(", ")}` : null,
    ].filter(Boolean);
    return pieces.join(" | ");
  }, [device, os, brand, difficulty, maxTime, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const howToSchema = selectedGuide
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: selectedGuide.title,
        description: selectedGuide.summary,
        totalTime: `PT${selectedGuide.durationMinutes}M`,
        supply: selectedGuide.tools?.length
          ? selectedGuide.tools.map((tool) => ({ "@type": "HowToSupply", name: tool }))
          : undefined,
        step: selectedGuide.steps.map((step, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: step.slice(0, 60),
          text: step,
        })),
      }
    : null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>How-To Guides | Tech Beetle</title>
        <meta
          name="description"
          content="Build ready-to-run tech checklists by device, platform, and time budget. Curated and dynamic how-to guides for laptops, phones, and audio."
        />
        <link rel="canonical" href="https://techbeetle.org/how-to" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="How-To Guides | TechBeetle" />
        <meta
          property="og:description"
          content="Build ready-to-run tech checklists by device, platform, and time budget."
        />
        <meta property="og:url" content="https://techbeetle.org/how-to" />
        <meta property="og:image" content="https://techbeetle.org/favicon.ico" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How-To Guides | Tech Beetle" />
        <meta
          name="twitter:description"
          content="Curated and dynamic how-to guides for laptops, phones, and audio."
        />
        <meta name="twitter:image" content="https://techbeetle.org/favicon.ico" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://techbeetle.org/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "How-To",
                item: "https://techbeetle.org/how-to",
              },
            ],
          })}
        </script>
        {howToSchema && (
          <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        )}
        {faqs.length > 0 && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="rounded-3xl border bg-gradient-to-r from-background/70 via-card to-accent/5 backdrop-blur px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="outline" className="w-fit">How-To Guides</Badge>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold leading-tight">Build your tech playbook</h1>
                <p className="text-muted-foreground text-lg max-w-3xl">
                  Choose a device, platform, time budget, and focus area. We'll assemble a ready-to-run checklist with steps, tools, and prerequisites.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-4 h-4" /> Guided flows</Badge>
                <Badge variant="secondary" className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> Curated picks</Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">{summary || "Set your filters"}</Badge>
                <Button size="sm" variant="secondary" onClick={() => {
                  if (selectedGuide) {
                    navigator.clipboard?.writeText(`${window.location.origin}/how-to#${selectedGuide.id}`).catch(() => null);
                  }
                }}>
                  Share this setup
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto text-sm">
              <div className="rounded-2xl border bg-card px-5 py-4">
                <p className="text-muted-foreground">Guides available</p>
                <p className="text-2xl font-semibold">{allGuides.length}</p>
              </div>
              <div className="rounded-2xl border bg-card px-5 py-4">
                <p className="text-muted-foreground">Avg. completion time</p>
                <p className="text-2xl font-semibold">
                  ~{Math.round(allGuides.reduce((a, g) => a + g.durationMinutes, 0) / Math.max(allGuides.length, 1))} min
                </p>
              </div>
              <div className="rounded-2xl border bg-card px-5 py-4 col-span-2">
                <p className="text-muted-foreground">Top focuses</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs uppercase tracking-wide">
                  {tagOptions.slice(0, 6).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 self-start">
              <Button
                variant="outline"
                onClick={() => {
                  setDevice("laptop");
                  setOs("windows");
                  setBrand("");
                  setDifficulty("any");
                  setMaxTime(45);
                  setSelectedTags([]);
                  setSearch("");
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset filters
              </Button>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Filters update live - no separate search needed.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/50 shadow-sm lg:col-span-1">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Guide builder
              </CardTitle>
              <p className="text-sm text-muted-foreground">Set your constraints and we'll surface step-by-step walkthroughs.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Device</p>
                <div className="grid grid-cols-2 gap-2">
                  {deviceOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={device === opt.value ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => {
                        setDevice(opt.value);
                        setOs(osOptions[opt.value]?.[0]?.value || "general");
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Switch devices to reveal matching platforms and presets.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Platform</Label>
                <Select value={os} onValueChange={setOs}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {osList.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose the OS you actually run; results update immediately.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Brand / series</Label>
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
                <p className="text-xs text-muted-foreground">Pick your hardware line to surface device-specific tweaks. Leave blank for general guidance.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Keep Any to see everything, or lock a level to reduce complexity.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Max time to complete</span>
                  <span>{maxTime} min</span>
                </div>
                <Slider defaultValue={[45]} value={[maxTime]} max={120} step={5} onValueChange={(val) => setMaxTime(val[0])} />
                <p className="text-xs text-muted-foreground">Under 30 minutes for quick wins; raise it for deeper flows.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Focus tags</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tagOptions.map((tag) => (
                    <Label key={tag} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedTags.includes(tag)} onCheckedChange={() => handleTagToggle(tag)} />
                      {tag}
                    </Label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Select up to three tags; we prioritize guides matching all chosen focuses.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Keyword</Label>
                <Input placeholder="battery, privacy, travel..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <p className="text-xs text-muted-foreground">Use 1-2 keywords (e.g., battery, privacy) for sharper recommendations.</p>
              </div>

              <Card className="bg-muted/40 border-dashed">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Current path</p>
                  <p className="text-foreground font-semibold">{summary || "Start selecting options to build your guide."}</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Recommended how-to guides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredGuides.length === 0 ? (
                  <p className="text-muted-foreground">No guides match this combo yet. Try loosening filters.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGuides.map((guide) => (
                      <Card
                        key={guide.id}
                        className={`border ${selectedGuide?.id === guide.id ? "border-primary" : "border-border/60"} transition-colors`}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                {guide.platform} | {guide.difficulty}
                              </p>
                              <h3 className="text-lg font-semibold leading-tight">{guide.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{guide.summary}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary">{guide.durationMinutes} min</Badge>
                              <Button size="sm" variant="outline" onClick={() => setSelectedGuide(guide)}>
                                View steps
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {guide.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedGuide && (
              <Card className="border-border/60 shadow-lg">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    {selectedGuide.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{selectedGuide.difficulty}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedGuide.durationMinutes} min
                    </Badge>
                    {selectedGuide.source && <Badge variant="outline">{selectedGuide.source}</Badge>}
                  </div>
                  <p className="text-muted-foreground">{selectedGuide.summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedGuide.prerequisites && selectedGuide.prerequisites.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Prerequisites</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {selectedGuide.prerequisites.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedGuide.tools && selectedGuide.tools.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Tools / downloads</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGuide.tools.map((tool) => (
                          <Badge key={tool} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Step-by-step</p>
                    <ol className="list-decimal list-inside space-y-2 text-foreground/90">
                      {selectedGuide.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle>How-to FAQ</CardTitle>
                <p className="text-sm text-muted-foreground">Quick answers on cadence, device targeting, and combining filters.</p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, idx) => (
                    <AccordionItem key={faq.question} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

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
                          window.location.href = `/how-to/${item.slug || ""}`;
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
