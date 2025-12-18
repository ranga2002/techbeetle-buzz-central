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
import {
  BadgeCheck,
  Database,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <Helmet>
        <title>Privacy Policy | Tech Beetle</title>
        <meta
          name="description"
          content="See how Tech Beetle handles Google user data, what we collect, and the controls you have to access or delete it."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techbeetle.org/privacy-policy" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Privacy Policy",
            url: "https://techbeetle.org/privacy-policy",
            description:
              "Tech Beetle's Privacy Policy details how we collect, use, store, and protect Google user data and other personal information.",
          })}
        </script>
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
              Trust & Privacy
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Tech Beetle is built to keep your data minimal, protected, and within your control.
              This page explains what we collect, how we use it (especially Google Sign-In data),
              and the rights you have over your information.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Minimal by design",
                  description: "We collect only what is required to sign you in, personalize content, and keep Tech Beetle secure.",
                  icon: ShieldCheck,
                },
                {
                  title: "No resale or ads",
                  description: "Your Google user data is never sold, rented, or used to build advertising profiles.",
                  icon: Lock,
                },
                {
                  title: "Clear controls",
                  description: "Request access or deletion anytime via support@techbeetle.org.",
                  icon: BadgeCheck,
                },
                {
                  title: "Secured storage",
                  description: "Data lives on Supabase with access controls, encryption in transit, and least-privilege access.",
                  icon: Sparkles,
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
          </div>

          <Card className="border-primary/30 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle>Need something specific?</CardTitle>
              <CardDescription>
                We respond to privacy questions and data requests quickly—most within one business day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Privacy inbox</p>
                  <a className="text-primary hover:underline" href="mailto:support@techbeetle.org">
                    support@techbeetle.org
                  </a>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Include the email tied to your Tech Beetle account so we can verify ownership when processing requests.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="border bg-card/80">
          <CardHeader>
            <CardTitle>What we collect</CardTitle>
            <CardDescription>
              Only the signals we need to run Tech Beetle, personalize content, and keep your account safe.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Google Sign-In data",
                icon: UserCheck,
                items: [
                  "Name, email address, and profile image provided by Google to create and personalize your Tech Beetle profile.",
                  "Google account identifier strictly for authentication tokens and preventing duplicate accounts.",
                ],
              },
              {
                title: "Product signals you choose",
                icon: Database,
                items: [
                  "Bookmarks, reading history, saved preferences, and notifications settings to personalize your feed.",
                  "High-level engagement analytics (e.g., pages viewed, feature usage) in aggregate to improve content quality.",
                ],
              },
              {
                title: "Security & reliability data",
                icon: ShieldCheck,
                items: [
                  "IP address, device/browser type, and logs captured to detect abuse, maintain reliability, and defend the service.",
                  "Session cookies and auth tokens to keep you signed in securely.",
                ],
              },
            ].map((section) => (
              <div key={section.title} className="space-y-3 rounded-xl border p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <section.icon className="h-5 w-5 text-primary" />
                  <p className="font-semibold">{section.title}</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border bg-card/80">
          <CardHeader>
            <CardTitle>How we use data</CardTitle>
            <CardDescription>
              Focused on operating Tech Beetle, personalizing content, and protecting the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Run the product",
                items: [
                  "Authenticate you with Google Sign-In and keep sessions active.",
                  "Display your profile details (name, avatar) where relevant.",
                  "Deliver saved items, preferences, and notifications you opt into.",
                ],
              },
              {
                title: "Improve experience",
                items: [
                  "Measure performance and reliability of features you use.",
                  "Prioritize content and product improvements using aggregated analytics.",
                  "Prevent spam, fraud, or misuse that could affect other readers.",
                ],
              },
              {
                title: "Compliance & support",
                items: [
                  "Respond to support tickets you submit.",
                  "Meet legal obligations or enforce our Terms when required.",
                  "Communicate important service changes or policy updates.",
                ],
              },
            ].map((section) => (
              <div key={section.title} className="rounded-xl border p-4 shadow-sm">
                <p className="font-semibold mb-2">{section.title}</p>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Your controls & choices</CardTitle>
              <CardDescription>
                You stay in charge of your data. Reach out any time for a copy, a change, or deletion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <span className="font-medium text-foreground">Access & export:</span> Email{" "}
                  <a className="text-primary hover:underline" href="mailto:support@techbeetle.org">
                    support@techbeetle.org
                  </a>{" "}
                  to request a copy of your data.
                </li>
                <li>
                  <span className="font-medium text-foreground">Deletion:</span> Request deletion anytime. We remove
                  personal data from active systems; backups age out on their normal schedule.
                </li>
                <li>
                  <span className="font-medium text-foreground">Preferences:</span> Update notifications, saved content,
                  and personalization inside Tech Beetle or by contacting us.
                </li>
                <li>
                  <span className="font-medium text-foreground">Opt-outs:</span> You can opt out of non-essential emails
                  or notifications in your settings or through unsubscribe links.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Security practices</CardTitle>
              <CardDescription>
                Safeguards focused on protecting Google user data and everything tied to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>Supabase-managed infrastructure with access controls and audit logging.</li>
                <li>Encryption in transit (HTTPS) and scoped credentials for production access.</li>
                <li>Principle of least privilege for team members handling support or operations.</li>
                <li>Continuous monitoring for abuse, session integrity, and anomalous logins.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Sharing & third parties</CardTitle>
              <CardDescription>
                We limit sharing to what is necessary to run Tech Beetle or comply with the law.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>We do not sell or rent Google user data or personal information—ever.</li>
                <li>
                  Service providers (e.g., Supabase for hosting/auth, analytics tools for product health) receive only the
                  minimum required to deliver their service under strict agreements.
                </li>
                <li>We may disclose data if required by applicable law, regulation, or valid legal request.</li>
                <li>
                  If you explicitly request it (e.g., press or partnership outreach), we will share only what you authorize.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Retention & deletion</CardTitle>
              <CardDescription>We keep data only as long as it is needed for your account or our obligations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>Google user data is retained while your account is active to operate Tech Beetle.</li>
                <li>When you request deletion, we remove personal data from active systems and schedule backup expiry.</li>
                <li>Aggregated analytics that do not identify you may be retained for product insights.</li>
                <li>We keep necessary records if law or compliance requires it (for example, fraud prevention).</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border bg-card/80">
          <CardHeader>
            <CardTitle>Policy updates & contact</CardTitle>
            <CardDescription>
              We will post updates here and highlight material changes inside Tech Beetle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              We may revise this Privacy Policy to reflect operational, legal, or regulatory changes. If updates are
              significant, we will provide a prominent notice or reach out through the email linked to your account.
            </p>
            <p>
              Questions about privacy or data handling? Reach us at{" "}
              <a className="text-primary hover:underline" href="mailto:support@techbeetle.org">
                support@techbeetle.org
              </a>
              .
            </p>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/80">
              Last updated: May 2025
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
