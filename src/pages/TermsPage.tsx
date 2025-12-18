import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Scale, Shield, Sparkles } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <Helmet>
        <title>Terms of Service | Tech Beetle</title>
        <meta
          name="description"
          content="Understand the terms for using Tech Beetle—your responsibilities, our commitments, and how to stay within policy."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techbeetle.org/terms" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terms of Service",
            url: "https://techbeetle.org/terms",
            description:
              "Review the Terms of Service for Tech Beetle to understand your rights and responsibilities when using our platform.",
          })}
        </script>
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="space-y-4">
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
            Terms of Service
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Clear rules for using Tech Beetle
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            These Terms of Service ("Terms") explain how you can use Tech Beetle and what we expect from
            everyone on the platform. By accessing Tech Beetle, you agree to these rules and our Privacy Policy.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Plain-language first",
                description: "We keep legal language light so you can quickly understand what applies to you.",
                icon: Sparkles,
              },
              {
                title: "Respectful use",
                description: "No abuse, scraping, or attempts to harm the platform or community.",
                icon: Shield,
              },
              {
                title: "Transparency",
                description: "We highlight changes and let you know when Terms are updated.",
                icon: CheckCircle2,
              },
            ].map((item) => (
              <Card key={item.title} className="border-dashed bg-card/70 backdrop-blur">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-primary/80">
                      {item.title}
                    </span>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Card className="border bg-card/80">
          <CardHeader>
            <CardTitle>Using Tech Beetle</CardTitle>
            <CardDescription>What you agree to when you browse, read, or sign in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc list-inside">
              <li>You must be at least 16 (or have guardian consent where required) to use the service.</li>
              <li>Keep your account credentials secure and notify us if you suspect unauthorized access.</li>
              <li>Do not misuse the platform: no scraping, automated account creation, spam, or attempts to disrupt service.</li>
              <li>Information you share should be accurate and lawful; you remain responsible for your activity on Tech Beetle.</li>
              <li>By using Tech Beetle you also accept our <a className="text-primary hover:underline" href="/privacy-policy">Privacy Policy</a>.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Content & intellectual property</CardTitle>
              <CardDescription>Respect the rights tied to Tech Beetle content and brand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>Articles, videos, branding, and site assets belong to Tech Beetle or its partners.</li>
                <li>You may not copy, redistribute, or commercialize content without written permission.</li>
                <li>Feedback you share can be used to improve Tech Beetle without additional compensation.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Accounts, security, and termination</CardTitle>
              <CardDescription>How we handle accounts and when access can be limited.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>We reserve the right to suspend or terminate accounts that break these Terms or our security standards.</li>
                <li>We may modify or discontinue features with notice when possible; core obligations remain intact.</li>
                <li>You can stop using Tech Beetle at any time and request data deletion per the Privacy Policy.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Disclaimers & limits of liability</CardTitle>
              <CardDescription>We do our best to provide accurate content, but some limits apply.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>Tech Beetle is provided “as is” without warranties of fitness for a particular purpose.</li>
                <li>We do not guarantee uninterrupted access, error-free content, or third-party links.</li>
                <li>To the extent permitted by law, Tech Beetle is not liable for indirect, incidental, or consequential damages.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Changes, disputes, and contact</CardTitle>
              <CardDescription>How we communicate updates and handle questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>We will post updates to these Terms and highlight material changes within Tech Beetle.</li>
                <li>Continued use after changes means you accept the updated Terms.</li>
                <li>For questions or disputes, contact{" "}
                  <a className="text-primary hover:underline" href="mailto:support@techbeetle.org">
                    support@techbeetle.org
                  </a>. We aim to respond within one business day.
                </li>
                <li>These Terms are governed by applicable local law where Tech Beetle is operated.</li>
              </ul>
              <div className="flex items-center gap-3 pt-2">
                <Scale className="h-5 w-5 text-primary" />
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/80">
                  Last updated: May 2025
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
